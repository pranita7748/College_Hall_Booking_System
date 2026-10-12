const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Club = require('./models/Club');
const Hall = require('./models/Hall');
const Booking = require('./models/Booking');
const AuditLog = require('./models/AuditLog');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jvn_hall_booking';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Club.deleteMany({});
    await Hall.deleteMany({});
    await Booking.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Seed Hall
    const hall = await Hall.create({
      name: 'JVN Hall',
      capacity: 250,
      location: 'Main Campus Block, Ground Floor',
      isActive: true
    });
    console.log('Seeded Hall:', hall.name);

    // 2. Seed Clubs
    const clubsData = [
      { name: 'Phoenix', department: 'Electronics & Communication', isActive: true },
      { name: 'DEsoc', department: 'Computer Science and Design', isActive: true },
      { name: 'Debuggers', department: 'Information Science & Tech', isActive: true },
      { name: 'CSI', department: 'Computer Society of India Student Chapter', isActive: true }
    ];
    const createdClubs = await Club.insertMany(clubsData);
    console.log(`Seeded ${createdClubs.length} clubs.`);

    // 3. Seed Users: Admin, HOD, and unified Events Login (for all clubs)
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
    const hodPasswordHash = await bcrypt.hash('Hod@123', salt);
    const eventsPasswordHash = await bcrypt.hash('Events@123', salt);

    const adminUser = await User.create({
      name: 'Dr. Ramesh (Admin)',
      email: 'admin@college.edu',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true
    });

    const hodUser = await User.create({
      name: 'Prof. K. Sharma (HOD)',
      email: 'hod@college.edu',
      passwordHash: hodPasswordHash,
      role: 'HOD',
      isActive: true
    });

    const eventsUser = await User.create({
      name: 'Events & Cultural Committee',
      email: 'events@college.edu',
      passwordHash: eventsPasswordHash,
      role: 'EVENT_COORDINATOR',
      club: 'All Campus Clubs',
      isActive: true
    });

    console.log('Seeded Users: Admin, HOD, and Unified Events Login (events@college.edu).');

    // 4. Seed sample bookings (matching Page 9 daily schedule example: 15 October)
    const booking1 = await Booking.create({
      eventName: 'Phoenix Tech Symposium',
      organizer: 'Phoenix',
      bookingType: 'Club Event',
      priority: 'High',
      date: '2026-10-15',
      startTime: '10:00',
      endTime: '12:00',
      expectedParticipants: 180,
      guestName: 'Dr. A. P. Raman',
      description: 'Annual robotics and electronics symposium with project displays.',
      status: 'APPROVED',
      requestedBy: eventsUser._id,
      approvedBy: hodUser._id
    });

    const booking2 = await Booking.create({
      eventName: 'DEsoc AI Workshop',
      organizer: 'DEsoc',
      bookingType: 'Workshop',
      priority: 'Medium',
      date: '2026-10-15',
      startTime: '13:00',
      endTime: '15:00',
      expectedParticipants: 120,
      guestName: 'Dr. XYZ',
      description: 'Hands-on workshop on generative AI architectures.',
      status: 'APPROVED',
      requestedBy: eventsUser._id,
      approvedBy: hodUser._id
    });

    const booking3 = await Booking.create({
      eventName: 'HOD Guest Lecture',
      organizer: 'DEsoc / Department',
      bookingType: 'Guest Lecture',
      priority: 'High',
      date: '2026-10-15',
      startTime: '16:00',
      endTime: '18:00',
      expectedParticipants: 200,
      guestName: 'Prof. Elena Rostova',
      description: 'Special guest lecture on Advanced Distributed Systems.',
      status: 'APPROVED',
      requestedBy: hodUser._id,
      approvedBy: hodUser._id
    });

    // Seed a pending booking for testing approval flow
    const bookingPending = await Booking.create({
      eventName: 'Debuggers Algorithmic Challenge',
      organizer: 'Debuggers',
      bookingType: 'Club Event',
      priority: 'High',
      date: '2026-10-16',
      startTime: '10:00',
      endTime: '13:00',
      expectedParticipants: 140,
      guestName: '',
      description: 'Intra-college competitive programming speed contest.',
      status: 'PENDING',
      requestedBy: eventsUser._id
    });

    // 5. Seed Audit Logs
    await AuditLog.create([
      {
        action: 'BOOKING_APPROVED',
        performedBy: hodUser._id,
        bookingId: booking1._id,
        details: 'Approved Phoenix Tech Symposium for 2026-10-15 10:00 - 12:00'
      },
      {
        action: 'BOOKING_APPROVED',
        performedBy: hodUser._id,
        bookingId: booking2._id,
        details: 'Approved DEsoc AI Workshop for 2026-10-15 13:00 - 15:00'
      },
      {
        action: 'BOOKING_APPROVED',
        performedBy: hodUser._id,
        bookingId: booking3._id,
        details: 'Approved HOD Guest Lecture for 2026-10-15 16:00 - 18:00'
      },
      {
        action: 'BOOKING_CREATED',
        performedBy: eventsUser._id,
        bookingId: bookingPending._id,
        details: 'Submitted booking request for Debuggers Algorithmic Challenge'
      }
    ]);

    console.log('Seeded sample bookings and audit logs.');
    console.log('Database seeding successfully finished!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
