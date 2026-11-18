import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Owner } from '../models/Owner.js';
import { Tenant } from '../models/Tenant.js';
import { Building } from '../models/Building.js';
import { Floor } from '../models/Floor.js';
import { Room } from '../models/Room.js';
import { Bed } from '../models/Bed.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { Menu } from '../models/Menu.js';
import { RentInvoice } from '../models/RentInvoice.js';
import { Payment } from '../models/Payment.js';
import { MealAttendance } from '../models/MealAttendance.js';
import { Complaint } from '../models/Complaint.js';
import { Notification } from '../models/Notification.js';
import { Announcement } from '../models/Announcement.js';
import { AuditLog } from '../models/AuditLog.js';
import { getTodayIST } from '../utils/dateUtils.js';

export const seedDatabase = async (force = false) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0 && !force) {
      console.log('Database already contains records. Skipping seed.');
      return;
    }

    if (force) {
      console.log('Clearing existing database collections for fresh seed...');
      await Promise.all([
        User.deleteMany({}),
        Owner.deleteMany({}),
        Tenant.deleteMany({}),
        Building.deleteMany({}),
        Floor.deleteMany({}),
        Room.deleteMany({}),
        Bed.deleteMany({}),
        BedAllocation.deleteMany({}),
        Menu.deleteMany({}),
        RentInvoice.deleteMany({}),
        Payment.deleteMany({}),
        MealAttendance.deleteMany({}),
        Complaint.deleteMany({}),
        Notification.deleteMany({}),
        Announcement.deleteMany({}),
        AuditLog.deleteMany({}),
      ]);
    }

    console.log('Seeding rich Indian PG data...');

    // 1. Create Owner User
    const ownerUser = await User.create({
      name: 'Rajesh Sharma',
      email: 'owner@pgmate.in',
      phone: '9876543210',
      password: 'Password@123',
      role: 'owner',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });

    const ownerProfile = await Owner.create({
      user: ownerUser._id,
      businessName: 'Sri Sai Balaji Stays & Luxury PGs',
      contactPhone: '9876543210',
      alternatePhone: '9876543299',
      upiId: 'rajesh.sharma@okaxis',
      bankDetails: {
        accountHolderName: 'Rajesh Sharma',
        accountNumber: '50100456789123',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank, Koramangala',
      },
      address: {
        street: '80 Feet Road, 4th Block, Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
      }
    });

    // 2. Create Building 1: "Sri Sai Balaji Luxury PG" (Bengaluru)
    const building1 = await Building.create({
      owner: ownerUser._id,
      name: 'Sri Sai Balaji Luxury PG',
      address: {
        street: '142, 5th Cross, 6th Block',
        area: 'Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560095',
        landmark: 'Near Sony World Signal',
      },
      contactNumber: '9876543210',
      totalFloors: 3,
      description: 'Premium air-conditioned PG with high-speed fiber internet, 3-time homestyle North & South Indian meals, daily housekeeping and biometric security.',
      amenities: [
        'High-Speed Wi-Fi',
        'Daily Housekeeping',
        '3 Times Homestyle Meals',
        'Washing Machine & Dryer',
        '24/7 Hot Water (Solar + Geyser)',
        'Biometric Access & CCTV',
        'Power Backup (Inverter/Generator)',
        'Attached Balcony',
        'RO Purified Water Dispensers'
      ],
      rules: [
        'Gate closes at 11:30 PM (inform manager for late entry)',
        'Visitors allowed in common reception lounge only',
        'Alcohol and smoking strictly prohibited on premises',
        'Keep rooms and common corridors clean'
      ],
      genderAllowed: 'co-living',
      mealTimings: {
        breakfast: '07:30 - 09:30',
        lunch: '12:30 - 14:30',
        dinner: '19:30 - 21:30',
      }
    });

    // Create Building 2: "Stanza Living Orchid House"
    const building2 = await Building.create({
      owner: ownerUser._id,
      name: 'Stanza Living Orchid House',
      address: {
        street: 'Plot 22, Viman Nagar Main Road',
        area: 'Viman Nagar',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411014',
        landmark: 'Behind Phoenix Marketcity',
      },
      contactNumber: '9876543210',
      totalFloors: 2,
      description: 'Modern executive PG close to IT hubs, gym equipped, spacious dining hall.',
      amenities: ['Wi-Fi', '3 Times Meals', 'Gym', 'Laundry', 'CCTV'],
      genderAllowed: 'boys',
      mealTimings: {
        breakfast: '07:30 - 09:30',
        lunch: '12:30 - 14:30',
        dinner: '19:30 - 21:30',
      }
    });

    // 3. Create Floors for Building 1
    const floor1 = await Floor.create({ building: building1._id, floorNumber: 1, name: 'Ground Floor' });
    const floor2 = await Floor.create({ building: building1._id, floorNumber: 2, name: '1st Floor' });
    const floor3 = await Floor.create({ building: building1._id, floorNumber: 3, name: '2nd Floor' });

    // 4. Create Rooms for Building 1
    const room101 = await Room.create({
      building: building1._id,
      floor: floor1._id,
      roomNumber: '101',
      roomType: 'double',
      capacity: 2,
      baseRent: 9500,
      attachedBathroom: true,
      acAvailable: true,
      hasBalcony: false,
      status: 'active',
    });

    const room102 = await Room.create({
      building: building1._id,
      floor: floor1._id,
      roomNumber: '102',
      roomType: 'double',
      capacity: 2,
      baseRent: 9500,
      attachedBathroom: true,
      acAvailable: true,
      hasBalcony: true,
      status: 'active',
    });

    const room103 = await Room.create({
      building: building1._id,
      floor: floor1._id,
      roomNumber: '103',
      roomType: 'triple',
      capacity: 3,
      baseRent: 8000,
      attachedBathroom: true,
      acAvailable: false,
      hasBalcony: false,
      status: 'active',
    });

    const room201 = await Room.create({
      building: building1._id,
      floor: floor2._id,
      roomNumber: '201',
      roomType: 'single',
      capacity: 1,
      baseRent: 15000,
      attachedBathroom: true,
      acAvailable: true,
      hasBalcony: true,
      status: 'active',
    });

    const room202 = await Room.create({
      building: building1._id,
      floor: floor2._id,
      roomNumber: '202',
      roomType: 'double',
      capacity: 2,
      baseRent: 9500,
      attachedBathroom: true,
      acAvailable: false,
      hasBalcony: true,
      status: 'active',
    });

    // 5. Create Beds
    // Room 101: 2 beds
    const bed101A = await Bed.create({ building: building1._id, floor: floor1._id, room: room101._id, bedNumber: 'Bed A', monthlyRent: 9500, status: 'available' });
    const bed101B = await Bed.create({ building: building1._id, floor: floor1._id, room: room101._id, bedNumber: 'Bed B', monthlyRent: 9500, status: 'available' });

    // Room 102: 2 beds
    const bed102A = await Bed.create({ building: building1._id, floor: floor1._id, room: room102._id, bedNumber: 'Bed A', monthlyRent: 9500, status: 'available' });
    const bed102B = await Bed.create({ building: building1._id, floor: floor1._id, room: room102._id, bedNumber: 'Bed B', monthlyRent: 9500, status: 'available' });

    // Room 103: 3 beds
    const bed103A = await Bed.create({ building: building1._id, floor: floor1._id, room: room103._id, bedNumber: 'Bed A', monthlyRent: 8000, status: 'available' });
    const bed103B = await Bed.create({ building: building1._id, floor: floor1._id, room: room103._id, bedNumber: 'Bed B', monthlyRent: 8000, status: 'maintenance', maintenanceReason: 'Mattress replacement & electrical switch repair' });
    const bed103C = await Bed.create({ building: building1._id, floor: floor1._id, room: room103._id, bedNumber: 'Bed C', monthlyRent: 8000, status: 'available' });

    // Room 201: 1 bed
    const bed201A = await Bed.create({ building: building1._id, floor: floor2._id, room: room201._id, bedNumber: 'Bed A', monthlyRent: 15000, status: 'available' });

    // Room 202: 2 beds
    const bed202A = await Bed.create({ building: building1._id, floor: floor2._id, room: room202._id, bedNumber: 'Bed A', monthlyRent: 9500, status: 'available' });
    const bed202B = await Bed.create({ building: building1._id, floor: floor2._id, room: room202._id, bedNumber: 'Bed B', monthlyRent: 9500, status: 'available' });

    // 6. Create Tenants and Allocations
    const tenantConfigs = [
      {
        name: 'Rahul Verma',
        email: 'rahul@gmail.com',
        phone: '9876543211',
        password: 'Password@123',
        bed: bed101A,
        room: room101,
        company: 'Infosys Limited',
        occupation: 'working_professional',
        rent: 9500,
        deposit: 15000,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      },
      {
        name: 'Amit Patel',
        email: 'amit@gmail.com',
        phone: '9876543213',
        password: 'Password@123',
        bed: bed101B,
        room: room101,
        company: 'Swiggy',
        occupation: 'working_professional',
        rent: 9500,
        deposit: 15000,
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      },
      {
        name: 'Priya Nair',
        email: 'priya@gmail.com',
        phone: '9876543212',
        password: 'Password@123',
        bed: bed102A,
        room: room102,
        company: 'Dell Technologies',
        occupation: 'working_professional',
        rent: 9500,
        deposit: 15000,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
      {
        name: 'Sneha Kulkarni',
        email: 'sneha@gmail.com',
        phone: '9876543214',
        password: 'Password@123',
        bed: bed102B,
        room: room102,
        company: 'Christ University',
        occupation: 'student',
        rent: 9500,
        deposit: 12000,
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      },
      {
        name: 'Vikram Singh',
        email: 'vikram@gmail.com',
        phone: '9876543215',
        password: 'Password@123',
        bed: bed103A,
        room: room103,
        company: 'Razorpay',
        occupation: 'working_professional',
        rent: 8000,
        deposit: 15000,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
    ];

    const currentMonth = getTodayIST().slice(0, 7); // 'YYYY-MM'
    const today = getTodayIST();

    for (const tc of tenantConfigs) {
      const user = await User.create({
        name: tc.name,
        email: tc.email,
        phone: tc.phone,
        password: tc.password,
        role: 'tenant',
        pgOwnerId: ownerUser._id,
        avatar: tc.avatar,
      });

      const allocation = await BedAllocation.create({
        tenant: user._id,
        bed: tc.bed._id,
        room: tc.room._id,
        building: building1._id,
        owner: ownerUser._id,
        joiningDate: new Date('2026-08-01'),
        monthlyRent: tc.rent,
        securityDeposit: tc.deposit,
        rentDueDay: 5,
        status: 'active',
      });

      await Tenant.create({
        user: user._id,
        owner: ownerUser._id,
        emergencyContact: { name: 'Parent/Guardian', relation: 'Father', phone: '9800011122' },
        occupation: tc.occupation,
        companyOrCollege: tc.company,
        currentAllocation: allocation._id,
        status: 'active',
      });

      // Update bed status to occupied
      await Bed.findByIdAndUpdate(tc.bed._id, {
        status: 'occupied',
        currentTenant: user._id,
        currentAllocation: allocation._id,
      });

      // Create Rent Invoices:
      // Past month (Paid)
      const prevInvoice = await RentInvoice.create({
        invoiceNumber: `INV-202610-${user.phone.slice(-4)}`,
        tenant: user._id,
        bedAllocation: allocation._id,
        building: building1._id,
        owner: ownerUser._id,
        billingMonth: '2026-10',
        dueDate: new Date('2026-10-05'),
        baseRent: tc.rent,
        totalAmount: tc.rent,
        amountPaid: tc.rent,
        balanceDue: 0,
        status: 'paid',
        paidAt: new Date('2026-10-04'),
        lastPaymentDate: new Date('2026-10-04'),
      });

      await Payment.create({
        paymentNumber: `PAY-202610-${user.phone.slice(-4)}`,
        rentInvoice: prevInvoice._id,
        tenant: user._id,
        owner: ownerUser._id,
        amount: tc.rent,
        currency: 'INR',
        paymentMethod: 'sandbox_upi',
        transactionId: `TXN_202610_${user.phone.slice(-4)}`,
        providerReference: `UPI_REF_${Date.now()}`,
        idempotencyKey: `IDEM_PREV_${user._id}`,
        status: 'success',
        signatureVerified: true,
        metadata: { paidVia: 'Google Pay (UPI)', isSandbox: true },
        auditTrail: [{ status: 'success', message: 'Rent payment completed via UPI' }]
      });

      // Current Month invoice
      // Make Rahul paid, Priya pending, Amit paid, Sneha pending, Vikram pending
      const isPaid = tc.email === 'rahul@gmail.com' || tc.email === 'amit@gmail.com';
      const curInvoice = await RentInvoice.create({
        invoiceNumber: `INV-${currentMonth.replace('-', '')}-${user.phone.slice(-4)}`,
        tenant: user._id,
        bedAllocation: allocation._id,
        building: building1._id,
        owner: ownerUser._id,
        billingMonth: currentMonth,
        dueDate: new Date(`${currentMonth}-05`),
        baseRent: tc.rent,
        totalAmount: tc.rent,
        amountPaid: isPaid ? tc.rent : 0,
        balanceDue: isPaid ? 0 : tc.rent,
        status: isPaid ? 'paid' : (new Date().getDate() > 5 ? 'overdue' : 'pending'),
        paidAt: isPaid ? new Date() : null,
        lastPaymentDate: isPaid ? new Date() : null,
      });

      if (isPaid) {
        await Payment.create({
          paymentNumber: `PAY-${currentMonth.replace('-', '')}-${user.phone.slice(-4)}`,
          rentInvoice: curInvoice._id,
          tenant: user._id,
          owner: ownerUser._id,
          amount: tc.rent,
          currency: 'INR',
          paymentMethod: 'sandbox_upi',
          transactionId: `TXN_CUR_${user.phone.slice(-4)}`,
          providerReference: `UPI_REF_${Date.now() + 100}`,
          idempotencyKey: `IDEM_CUR_${user._id}`,
          status: 'success',
          signatureVerified: true,
          metadata: { paidVia: 'PhonePe (UPI)', isSandbox: true },
          auditTrail: [{ status: 'success', message: 'Rent payment completed via UPI' }]
        });
      }

      // Meal Attendance for today (Rahul & Priya had breakfast and lunch)
      if (tc.email === 'rahul@gmail.com' || tc.email === 'priya@gmail.com') {
        await MealAttendance.create({
          tenant: user._id,
          building: building1._id,
          date: today,
          mealType: 'breakfast',
          scanTime: new Date(`${today}T08:15:00Z`),
          scannedBy: ownerUser._id,
          verificationMethod: 'qr_scan',
          notes: 'Scanned via Mobile QR Scanner',
        });
        await MealAttendance.create({
          tenant: user._id,
          building: building1._id,
          date: today,
          mealType: 'lunch',
          scanTime: new Date(`${today}T13:10:00Z`),
          scannedBy: ownerUser._id,
          verificationMethod: 'qr_scan',
          notes: 'Scanned via Mobile QR Scanner',
        });
      }
    }

    // 7. Seed Weekly Indian Food Menu for Building 1
    const weeklyMenuData = [
      {
        day: 'monday',
        breakfast: { items: 'Idli, Medu Vada, Sambar & Coconut Chutney, Tea/Coffee', timing: '07:30 - 09:30' },
        lunch: { items: 'Steamed Basmati Rice, Dal Tadka, Aloo Gobi Matar, Phulka Roti, Curd', timing: '12:30 - 14:30' },
        dinner: { items: 'Paneer Butter Masala, Chapati, Jeera Rice, Cucumber Onion Salad', timing: '19:30 - 21:30' },
      },
      {
        day: 'tuesday',
        breakfast: { items: 'Indori Poha with Sev & Jalebi, Masala Chai', timing: '07:30 - 09:30' },
        lunch: { items: 'Rajma Chawal, Tawa Paratha, Boondi Raita, Green Salad', timing: '12:30 - 14:30' },
        dinner: { items: 'Mix Veg Korma, Butter Roti, Veg Pulao, Gulab Jamun', timing: '19:30 - 21:30' },
      },
      {
        day: 'wednesday',
        breakfast: { items: 'Crispy Masala Dosa, Potato Masala, Tomato & Coconut Chutney', timing: '07:30 - 09:30' },
        lunch: { items: 'South Indian Sambar, Beetroot Poriyal, Rasam, Steamed Rice, Papad', timing: '12:30 - 14:30' },
        dinner: { items: 'Kadai Paneer / Egg Curry, Tandoori Roti, Ghee Rice', timing: '19:30 - 21:30' },
      },
      {
        day: 'thursday',
        breakfast: { items: 'Stuffed Aloo Paratha with Amul Butter, Fresh Dahi & Mixed Pickle', timing: '07:30 - 09:30' },
        lunch: { items: 'Amritsari Chole, Bhature / Steamed Rice, Sweet Lassi', timing: '12:30 - 14:30' },
        dinner: { items: 'Dal Makhani, Butter Naan, Veg Biryani, Mixed Raita, Kheer', timing: '19:30 - 21:30' },
      },
      {
        day: 'friday',
        breakfast: { items: 'Rava Upma with Roasted Cashews & Coconut Chutney, Filter Coffee', timing: '07:30 - 09:30' },
        lunch: { items: 'Lemon Rice, Veg Kurma, Phulka, Moong Dal Khichdi, Papad', timing: '12:30 - 14:30' },
        dinner: { items: 'Hyderabadi Veg Dum Biryani, Mirchi Ka Salan, Onion Cucumber Raita', timing: '19:30 - 21:30' },
      },
      {
        day: 'saturday',
        breakfast: { items: 'Bedmi Puri with Spicy Aloo Sabzi, Masala Chai', timing: '08:00 - 10:00' },
        lunch: { items: 'Dal Palak, Jeera Aloo, Hot Rotis, Steamed Rice, Buttermilk', timing: '12:30 - 14:30' },
        dinner: { items: 'Matar Paneer, Laccha Paratha, Peas Pulao, Hot Jalebi', timing: '19:30 - 21:30' },
      },
      {
        day: 'sunday',
        breakfast: { items: 'Mysore Masala Dosa, Set Dosa with Vada & Filter Coffee', timing: '08:00 - 10:30' },
        lunch: { items: 'Sunday Special Royal Thali: Paneer Lababdar, Dal Tadka, Pulao, Poori, Sweet', timing: '12:30 - 15:00' },
        dinner: { items: 'Mumbai Pav Bhaji with Butter Pav, Tawa Pulao, Ice Cream', timing: '19:30 - 21:30' },
      },
    ];

    for (const menuDay of weeklyMenuData) {
      await Menu.create({
        owner: ownerUser._id,
        building: building1._id,
        dayOfWeek: menuDay.day,
        breakfast: menuDay.breakfast,
        lunch: menuDay.lunch,
        dinner: menuDay.dinner,
        isPublished: true,
      });
    }

    // 8. Seed Complaints
    const rahulUser = await User.findOne({ email: 'rahul@gmail.com' });
    const priyaUser = await User.findOne({ email: 'priya@gmail.com' });

    await Complaint.create({
      complaintNumber: 'CMP-0001',
      tenant: rahulUser._id,
      building: building1._id,
      room: room101._id,
      category: 'water',
      title: 'Geyser not heating in bathroom',
      description: 'The instant geyser in Room 101 turns on but trips the MCB after 2 minutes. Please send an electrician.',
      priority: 'high',
      status: 'in_progress',
      ownerResponse: 'Electrician Ramesh is scheduled to visit tomorrow morning at 10:00 AM.',
      assignedTo: { name: 'Ramesh Electrician', phone: '9845012345' },
    });

    await Complaint.create({
      complaintNumber: 'CMP-0002',
      tenant: priyaUser._id,
      building: building1._id,
      room: room102._id,
      category: 'wifi',
      title: 'Wi-Fi disconnects frequently near balcony',
      description: 'The Wi-Fi router on the 1st floor has weak signal reach inside room 102 near the balcony door.',
      priority: 'medium',
      status: 'pending',
    });

    await Complaint.create({
      complaintNumber: 'CMP-0003',
      tenant: rahulUser._id,
      building: building1._id,
      room: room101._id,
      category: 'cleaning',
      title: 'Request deep room cleaning',
      description: 'Please arrange deep vacuuming and mop for Room 101 on Saturday.',
      priority: 'low',
      status: 'resolved',
      ownerResponse: 'Cleaning completed by staff Sunita on Saturday 3 PM.',
      resolvedAt: new Date(),
    });

    // 9. Seed Announcements
    await Announcement.create({
      owner: ownerUser._id,
      building: building1._id,
      title: 'Water Tank Cleaning Scheduled for Saturday',
      message: 'Dear residents, overhead solar and drinking water tanks will be deep cleaned this Saturday between 10:00 AM and 1:00 PM. Water supply may be briefly interrupted.',
      priority: 'important',
    });

    // 10. Seed Notifications for Rahul
    await Notification.create({
      recipient: rahulUser._id,
      role: 'tenant',
      title: 'Rent Payment Received',
      message: 'Your rent payment of ₹9,500 has been verified. Thank you!',
      type: 'rent',
    });

    // Seed Notification for Owner
    await Notification.create({
      recipient: ownerUser._id,
      role: 'owner',
      title: 'New Complaint Received',
      message: 'Rahul Verma submitted a complaint for Room 101: Geyser not heating.',
      type: 'complaint',
    });

    console.log('✅ PGmate Database Seeding Completed Successfully!');
    console.log('Credentials:');
    console.log('  Owner:  owner@pgmate.in / Password@123');
    console.log('  Tenant: rahul@gmail.com / Password@123');
    console.log('  Tenant: priya@gmail.com / Password@123');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// If run directly via command line
if (process.argv[1]?.endsWith('seed.js')) {
  import('../config/db.js').then(async ({ connectDB, closeDB }) => {
    await connectDB();
    await seedDatabase(true);
    await closeDB();
    process.exit(0);
  });
}
