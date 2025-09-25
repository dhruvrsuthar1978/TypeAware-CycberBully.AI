const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/typeaware', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@typeaware.com' 
    });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Username: ${existingAdmin.username}`);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@typeaware.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456',
      username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
      role: 'admin'
    });

    await adminUser.save();

    console.log('🎉 Admin user created successfully!');
    console.log('Admin Details:');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Username: ${adminUser.username}`);
    console.log(`Role: ${adminUser.role}`);
    console.log('\n⚠️ IMPORTANT: Please change the default password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', messages);
    }
    
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
createAdmin();