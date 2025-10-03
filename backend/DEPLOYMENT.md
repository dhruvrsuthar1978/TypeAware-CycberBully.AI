# TypeAware Backend Deployment Guide

This guide covers deploying your TypeAware backend to various cloud platforms for production use.

## 🏗️ Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Tested all API endpoints locally
- [ ] Set up environment variables
- [ ] Created admin user
- [ ] Verified database connection
- [ ] Run the API test suite
- [ ] Updated CORS settings for production

## 🌐 Deployment Options

### Option 1: Railway (Recommended for Beginners)

Railway is simple, fast, and has great MongoDB integration.

#### Step 1: Prepare Your Code
```bash
# Create a railway.json file
cat > railway.json << EOF
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
EOF
```

#### Step 2: Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add MongoDB service
railway add --service mongodb

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_ACCESS_SECRET=your-super-secret-production-key
railway variables set MONGODB_URI=${{MongoDB.DATABASE_URL}}
railway variables set FRONTEND_URL=https://your-frontend-domain.com

# Deploy
railway up
```

### Option 2: Heroku

Heroku is a popular platform with good free tier options.

#### Step 1: Create Procfile
```bash
cat > Procfile << EOF
web: npm start
EOF
```

#### Step 2: Deploy to Heroku
```bash
# Install Heroku CLI and login
heroku login

# Create Heroku app
heroku create your-typeaware-api

# Add MongoDB Atlas addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_ACCESS_SECRET=your-super-secret-production-key
heroku config:set FRONTEND_URL=https://your-frontend-domain.com

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# Create admin user
heroku run npm run create-admin
```

### Option 3: Digital Ocean App Platform

Great balance of simplicity and features.

#### Step 1: Create App Spec
```yaml
# .do/app.yaml
name: typeaware-backend
services:
- name: api
  source_dir: /
  github:
    repo: your-username/typeaware-backend
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NODE_ENV
    value: production
  - key: JWT_ACCESS_SECRET
    value: your-super-secret-production-key
    type: SECRET
  - key: MONGODB_URI
    value: ${db.DATABASE_URL}
  - key: FRONTEND_URL
    value: https://your-frontend-domain.com

databases:
- name: db
  engine: MONGODB
  version: "4.4"
```

#### Step 2: Deploy
```bash
# Install doctl CLI
# Deploy using the app spec
doctl apps create --spec .do/app.yaml
```

### Option 4: AWS Elastic Beanstalk

For more advanced users who want AWS integration.

#### Step 1: Prepare for AWS
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init --platform node.js --region us-east-1

# Create environment
eb create typeaware-production
```

#### Step 2: Configure Environment Variables
```bash
eb setenv NODE_ENV=production
eb setenv JWT_ACCESS_SECRET=your-super-secret-production-key
eb setenv MONGODB_URI=your-mongodb-atlas-connection-string
eb setenv FRONTEND_URL=https://your-frontend-domain.com
```

#### Step 3: Deploy
```bash
eb deploy
```

## 🗄️ Database Setup (MongoDB Atlas)

For production, use MongoDB Atlas (cloud MongoDB service):

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for free account
3. Create a new cluster

### Step 2: Configure Database
```bash
# Connect to your cluster and create database
mongosh "mongodb+srv://your-cluster.mongodb.net/typeaware" --username your-username

# Create indexes for better performance
db.reports.createIndex({ "browserUUID": 1, "createdAt": -1 })
db.reports.createIndex({ "userId": 1, "createdAt": -1 })
db.reports.createIndex({ "context.platform": 1 })
db.reports.createIndex({ "classification.category": 1 })
db.reports.createIndex({ "status": 1 })
db.users.createIndex({ "email": 1 }, { "unique": true })
db.users.createIndex({ "username": 1 }, { "unique": true })
```

### Step 3: Seed Production Database
```bash
# Set production MongoDB URI in .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/typeaware

# Seed database
npm run seed
```

## 🔒 Production Environment Variables

Create a production `.env` file with these variables:

```env
# Server
NODE_ENV=production
PORT=3001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/typeaware

# JWT (Generate strong secrets!)
JWT_ACCESS_SECRET=your-super-long-random-secret-key-at-least-32-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=another-super-long-random-secret-key

# CORS
FRONTEND_URL=https://your-frontend-domain.com

# Security
BCRYPT_ROUNDS=12

# Admin
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
DEFAULT_ADMIN_PASSWORD=super-secure-admin-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
REPORT_RATE_LIMIT_WINDOW_MS=60000
REPORT_RATE_LIMIT_MAX_REQUESTS=10
```

## 🛡️ Production Security Checklist

- [ ] **Strong JWT Secrets**: Use random 32+ character strings
- [ ] **HTTPS Only**: Enable SSL/TLS certificates
- [ ] **CORS Configuration**: Set specific frontend domains
- [ ] **Rate Limiting**: Configure appropriate limits
- [ ] **Input Validation**: All endpoints have validation
- [ ] **Password Security**: Strong admin passwords
- [ ] **Environment Variables**: No secrets in code
- [ ] **Database Security**: MongoDB Atlas network access rules
- [ ] **Error Handling**: Don't expose stack traces in production
- [ ] **Logging**: Set up proper logging and monitoring

## 📊 Production Monitoring

### Health Check Endpoint
Your API includes a health check at `/health`:

```bash
curl https://your-api-domain.com/health
```

### Monitoring Tools
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, Rollbar
- **Performance**: New Relic, DataDog
- **Logs**: LogDNA, Papertrail

### Add Basic Monitoring
```javascript
// Add to server.js
const os = require('os');

app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: os.loadavg(),
    timestamp: new Date().toISOString()
  });
});
```

## 🚀 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Railway
      uses: railwayapp/railway-deploy@v1
      with:
        railway_token: ${{ secrets.RAILWAY_TOKEN }}
        service: typeaware-backend
```

## 🔧 Performance Optimization

### 1. Add Compression
```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Add Caching Headers
```javascript
app.use('/api/analytics', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  next();
});
```

### 3. Database Connection Pooling
```javascript
mongoose.connect(mongoURI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

## 📝 Domain Setup

### Custom Domain Configuration
1. **Buy a domain** (e.g., `api.yourdomain.com`)
2. **Configure DNS** to point to your deployment
3. **Set up SSL certificate** (usually automatic on most platforms)
4. **Update environment variables** with new domain

### Example DNS Settings
```
Type: CNAME
Name: api
Value: your-app-name.railway.app
TTL: Auto
```

## 🧪 Production Testing

### Test Your Deployed API
```bash
# Replace with your production domain
export API_URL="https://your-api-domain.com/api"

# Test health check
curl $API_URL/../health

# Test registration
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"testuser"}'

# Test report submission
curl -X POST $API_URL/reports/submit \
  -H "Content-Type: application/json" \
  -d '{"browserUUID":"550e8400-e29b-41d4-a716-446655440000","content":{"original":"test message","severity":"low"},"context":{"platform":"twitter","elementType":"comment"},"classification":{"category":"other","confidence":0.5}}'
```

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check connection string
   echo $MONGODB_URI
   # Test connection
   mongosh $MONGODB_URI
   ```

2. **CORS Errors**
   ```javascript
   // Update CORS settings in server.js
   app.use(cors({
     origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
     credentials: true
   }));
   ```

3. **JWT Token Issues**
   ```bash
   # Generate new secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Rate Limiting Too Aggressive**
   ```javascript
   // Adjust in server.js
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 1000 // Increase for production
   });
   ```

## 📋 Deployment Checklist

- [ ] Code tested locally
- [ ] Environment variables configured
- [ ] Database deployed and accessible
- [ ] Admin user created
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] CORS settings updated
- [ ] Rate limits configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] API tests passing in production

## 🎉 Post-Deployment

After successful deployment:

1. **Test all endpoints** using your production URL
2. **Monitor performance** and error rates
3. **Set up alerts** for downtime or errors
4. **Document your API** for frontend team
5. **Plan for scaling** as usage grows

Your TypeAware backend is now production-ready! 🚀

---

**Need Help?** 
- Check the logs in your deployment platform
- Test locally first before deploying
- Use the API test script: `npm run test-api`
- Monitor health endpoint: `/health`