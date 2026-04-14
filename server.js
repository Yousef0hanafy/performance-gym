'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const initSqlJs = require('sql.js');

const app  = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const DB_PATH = path.join(__dirname, 'database.sqlite');

// ─── sql.js helpers ───────────────────────────────────────────────────────────
let db;

function loadDb(SQL) {
  if (fs.existsSync(DB_PATH)) {
    return new SQL.Database(fs.readFileSync(DB_PATH));
  }
  return new SQL.Database();
}

function saveDb() {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

/** Run a write statement (INSERT/UPDATE/DELETE) */
function dbRun(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

/** Return first matching row, or null */
function dbGet(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

/** Return all matching rows */
function dbAll(sql, params = []) {
  const rows = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

/** INSERT and return new row id */
function dbInsert(sql, params = []) {
  db.run(sql, params);
  const row = dbGet('SELECT last_insert_rowid() AS id');
  saveDb();
  return row ? row.id : null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── API: Services ────────────────────────────────────────────────────────────
app.get('/api/services', (_req, res) => {
  res.json({ success: true, data: [
    { id:1, name:'Personal Training',  icon:'💪', description:'One-on-one sessions with certified personal trainers tailored to your goals.',         features:['Custom workout plans','Nutritional guidance','Progress tracking','Flexible scheduling'] },
    { id:2, name:'Group Classes',      icon:'🏋️', description:'High-energy group classes for all fitness levels led by expert instructors.',          features:['30+ weekly classes','HIIT, Yoga, Spin & more','Community atmosphere','No experience needed'] },
    { id:3, name:'Cardio Zone',        icon:'🏃', description:'State-of-the-art cardio equipment with entertainment systems.',                         features:['Treadmills & ellipticals','Rowing machines','Smart TV integration','Heart rate monitoring'] },
    { id:4, name:'Strength Training',  icon:'🏆', description:'Extensive free weights and resistance machines for all strength goals.',                features:['Olympic lifting platforms','Power racks & cages','Full dumbbell range','Cable machines'] },
    { id:5, name:'Nutrition Coaching', icon:'🥗', description:'Expert nutritional guidance to fuel your performance and recovery.',                    features:['Meal planning','Supplement advice','Body composition analysis','Weekly check-ins'] },
    { id:6, name:'Recovery & Spa',     icon:'🧘', description:'Premium recovery facilities to help you rest, restore, and perform better.',            features:['Sauna & steam room','Ice bath therapy','Massage services','Stretching studio'] },
  ]});
});

// ─── API: Pricing ─────────────────────────────────────────────────────────────
app.get('/api/pricing', (_req, res) => {
  res.json({ success: true, data: [
    { id:1, name:'Starter',     price:29, period:'month', highlight:false, description:'Perfect for beginners',           features:['Gym floor access','Locker room access','2 group classes/month','Basic fitness assessment','Mobile app access'],                                             cta:'Get Started' },
    { id:2, name:'Performance', price:59, period:'month', highlight:true,  badge:'Most Popular', description:'For serious fitness enthusiasts', features:['Everything in Starter','Unlimited group classes','2 PT sessions/month','Nutrition consultation','Recovery zone access','Guest passes (2/month)'], cta:'Join Now' },
    { id:3, name:'Elite',       price:99, period:'month', highlight:false, description:'Maximum results, no compromises', features:['Everything in Performance','Unlimited PT sessions','Custom meal planning','Priority class booking','Exclusive member events','Free guest passes','Dedicated locker'], cta:'Go Elite' },
  ]});
});

// ─── API: Testimonials ────────────────────────────────────────────────────────
app.get('/api/testimonials', (_req, res) => {
  const rows = dbAll('SELECT * FROM testimonials WHERE approved=1 ORDER BY id DESC');
  res.json({ success: true, data: rows });
});

app.post('/api/testimonials', (req, res) => {
  const { name, role, content, rating } = req.body;
  if (!name || !content) return res.status(400).json({ success:false, message:'Name and content are required.' });
  const r = Math.min(5, Math.max(1, parseInt(rating) || 5));
  const id = dbInsert(
    'INSERT INTO testimonials (name,role,content,rating,approved,created_at) VALUES (?,?,?,?,0,?)',
    [name, role || null, content, r, new Date().toISOString()]
  );
  res.status(201).json({ success:true, message:"Testimonial submitted! It will appear after review.", id });
});

app.patch('/api/testimonials/:id/approve', (req, res) => {
  dbRun('UPDATE testimonials SET approved=1 WHERE id=?', [req.params.id]);
  res.json({ success:true, message:'Testimonial approved.' });
});

app.delete('/api/testimonials/:id', (req, res) => {
  dbRun('DELETE FROM testimonials WHERE id=?', [req.params.id]);
  res.json({ success:true, message:'Testimonial deleted.' });
});

// ─── API: Contact ─────────────────────────────────────────────────────────────
app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ success:false, message:'Name, email, and message are required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success:false, message:'Invalid email address.' });
  const id = dbInsert(
    'INSERT INTO contacts (name,email,phone,message,created_at) VALUES (?,?,?,?,?)',
    [name, email, phone || null, message, new Date().toISOString()]
  );
  res.status(201).json({ success:true, message:"Thank you! We'll be in touch within 24 hours.", id });
});

app.get('/api/contacts', (_req, res) => {
  res.json({ success:true, data: dbAll('SELECT * FROM contacts ORDER BY id DESC') });
});

// ─── API: Bookings ────────────────────────────────────────────────────────────
app.post('/api/bookings', (req, res) => {
  const { name, email, phone, plan, preferred_date, preferred_time, notes } = req.body;
  if (!name || !email || !plan) return res.status(400).json({ success:false, message:'Name, email, and plan are required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success:false, message:'Invalid email address.' });
  const id = dbInsert(
    'INSERT INTO bookings (name,email,phone,plan,preferred_date,preferred_time,notes,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
    [name, email, phone||null, plan, preferred_date||null, preferred_time||null, notes||null, 'pending', new Date().toISOString()]
  );
  res.status(201).json({ success:true, message:`Booking confirmed for the ${plan} plan! We'll contact you shortly.`, id });
});

app.get('/api/bookings', (_req, res) => {
  res.json({ success:true, data: dbAll('SELECT * FROM bookings ORDER BY id DESC') });
});

app.patch('/api/bookings/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['pending','confirmed','cancelled'].includes(status))
    return res.status(400).json({ success:false, message:'Invalid status.' });
  dbRun('UPDATE bookings SET status=? WHERE id=?', [status, req.params.id]);
  res.json({ success:true, message:`Booking status updated to ${status}.` });
});

// ─── Admin + SPA fallback ─────────────────────────────────────────────────────
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('*',      (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ success:false, message: err.message || 'Internal server error' });
});

// ─── Bootstrap DB then start ──────────────────────────────────────────────────
initSqlJs().then(SQL => {
  db = loadDb(SQL);

  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT,
    message TEXT NOT NULL, created_at TEXT)`);

  db.run(`CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, role TEXT, content TEXT NOT NULL,
    rating INTEGER DEFAULT 5, approved INTEGER DEFAULT 0, created_at TEXT)`);

  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, plan TEXT NOT NULL,
    preferred_date TEXT, preferred_time TEXT, notes TEXT,
    status TEXT DEFAULT 'pending', created_at TEXT)`);

  // Seed demo testimonials once
  const count = dbGet('SELECT COUNT(*) AS n FROM testimonials');
  if (!count || count.n === 0) {
    const now = new Date().toISOString();
    [
      ['Sarah Mitchell',  'Member since 2022',   'Performance Gym completely transformed my fitness journey. The trainers are incredibly knowledgeable and the equipment is always top-notch!', 5],
      ['James Rodriguez', 'CrossFit Enthusiast',  "Best gym I've ever been to. The community here is amazing and the classes keep me motivated every single day.", 5],
      ['Emily Chen',      'Marathon Runner',      'The cardio facilities and personalized training programs helped me shave 15 minutes off my marathon time. Absolutely recommend!', 5],
      ['Marcus Williams', 'Powerlifter',          'Incredible range of free weights and power racks. Staff is always helpful and the atmosphere is electric. This is my second home.', 5],
    ].forEach(([n, r, c, rating]) =>
      db.run('INSERT INTO testimonials (name,role,content,rating,approved,created_at) VALUES (?,?,?,?,1,?)', [n, r, c, rating, now])
    );
    saveDb();
  }

  app.listen(PORT, () => {
    console.log(`🏋️  Performance Gym  →  http://localhost:${PORT}`);
    console.log(`📊  Admin panel      →  http://localhost:${PORT}/admin`);
  });
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });

module.exports = app;
