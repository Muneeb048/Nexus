const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const CollaborationRequest = require('./models/CollaborationRequest');
const Message = require('./models/Message');

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await CollaborationRequest.deleteMany({});
    await Message.deleteMany({});
    console.log('Cleared existing data');

    // ── Seed Users ──

    const entrepreneurs = await User.create([
      {
        name: 'Sarah Johnson',
        email: 'sarah@techwave.io',
        password: 'password123',
        role: 'entrepreneur',
        avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
        bio: 'Serial entrepreneur with 10+ years of experience in SaaS and fintech.',
        startupName: 'TechWave AI',
        pitchSummary: 'AI-powered financial analytics platform helping SMBs make data-driven decisions.',
        fundingNeeded: '$1.5M',
        industry: 'FinTech',
        location: 'San Francisco, CA',
        foundedYear: 2021,
        teamSize: 12,
        isOnline: true
      },
      {
        name: 'David Chen',
        email: 'david@greenlife.co',
        password: 'password123',
        role: 'entrepreneur',
        avatarUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
        bio: 'Environmental scientist turned entrepreneur. Passionate about sustainable solutions.',
        startupName: 'GreenLife Solutions',
        pitchSummary: 'Biodegradable packaging alternatives for consumer goods and food industry.',
        fundingNeeded: '$2M',
        industry: 'CleanTech',
        location: 'Portland, OR',
        foundedYear: 2020,
        teamSize: 8,
        isOnline: false
      },
      {
        name: 'Maya Patel',
        email: 'maya@healthpulse.com',
        password: 'password123',
        role: 'entrepreneur',
        avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
        bio: 'Former healthcare professional with an MBA. Building tech to improve patient care.',
        startupName: 'HealthPulse',
        pitchSummary: 'Mobile platform connecting patients with mental health professionals in real-time.',
        fundingNeeded: '$800K',
        industry: 'HealthTech',
        location: 'Boston, MA',
        foundedYear: 2022,
        teamSize: 5,
        isOnline: true
      },
      {
        name: 'James Wilson',
        email: 'james@urbanfarm.io',
        password: 'password123',
        role: 'entrepreneur',
        avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        bio: 'Agricultural engineer focused on urban farming solutions and food security.',
        startupName: 'UrbanFarm',
        pitchSummary: 'IoT-enabled vertical farming systems for urban environments and food deserts.',
        fundingNeeded: '$3M',
        industry: 'AgTech',
        location: 'Chicago, IL',
        foundedYear: 2019,
        teamSize: 14,
        isOnline: false
      }
    ]);

    console.log(`Seeded ${entrepreneurs.length} entrepreneurs`);

    const investors = await User.create([
      {
        name: 'Michael Rodriguez',
        email: 'michael@vcinnovate.com',
        password: 'password123',
        role: 'investor',
        avatarUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
        bio: 'Early-stage investor with focus on B2B SaaS and fintech. Previously founded and exited two startups.',
        investmentInterests: ['FinTech', 'SaaS', 'AI/ML'],
        investmentStage: ['Seed', 'Series A'],
        portfolioCompanies: ['PayStream', 'DataSense', 'CloudSecure'],
        totalInvestments: 12,
        minimumInvestment: '$250K',
        maximumInvestment: '$1.5M',
        isOnline: true
      },
      {
        name: 'Jennifer Lee',
        email: 'jennifer@impactvc.org',
        password: 'password123',
        role: 'investor',
        avatarUrl: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
        bio: 'Impact investor focused on climate tech, sustainable agriculture, and clean energy.',
        investmentInterests: ['CleanTech', 'AgTech', 'Sustainability'],
        investmentStage: ['Seed', 'Series A', 'Series B'],
        portfolioCompanies: ['SolarFlow', 'EcoPackage', 'CleanWater Solutions'],
        totalInvestments: 18,
        minimumInvestment: '$500K',
        maximumInvestment: '$3M',
        isOnline: false
      },
      {
        name: 'Robert Torres',
        email: 'robert@healthventures.com',
        password: 'password123',
        role: 'investor',
        avatarUrl: 'https://images.pexels.com/photos/834863/pexels-photo-834863.jpeg',
        bio: 'Healthcare-focused investor with medical background. Looking for innovations in patient care and biotech.',
        investmentInterests: ['HealthTech', 'BioTech', 'Medical Devices'],
        investmentStage: ['Series A', 'Series B'],
        portfolioCompanies: ['MediTrack', 'BioGenics', 'Patient+'],
        totalInvestments: 9,
        minimumInvestment: '$1M',
        maximumInvestment: '$5M',
        isOnline: true
      }
    ]);

    console.log(`Seeded ${investors.length} investors`);

    // ── Seed Collaboration Requests ──

    const collabRequests = await CollaborationRequest.create([
      {
        investorId: investors[0]._id, // Michael
        entrepreneurId: entrepreneurs[0]._id, // Sarah
        message: 'I\'d like to explore potential investment in TechWave AI. Your AI-driven financial analytics platform aligns well with my investment thesis.',
        status: 'pending'
      },
      {
        investorId: investors[1]._id, // Jennifer
        entrepreneurId: entrepreneurs[0]._id, // Sarah
        message: 'Interested in discussing how TechWave AI can incorporate sustainable practices. Let\'s connect to explore potential collaboration.',
        status: 'accepted'
      },
      {
        investorId: investors[2]._id, // Robert
        entrepreneurId: entrepreneurs[2]._id, // Maya
        message: 'Your HealthPulse platform addresses a critical need in mental healthcare. I\'d like to learn more about your traction and roadmap.',
        status: 'pending'
      },
      {
        investorId: investors[1]._id, // Jennifer
        entrepreneurId: entrepreneurs[1]._id, // David
        message: 'GreenLife\'s biodegradable packaging solutions align with my focus on sustainable investments. Let\'s discuss scaling possibilities.',
        status: 'accepted'
      },
      {
        investorId: investors[0]._id, // Michael
        entrepreneurId: entrepreneurs[3]._id, // James
        message: 'Your UrbanFarm concept is fascinating. I\'m interested in learning more about your IoT implementation and market validation.',
        status: 'rejected'
      }
    ]);

    console.log(`Seeded ${collabRequests.length} collaboration requests`);

    // ── Seed Messages ──

    const msgs = await Message.create([
      // Conversation: Sarah <-> Michael
      {
        senderId: entrepreneurs[0]._id,
        receiverId: investors[0]._id,
        content: 'Thanks for connecting. I\'d love to discuss how our AI platform can revolutionize financial analytics for SMBs.',
        isRead: true
      },
      {
        senderId: investors[0]._id,
        receiverId: entrepreneurs[0]._id,
        content: 'I\'m interested in learning more about your tech stack and ML models. Are you available for a call this week?',
        isRead: true
      },
      {
        senderId: entrepreneurs[0]._id,
        receiverId: investors[0]._id,
        content: 'Absolutely! I can walk you through our technology and current traction. How does Thursday at 2pm PT work?',
        isRead: true
      },
      {
        senderId: investors[0]._id,
        receiverId: entrepreneurs[0]._id,
        content: 'Thursday works great. I\'ll send a calendar invite. Looking forward to it!',
        isRead: false
      },
      // Conversation: Maya <-> Jennifer
      {
        senderId: investors[1]._id,
        receiverId: entrepreneurs[2]._id,
        content: 'I saw your pitch for HealthPulse and I\'m intrigued by your approach to mental healthcare accessibility.',
        isRead: true
      },
      {
        senderId: entrepreneurs[2]._id,
        receiverId: investors[1]._id,
        content: 'Thank you, Jennifer! Mental health services need to be more accessible, especially in underserved communities.',
        isRead: true
      },
      {
        senderId: investors[1]._id,
        receiverId: entrepreneurs[2]._id,
        content: 'I completely agree. Could you share more about your user acquisition strategy and current metrics?',
        isRead: false
      },
      // Conversation: David <-> Robert
      {
        senderId: entrepreneurs[1]._id,
        receiverId: investors[2]._id,
        content: 'Hello Robert, I noticed you invest in healthcare. While GreenLife is focused on sustainable packaging, we have some applications in medical supplies.',
        isRead: true
      },
      {
        senderId: investors[2]._id,
        receiverId: entrepreneurs[1]._id,
        content: 'Interesting crossover, David. I\'d be interested in learning more about your biodegradable materials and how they could be used in healthcare.',
        isRead: true
      },
      {
        senderId: entrepreneurs[1]._id,
        receiverId: investors[2]._id,
        content: 'Great! We\'ve been developing materials that can safely package medical devices while being eco-friendly. Our tests show 40% less environmental impact.',
        isRead: false
      }
    ]);

    console.log(`Seeded ${msgs.length} messages`);

    // ── Print user IDs for reference ──
    console.log('\n── User IDs for reference ──');
    entrepreneurs.forEach(e => console.log(`  ${e.name} (${e.role}): ${e._id}`));
    investors.forEach(i => console.log(`  ${i.name} (${i.role}): ${i._id}`));

    console.log('\n✅ Database seeded successfully!');
    console.log('Demo login: sarah@techwave.io / password123 (entrepreneur)');
    console.log('Demo login: michael@vcinnovate.com / password123 (investor)');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
