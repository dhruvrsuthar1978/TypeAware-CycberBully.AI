#!/bin/bash

# TypeAware Backend Production Setup Script
# This script helps set up production environment

set -e

echo "🚀 TypeAware Backend Production Setup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Docker and Docker Compose are available"
}

# Generate secure secrets
generate_secrets() {
    log_info "Generating secure secrets..."
    
    if [ ! -f .env.production ]; then
        JWT_SECRET=$(openssl rand -hex 32)
        REFRESH_TOKEN_SECRET=$(openssl rand -hex 32)
        MONGO_ROOT_PASSWORD=$(openssl rand -hex 16)
        
        cat > .env.production << EOF
# TypeAware Backend Production Environment

# Server Configuration
NODE_ENV=production
PORT=3001

# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=$MONGO_ROOT_PASSWORD
MONGODB_URI=mongodb://admin:$MONGO_ROOT_PASSWORD@typeaware-mongo:27017/typeaware?authSource=admin

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET

# Frontend URL (update this!)
FRONTEND_URL=https://yourdomain.com

# Admin Configuration
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
DEFAULT_ADMIN_PASSWORD=$(openssl rand -hex 12)

# Security
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
REPORT_RATE_LIMIT_WINDOW_MS=60000
REPORT_RATE_LIMIT_MAX_REQUESTS=10
EOF
        
        log_success "Generated .env.production file with secure secrets"
        log_warning "IMPORTANT: Update FRONTEND_URL and DEFAULT_ADMIN_EMAIL in .env.production"
    else
        log_info ".env.production already exists, skipping secret generation"
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p nginx
    mkdir -p scripts
    
    log_success "Directories created"
}

# Create nginx configuration
create_nginx_config() {
    log_info "Creating nginx configuration..."
    
    if [ ! -f nginx/nginx.conf ]; then
        cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream typeaware_api {
        server typeaware-api:3001;
    }
    
    server {
        listen 80;
        server_name _;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-Content-Type-Options "nosniff";
        add_header X-XSS-Protection "1; mode=block";
        add_header Referrer-Policy "strict-origin-when-cross-origin";
        
        # API proxy
        location /api/ {
            proxy_pass http://typeaware_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS headers
            add_header Access-Control-Allow-Origin "https://yourdomain.com" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
            
            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }
        
        # Health check
        location /health {
            proxy_pass http://typeaware_api;
            access_log off;
        }
        
        # Default response
        location / {
            return 404 '{"error": "Not Found", "message": "TypeAware API - Use /api/ endpoints"}';
            add_header Content-Type application/json;
        }
    }
}
EOF
        log_success "Nginx configuration created"
        log_warning "Update 'yourdomain.com' in nginx/nginx.conf with your actual domain"
    else
        log_info "nginx.conf already exists, skipping creation"
    fi
}

# Create MongoDB initialization script
create_mongo_init() {
    log_info "Creating MongoDB initialization script..."
    
    if [ ! -f scripts/mongo-init.js ]; then
        cat > scripts/mongo-init.js << 'EOF'
// MongoDB initialization script for TypeAware

print('Initializing TypeAware database...');

// Switch to typeaware database
db = db.getSiblingDB('typeaware');

// Create indexes for better performance
print('Creating indexes...');

// User indexes
db.users.createIndex({ "email": 1 }, { "unique": true });
db.users.createIndex({ "username": 1 }, { "unique": true });
db.users.createIndex({ "browserUUIDs.uuid": 1 });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });

// Report indexes
db.reports.createIndex({ "browserUUID": 1, "createdAt": -1 });
db.reports.createIndex({ "userId": 1, "createdAt": -1 });
db.reports.createIndex({ "context.platform": 1 });
db.reports.createIndex({ "classification.category": 1 });
db.reports.createIndex({ "status": 1 });
db.reports.createIndex({ "content.severity": 1 });
db.reports.createIndex({ "createdAt": -1 });

// Compound indexes
db.reports.createIndex({ "status": 1, "classification.category": 1 });
db.reports.createIndex({ "context.platform": 1, "classification.category": 1 });

print('Database initialization completed successfully!');
EOF
        log_success "MongoDB initialization script created"
    else
        log_info "mongo-init.js already exists, skipping creation"
    fi
}

# Build and start services
start_services() {
    log_info "Building and starting services..."
    
    # Use production environment file
    export $(grep -v '^#' .env.production | xargs)
    
    # Build and start containers
    docker-compose --env-file .env.production up -d --build
    
    log_success "Services started successfully!"
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    # Wait for API to be ready
    for i in {1..30}; do
        if docker-compose exec -T typeaware-api node scripts/healthcheck.js > /dev/null 2>&1; then
            log_success "API is ready!"
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_error "API failed to start within 5 minutes"
            docker-compose logs typeaware-api
            exit 1
        fi
        
        echo -n "."
        sleep 10
    done
}

# Create admin user
create_admin_user() {
    log_info "Creating admin user..."
    
    if docker-compose exec -T typeaware-api npm run create-admin; then
        log_success "Admin user created successfully!"
    else
        log_warning "Admin user creation failed (might already exist)"
    fi
}

# Seed database
seed_database() {
    read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Seeding database with sample data..."
        
        if docker-compose exec -T typeaware-api npm run seed; then
            log_success "Database seeded successfully!"
        else
            log_error "Database seeding failed"
        fi
    fi
}

# Show status
show_status() {
    log_info "Checking service status..."
    docker-compose ps
    
    echo
    log_success "🎉 TypeAware Backend is now running in production mode!"
    echo
    log_info "Services:"
    echo "  • API: http://localhost:3001"
    echo "  • Database: mongodb://localhost:27017"
    echo "  • Health Check: http://localhost:3001/health"
    echo
    log_info "Admin Credentials (from .env.production):"
    echo "  • Email: $(grep DEFAULT_ADMIN_EMAIL .env.production | cut -d= -f2)"
    echo "  • Password: $(grep DEFAULT_ADMIN_PASSWORD .env.production | cut -d= -f2)"
    echo
    log_warning "Next Steps:"
    echo "  1. Update FRONTEND_URL in .env.production"
    echo "  2. Update nginx/nginx.conf with your domain"
    echo "  3. Set up SSL certificates for HTTPS"
    echo "  4. Configure monitoring and backups"
    echo "  5. Test all API endpoints"
    echo
    log_info "Useful Commands:"
    echo "  • View logs: docker-compose logs -f"
    echo "  • Stop services: docker-compose down"
    echo "  • Restart services: docker-compose restart"
    echo "  • Update: docker-compose up -d --build"
}

# Cleanup function
cleanup() {
    log_warning "Setup interrupted. Cleaning up..."
    docker-compose down > /dev/null 2>&1 || true
    exit 1
}

# Main execution
main() {
    # Set up interrupt handling
    trap cleanup INT TERM
    
    echo
    log_info "Starting TypeAware Backend production setup..."
    
    check_docker
    generate_secrets
    create_directories
    create_nginx_config
    create_mongo_init
    start_services
    wait_for_services
    create_admin_user
    seed_database
    show_status
    
    log_success "Production setup completed successfully! 🚀"
}

# Run main function
main "$@"