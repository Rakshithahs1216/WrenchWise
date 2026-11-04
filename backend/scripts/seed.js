/**
 * Wipes the database and loads deterministic demo data:
 * 1 admin, 3 technicians, 4 users, 12 vehicles and ~80 services spread over
 * the past 12 months and the next 3 months (relative to today).
 *
 * Usage: npm run seed
 */
const env = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const { User, Vehicle, Service } = require('../src/models');
const { hashPassword } = require('../src/utils/password');

const DAY = 24 * 3600 * 1000;
const HOUR = 3600 * 1000;
const SERVICE_COUNT = 80;

/** mulberry32: small seeded PRNG so every seed run produces the same data shape. */
function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(20261104);
const randInt = (min, max) => min + Math.floor(rng() * (max - min + 1));
const pick = (items) => items[Math.floor(rng() * items.length)];

/** Picks a key from `{ key: weight }` proportionally to its weight. */
function weightedPick(weights) {
  const entries = Object.entries(weights);
  let roll = rng() * entries.reduce((sum, [, w]) => sum + w, 0);
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

const PEOPLE = {
  admin: [{ name: 'Rakshitha Menon', email: 'admin@wrenchwise.dev' }],
  technician: [
    { name: 'Arjun Nair', email: 'tech1@wrenchwise.dev' },
    { name: 'Suresh Kumar', email: 'tech2@wrenchwise.dev' },
    { name: 'Farhan Sheikh', email: 'tech3@wrenchwise.dev' },
  ],
  user: [
    { name: 'Priya Sharma', email: 'user1@wrenchwise.dev' },
    { name: 'Vikram Reddy', email: 'user2@wrenchwise.dev' },
    { name: 'Ananya Iyer', email: 'user3@wrenchwise.dev' },
    { name: 'Rahul Deshpande', email: 'user4@wrenchwise.dev' },
  ],
};

const PASSWORDS = { admin: 'Admin@123', technician: 'Tech@123', user: 'User@123' };

// [registrationNumber, make, model, year, owner index (into users) or null]
const VEHICLES = [
  ['KA01AB1234', 'Tata', 'Ace EV', 2023, 0],
  ['KA05MN4821', 'Mahindra', 'Treo Zor', 2024, 0],
  ['KA03HC7710', 'Ashok Leyland', 'Dost+', 2021, 0],
  ['MH12QW5566', 'Eicher', 'Pro 2049', 2022, 1],
  ['MH04GT9032', 'Tata', 'Intra V30', 2023, 1],
  ['MH14EV2207', 'Piaggio', 'Ape E-Xtra', 2024, 1],
  ['TN09BZ3345', 'Mahindra', 'Jeeto Plus', 2020, 2],
  ['TN22EV8810', 'Euler', 'HiLoad EV', 2024, 2],
  ['TN07CK4418', 'BharatBenz', '1617R', 2019, 3],
  ['KA51EV6603', 'Omega Seiki', 'Rage+', 2023, 3],
  ['KA02MF1189', 'Tata', 'Yodha 2.0', 2022, null],
  ['MH01DL7734', 'Ashok Leyland', 'Bada Dost i4', 2021, null],
];

const TYPE_WEIGHTS = {
  'oil-change': 18,
  'general-inspection': 16,
  'tire-rotation': 13,
  'brake-inspection': 13,
  'battery-check': 14,
  'engine-diagnostics': 9,
  'transmission-service': 6,
  other: 4,
};

const DESCRIPTIONS = {
  'oil-change': ['10,000 km periodic service', 'Engine oil and filter change', 'Scheduled oil service'],
  'tire-rotation': ['Rotate and balance all tyres', 'Uneven wear on front tyres', 'Tyre rotation and pressure check'],
  'brake-inspection': ['Brake pads squealing at low speed', 'Routine brake inspection', 'Driver reports longer stopping distance'],
  'battery-check': ['Battery health check', 'Range dropped noticeably this month', 'Traction battery SoH assessment'],
  'engine-diagnostics': ['Check-engine light on', 'Loss of power on inclines', 'Rough idle when cold'],
  'transmission-service': ['Gear shifts feel hard', 'Clutch slipping under load', 'Gearbox oil replacement'],
  'general-inspection': ['Quarterly fleet inspection', 'Pre-permit renewal inspection', 'Annual fitness check'],
  other: ['Wiper blades and lights check', 'AC not cooling enough', 'Body rattle from rear panel'],
};

const COMPLETION_NOTES = {
  'oil-change': ['Drained and replaced engine oil (5W-30), new oil filter fitted.', 'Air filter cleaned; next oil change due in 10,000 km.'],
  'tire-rotation': ['Rotated tyres front-to-rear, balanced all wheels.', 'Pressure set to 65 psi; rear-left tyre at 40% tread, flag for replacement.'],
  'brake-inspection': ['Front brake pads at 3 mm, replaced. Discs within tolerance.', 'Brake fluid topped up and system bled.'],
  'battery-check': ['Battery SoH at 92%, cell balance within 15 mV.', 'Cleaned terminals and updated BMS firmware.'],
  'engine-diagnostics': ['Scanner showed P0171 (lean mixture); cleaned MAF sensor.', 'Replaced faulty O2 sensor, cleared fault codes, road-tested OK.'],
  'transmission-service': ['Gearbox oil replaced; clutch free play adjusted.', 'Replaced worn clutch plate and release bearing.'],
  'general-inspection': ['All lights, horn, wipers and seat belts OK.', 'Minor coolant seep at hose clamp, tightened.'],
  other: ['Replaced wiper blades and a fused tail lamp.', 'AC gas topped up, cabin filter replaced.'],
};

async function createUsers() {
  const users = {};
  for (const [role, people] of Object.entries(PEOPLE)) {
    const passwordHash = await hashPassword(PASSWORDS[role]);
    users[role] = await User.insertMany(people.map((p) => ({ ...p, role, passwordHash })));
  }
  return users;
}

function createVehicles(owners) {
  return Vehicle.insertMany(
    VEHICLES.map(([registrationNumber, make, model, year, ownerIndex], i) => ({
      registrationNumber,
      make,
      model,
      year,
      vin: `MA${String(year).slice(2)}${registrationNumber.slice(0, 4)}${String(100000 + i * 7919).padStart(9, '0')}`,
      mileage: randInt(4000, 22000) * (2026 - year + 1),
      status: i === VEHICLES.length - 1 ? 'retired' : 'active',
      assignedUser: ownerIndex === null ? null : owners[ownerIndex]._id,
    })),
  );
}

/** Picks a status and workflow timestamps that are plausible for the scheduled date. */
function lifecycleFor(scheduledDate, now) {
  const ageDays = (now - scheduledDate) / DAY;
  let status;
  if (ageDays > 14) status = rng() < 0.93 ? 'completed' : 'pending'; // a few overdue
  else if (ageDays > 0) status = weightedPick({ completed: 4, 'in-progress': 4, pending: 2 });
  else if (ageDays > -7) status = weightedPick({ pending: 2, 'in-progress': 1 });
  else status = 'pending';

  const startedAt =
    status === 'pending' ? null : new Date(Math.min(scheduledDate.getTime() + randInt(1, 4) * HOUR, now.getTime()));
  const completedAt =
    status === 'completed' ? new Date(Math.min(startedAt.getTime() + randInt(2, 30) * HOUR, now.getTime())) : null;
  return { status, startedAt, completedAt };
}

function buildServices(vehicles, technicians, admin, now) {
  const serviceable = vehicles.filter((v) => v.status !== 'retired');
  const services = [];

  for (let i = 0; i < SERVICE_COUNT; i += 1) {
    // ~80% in the past 12 months, ~20% in the next 3 months.
    const offsetDays = rng() < 0.8 ? -randInt(1, 360) : randInt(0, 110);
    const scheduledDate = new Date(now.getTime() + offsetDays * DAY);
    scheduledDate.setUTCHours(randInt(3, 10), pick([0, 30]), 0, 0); // 08:30–16:00 IST

    const serviceType = weightedPick(TYPE_WEIGHTS);
    const technician = pick(technicians);
    const lifecycle = lifecycleFor(scheduledDate, now);

    const notes = [];
    if (lifecycle.status !== 'pending') {
      notes.push({ text: 'Vehicle received at bay; job card opened.', author: technician._id, createdAt: lifecycle.startedAt });
    }
    if (lifecycle.status === 'completed') {
      const [first, second] = COMPLETION_NOTES[serviceType];
      notes.push({ text: first, author: technician._id, createdAt: lifecycle.completedAt });
      if (rng() < 0.5) notes.push({ text: second, author: technician._id, createdAt: lifecycle.completedAt });
      if (rng() < 0.15) notes.push({ text: 'Invoice shared with fleet owner.', author: admin._id, createdAt: lifecycle.completedAt });
    }

    services.push({
      vehicle: pick(serviceable)._id,
      technician: technician._id,
      serviceType,
      description: pick(DESCRIPTIONS[serviceType]),
      scheduledDate,
      notes,
      ...lifecycle,
    });
  }
  return services;
}

async function seed() {
  if (env.isProduction && !process.argv.includes('--force')) {
    throw new Error('Refusing to wipe a production database; pass --force to override');
  }
  await connectDB(env.mongoUri);
  console.log(`Seeding ${env.mongoUri.replace(/\/\/[^@/]*@/, '//***@')}`);

  await Promise.all([User.deleteMany({}), Vehicle.deleteMany({}), Service.deleteMany({})]);
  await Promise.all([User.init(), Vehicle.init(), Service.init()]);

  const users = await createUsers();
  const vehicles = await createVehicles(users.user);
  const services = await Service.insertMany(buildServices(vehicles, users.technician, users.admin[0], new Date()));

  // Vehicles with work in progress are shown as in the workshop.
  const inShop = services.filter((s) => s.status === 'in-progress').map((s) => s.vehicle);
  await Vehicle.updateMany({ _id: { $in: inShop } }, { status: 'in-service' });

  const byStatus = services.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }), {});
  console.log(`Created ${Object.values(users).flat().length} users, ${vehicles.length} vehicles, ${services.length} services`, byStatus);
  console.log('Credentials:');
  for (const [role, people] of Object.entries(PEOPLE)) {
    for (const { email } of people) console.log(`  ${role.padEnd(10)} ${email.padEnd(24)} ${PASSWORDS[role]}`);
  }
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
