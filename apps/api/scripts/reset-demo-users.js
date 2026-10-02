const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const URI = process.env.MONGODB_URI || 'mongodb://ayushlodhi88_db_user:9IzJqRATQYl1hERt@ac-gkiqwag-shard-00-00.wiv7fca.mongodb.net:27017,ac-gkiqwag-shard-00-01.wiv7fca.mongodb.net:27017,ac-gkiqwag-shard-00-02.wiv7fca.mongodb.net:27017/tbi_db?ssl=true&replicaSet=atlas-6g5sz6-shard-0&authSource=admin&appName=Cluster0';

async function resetDemoAccounts() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(URI);
  const usersCol = mongoose.connection.collection('users');

  const demoAccounts = [
    { email: 'super@tbi.org', pass: 'super123', name: 'Shrey Mehra', role: 'SUPER_ADMIN' },
    { email: 'admin@tbi.org', pass: 'admin123', name: 'Rajesh Kumar', role: 'ADMIN' },
    { email: 'mayank@tbi.org', pass: 'mayank123', name: 'Mayank', role: 'T3_EXECUTIVE' },
    { email: 'abhishek@tbi.org', pass: 'abhishek123', name: 'Abhishek Singh', role: 'T2_ASSOCIATE' },
    { email: 'ayush@tbi.org', pass: 'ayush123', name: 'Ayush', role: 'T1_VOLUNTEER' },
  ];

  for (const acc of demoAccounts) {
    const hash = await bcrypt.hash(acc.pass, 12);
    const res = await usersCol.updateOne(
      { email: acc.email },
      {
        $set: {
          name: acc.name,
          role: acc.role,
          password: hash,
          isActive: true,
          mustChangePassword: false,
          passwordChangeStartedAt: null,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    console.log(`Updated ${acc.email} with password "${acc.pass}" (Matched: ${res.matchedCount}, Upserted: ${res.upsertedCount})`);
  }

  await mongoose.disconnect();
  console.log('Done!');
}

resetDemoAccounts().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
