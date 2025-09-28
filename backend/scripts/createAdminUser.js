// scripts/createAdminUser.js
// Script to create the first admin user for TypeAware

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');
require('dotenv').config();

const User = require('../models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    process.stdin.on('data', function(ch) {
      ch = ch + '';
      
      switch(ch) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        default:
          password += ch;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function createAdminUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/typeaware';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('\n=== TypeAware Admin User Creation ===\n');

    // Check if any admin users already exist
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      const overwrite = await question('An admin user already exists. Do you want to create another one? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Admin creation cancelled.');
        return;
      }
    }

    // Collect user information
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');
    const email = await question('Email: ');
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format. Please try again.');
      return;
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User with this email already exists.');
      return;
    }

    console.log('\nPassword requirements:');
    console.log('- At least 8 characters long');
    console.log('- Must contain uppercase and lowercase letters');
    console.log('- Must contain at least one number');
    console.log('- Must contain at least one special character\n');

    const password = await questionHidden('Password: ');
    const confirmPassword = await questionHidden('Confirm Password: ');

    if (password !== confirmPassword) {
      console.log('\nPasswords do not match. Please try again.');
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('\nPassword does not meet requirements. Please try again.');
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const adminUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'admin',
      status: 'active',
      uuid: uuidv4(),
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date()
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('\nAdmin Details:');
    console.log(`Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`UUID: ${adminUser.uuid}`);
    console.log(`Created: ${adminUser.createdAt.toISOString()}`);

    console.log('\n🔐 You can now log in to the admin panel with these credentials.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser;