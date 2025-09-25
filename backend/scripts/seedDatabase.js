const mongoose = require('mongoose');
const User = require('../models/User');
const Report = require('../models/Report');
require('dotenv').config();

// Sample data for seeding
const sampleUsers = [
  {
    email: 'john.doe@example.com',
    password: 'password123',
    username: 'johndoe',
    role: 'user'
  },
  {
    email: 'jane.smith@example.com',
    password: 'password123',
    username: 'janesmith',
    role: 'user'
  },
  {
    email: 'moderator@typeaware.com',
    password: 'password123',
    username: 'moderator',
    role: 'admin'
  }
];

const sampleReports = [
  {
    browserUUID: '550e8400-e29b-41d4-a716-446655440000',
    content: {
      original: 'You are such an idiot, go kill yourself',
      flaggedTerms: [
        {
          term: 'idiot',
          positions: [17],
          severity: 'medium'
        },
        {
          term: 'kill yourself',
          positions: [27],
          severity: 'critical'
        }
      ],
      severity: 'critical'
    },
    context: {
      platform: 'twitter',
      url: 'https://twitter.com/example/status/123',
      pageTitle: 'Twitter - Sample Tweet',
      elementType: 'comment'
    },
    classification: {
      category: 'harassment',
      confidence: 0.95,
      detectionMethod: 'nlp'
    },
    status: 'confirmed'
  },
  {
    browserUUID: '550e8400-e29b-41d4-a716-446655440001',
    content: {
      original: 'This is spam content with promotional links',
      flaggedTerms: [
        {
          term: 'spam',
          positions: [8],
          severity: 'low'
        }
      ],
      severity: 'low'
    },
    context: {
      platform: 'youtube',
      url: 'https://youtube.com/watch?v=example',
      pageTitle: 'YouTube - Sample Video',
      elementType: 'comment'
    },
    classification: {
      category: 'spam',
      confidence: 0.75,
      detectionMethod: 'regex'
    },
    status: 'pending'
  },
  {
    browserUUID: '550e8400-e29b-41d4-a716-446655440002',
    content: {
      original: 'Women are inferior and should stay in kitchen',
      flaggedTerms: [
        {
          term: 'inferior',
          positions: [10],
          severity: 'high'
        }
      ],
      severity: 'high'
    },
    context: {
      platform: 'reddit',
      url: 'https://reddit.com/r/example/comments/123',
      pageTitle: 'Reddit - Example Discussion',
      elementType: 'post'
    },
    classification: {
      category: 'hate_speech',
      confidence: 0.88,
      detectionMethod: 'ml_model'
    },
    status: 'confirmed'
  },
  {
    browserUUID: '550e8400-e29b-41d4-a716-446655440003',
    content: {
      original: 'I will find you and hurt you badly',
      flaggedTerms: [
        {
          term: 'hurt you',
          positions: [17],
          severity: 'critical'
        }
      ],
      severity: 'critical'
    },
    context: {
      platform: 'facebook',
      url: 'https://facebook.com/example/post/123',
      pageTitle: 'Facebook - Example Post',
      elementType: 'comment'
    },
    classification: {
      category: 'threat',
      confidence: 0.92,
      detectionMethod: 'nlp'
    },
    status: 'under_review'
  },
  {
    browserUUID: '550e8400-e29b-41d4-a716-446655440004',
    content: {
      original: 'You fat ugly loser, nobody likes you',
      flaggedTerms: [
        {
          term: 'fat ugly loser',
          positions: [4],
          severity: 'high'
        }
      ],
      severity: 'high'
    },
    context: {
      platform: 'instagram',
      url: 'https://instagram.com/p/example',
      pageTitle: 'Instagram - Example Post',
      elementType: 'comment'
    },
    classification: {
      category: 'bullying',
      confidence: 0.85,
      detectionMethod: 'fuzzy_match'
    },
    status: 'pending'
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/typeaware', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    const clearExisting = process.argv.includes('--clear');
    if (clearExisting) {
      console.log('🧹 Clearing existing data...');
      await User.deleteMany({});
      await Report.deleteMany({});
      console.log('✅ Existing data cleared');
    }

    // Create users
    console.log('👥 Creating sample users...');
    const createdUsers = [];

    for (const userData of sampleUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`⚠️ User ${userData.email} already exists, skipping...`);
          createdUsers.push(existingUser);
          continue;
        }

        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.username} (${user.email})`);
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    // Create reports
    console.log('📊 Creating sample reports...');
    const createdReports = [];

    for (let i = 0; i < sampleReports.length; i++) {
      try {
        const reportData = sampleReports[i];

        // Assign random user to some reports
        if (createdUsers.length > 0 && Math.random() > 0.3) {
          const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
          reportData.userId = randomUser._id;
        }

        // Add some variation to timestamps
        const daysAgo = Math.floor(Math.random() * 30); // Random date within last 30 days
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);

        const report = new Report({
          ...reportData,
          metadata: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ipHash: `hash${Math.floor(Math.random() * 1000)}`,
            sessionId: `session${Math.floor(Math.random() * 10000)}`,
            timestamp: createdAt
          },
          createdAt,
          updatedAt: createdAt
        });

        await report.save();
        createdReports.push(report);
        console.log(`✅ Created report: ${report.classification.category} on ${report.context.platform}`);

        // Update user stats if report has userId
        if (report.userId) {
          await User.findByIdAndUpdate(report.userId, {
            $inc: {
              'stats.totalReports': 1,
              'stats.threatsDetected': report.content.severity === 'critical' ? 1 : 0
            },
            $set: { 'stats.lastActivity': createdAt }
          });
        }
      } catch (error) {
        console.error(`❌ Error creating report ${i + 1}:`, error.message);
      }
    }

    // Create some admin reviews for confirmed reports
    console.log('👨‍💼 Adding admin reviews...');
    const adminUser = createdUsers.find(user => user.role === 'admin');
    if (adminUser) {
      const confirmedReports = createdReports.filter(report => report.status === 'confirmed');
      for (const report of confirmedReports) {
        await report.markAsReviewed(
          adminUser._id,
          'confirmed',
          'Clear violation of community guidelines'
        );
        console.log(`✅ Added admin review to report ${report._id}`);
      }
    }

    // Generate additional random reports for better analytics
    console.log('📈 Generating additional reports for analytics...');
    const platforms = ['twitter', 'youtube', 'reddit', 'facebook', 'instagram'];
    const categories = ['harassment', 'hate_speech', 'spam', 'bullying', 'threat'];
    const severities = ['low', 'medium', 'high', 'critical'];

    for (let i = 0; i < 50; i++) {
      try {
        const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
        const randomUser = createdUsers.length > 0 && Math.random() > 0.4
          ? createdUsers[Math.floor(Math.random() * createdUsers.length)]._id
          : null;

        const daysAgo = Math.floor(Math.random() * 90); // Random date within last 90 days
        const hoursAgo = Math.floor(Math.random() * 24);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);
        createdAt.setHours(createdAt.getHours() - hoursAgo);

        const randomReport = new Report({
          browserUUID: `550e8400-e29b-41d4-a716-${String(Math.floor(Math.random() * 1000000)).padStart(12, '0')}`,
          userId: randomUser,
          content: {
            original: `Sample ${randomCategory} content detected by system`,
            flaggedTerms: [{
              term: randomCategory.replace('_', ' '),
              positions: [7],
              severity: randomSeverity
            }],
            severity: randomSeverity
          },
          context: {
            platform: randomPlatform,
            url: `https://${randomPlatform}.com/example/${i}`,
            pageTitle: `${randomPlatform} - Example Content ${i}`,
            elementType: Math.random() > 0.5 ? 'comment' : 'post'
          },
          classification: {
            category: randomCategory,
            confidence: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
            detectionMethod: ['regex', 'nlp', 'ml_model'][Math.floor(Math.random() * 3)]
          },
          status: ['pending', 'confirmed', 'false_positive', 'dismissed'][Math.floor(Math.random() * 4)],
          metadata: {
            userAgent: 'Mozilla/5.0 (generated)',
            ipHash: `hash${Math.floor(Math.random() * 10000)}`,
            sessionId: `session${Math.floor(Math.random() * 100000)}`,
            timestamp: createdAt
          },
          createdAt,
          updatedAt: createdAt
        });

        await randomReport.save();

        // Update user stats if report has userId
        if (randomUser) {
          await User.findByIdAndUpdate(randomUser, {
            $inc: {
              'stats.totalReports': 1,
              'stats.threatsDetected': randomSeverity === 'critical' ? 1 : 0,
              'stats.totalScans': Math.floor(Math.random() * 10) + 1
            },
            $set: { 'stats.lastActivity': createdAt }
          });
        }

      } catch (error) {
        console.error(`❌ Error creating random report ${i + 1}:`, error.message);
      }
    }

    // Summary
    const finalUserCount = await User.countDocuments();
    const finalReportCount = await Report.countDocuments();
    const pendingCount = await Report.countDocuments({ status: 'pending' });
    const confirmedCount = await Report.countDocuments({ status: 'confirmed' });

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   👥 Total Users: ${finalUserCount}`);
    console.log(`   📋 Total Reports: ${finalReportCount}`);
    console.log(`   ⏳ Pending Reports: ${pendingCount}`);
    console.log(`   ✅ Confirmed Reports: ${confirmedCount}`);

    console.log('\n🔑 Admin Login Credentials:');
    const adminUsers = await User.find({ role: 'admin' });
    adminUsers.forEach(admin => {
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: password123`);
    });

    console.log('\n🌐 You can now start your server and test the API!');
    console.log('   npm run dev');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Command line options
const showHelp = () => {
  console.log(`
🌱 TypeAware Database Seeding Script

Usage:
  npm run seed          # Seed database with sample data
  npm run seed -- --clear   # Clear existing data and seed fresh
  npm run seed -- --help    # Show this help message

Options:
  --clear   Clear all existing data before seeding
  --help    Show help information

Examples:
  node scripts/seedDatabase.js
  node scripts/seedDatabase.js --clear
`);
};

// Check command line arguments
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

// Run the seeding script
seedDatabase();