/**
 * Database Initialization Script
 * Run this to initialize database with default data
 */

const connectDB = require('./database');
const Meeting = require('../models/Meeting');
const User = require('../models/User');

async function initializeDatabase() {
  console.log('🔧 Initializing database...\n');
  
  await connectDB();
  
  try {
    // Check if we have any data
    const userCount = await User.countDocuments();
    const meetingCount = await Meeting.countDocuments();
    
    if (userCount === 0) {
      console.log('📝 Creating default admin user...');
      
      // Create default admin user
      const adminUser = new User({
        username: 'admin',
        email: 'admin@zoomclone.com',
        password: 'admin123',
        displayName: 'Administrator',
        role: 'admin',
        isActive: true
      });
      
      await adminUser.save();
      console.log('✅ Admin user created (username: admin, password: admin123)');
      
      // Create demo user
      const demoUser = new User({
        username: 'demo',
        email: 'demo@zoomclone.com',
        password: 'demo123',
        displayName: 'Demo User',
        role: 'user',
        isActive: true
      });
      
      await demoUser.save();
      console.log('✅ Demo user created (username: demo, password: demo123)');
    }
    
    if (meetingCount === 0) {
      console.log('📝 Creating sample meeting...');
      
      // Create a sample meeting
      const meetingId = await Meeting.generateUniqueMeetingId();
      const sampleMeeting = new Meeting({
        meetingId,
        meetingName: 'Sample Meeting',
        createdBy: 'Admin',
        createdByUserId: '1',
        isActive: true,
        participants: [{
          userId: '1',
          name: 'Administrator',
          joinedAt: new Date(),
          isActive: true
        }]
      });
      
      await sampleMeeting.save();
      console.log(`✅ Sample meeting created (ID: ${meetingId})`);
    }
    
    console.log('\n✅ Database initialization complete!');
    console.log('\n📊 Database Statistics:');
    console.log(`   - Users: ${await User.countDocuments()}`);
    console.log(`   - Meetings: ${await Meeting.countDocuments()}`);
    console.log(`   - Active Meetings: ${await Meeting.countDocuments({ isActive: true })}`);
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  } finally {
    process.exit(0);
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;