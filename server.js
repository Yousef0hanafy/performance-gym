'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://ujsobhoyzqwptarbsstm.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_C6cHjn300xP5fiaiT4E8ug_4X1VGyFJ';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_KEY.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── API: Services (Plans table) ─────────────────────────────────────────────
app.get('/api/services', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('Plans').select('*').order('id', { ascending: true });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

// ─── API: Pricing (kept static for site pricing cards) ───────────────────────
app.get('/api/pricing', (_req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Starter',
        price: 29,
        period: 'month',
        highlight: false,
        description: 'Perfect for beginners',
        features: [
          'Gym floor access',
          'Locker room access',
          '2 group classes/month',
          'Basic fitness assessment',
          'Mobile app access',
        ],
        cta: 'Get Started',
      },
      {
        id: 2,
        name: 'Performance',
        price: 59,
        period: 'month',
        highlight: true,
        badge: 'Most Popular',
        description: 'For serious fitness enthusiasts',
        features: [
          'Everything in Starter',
          'Unlimited group classes',
          '2 PT sessions/month',
          'Nutrition consultation',
          'Recovery zone access',
          'Guest passes (2/month)',
        ],
        cta: 'Join Now',
      },
      {
        id: 3,
        name: 'Elite',
        price: 99,
        period: 'month',
        highlight: false,
        description: 'Maximum results, no compromises',
        features: [
          'Everything in Performance',
          'Unlimited PT sessions',
          'Custom meal planning',
          'Priority class booking',
          'Exclusive member events',
          'Free guest passes',
          'Dedicated locker',
        ],
        cta: 'Go Elite',
      },
    ],
  });
});

// ─── API: Testimonials (Testimonials table) ──────────────────────────────────
app.get('/api/testimonials', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('Testimonials')
      .select('*')
      .eq('approved', true)
      .order('id', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

app.post('/api/testimonials', async (req, res, next) => {
  try {
    const { name, role, content, rating } = req.body;
    if (!name || !content) {
      return res.status(400).json({ success: false, message: 'Name and content are required.' });
    }

    const safeRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

    const payload = {
      name,
      role: role || null,
      content,
      rating: safeRating,
      approved: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('Testimonials').insert(payload).select('id').single();
    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Testimonial submitted! It will appear after review.',
      id: data?.id || null,
    });
  } catch (err) {
    next(err);
  }
});

app.patch('/api/testimonials/:id/approve', async (req, res, next) => {
  try {
    const { error } = await supabase.from('Testimonials').update({ approved: true }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Testimonial approved.' });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/testimonials/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('Testimonials').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Testimonial deleted.' });
  } catch (err) {
    next(err);
  }
});

// ─── API: Contact (Contacts table) ───────────────────────────────────────────
app.post('/api/contact', async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required.',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    const payload = {
      name,
      email,
      phone: phone || null,
      message,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('Contacts').insert(payload).select('id').single();
    if (error) throw error;

    res.status(201).json({
      success: true,
      message: "Thank you! We'll be in touch within 24 hours.",
      id: data?.id || null,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/contacts', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('Contacts').select('*').order('id', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

// ─── API: Bookings (Booking table) ───────────────────────────────────────────
app.post('/api/bookings', async (req, res, next) => {
  try {
    const { name, email, phone, plan, preferred_date, preferred_time, notes } = req.body;

    if (!name || !email || !plan) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and plan are required.',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    const payload = {
      name,
      email,
      phone: phone || null,
      plan,
      preferred_date: preferred_date || null,
      preferred_time: preferred_time || null,
      notes: notes || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('Booking').insert(payload).select('id').single();
    if (error) throw error;

    res.status(201).json({
      success: true,
      message: `Booking confirmed for the ${plan} plan! We'll contact you shortly.`,
      id: data?.id || null,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/bookings', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('Booking').select('*').order('id', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

app.patch('/api/bookings/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const { error } = await supabase.from('Booking').update({ status }).eq('id', req.params.id);
    if (error) throw error;

    res.json({ success: true, message: `Booking status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
});

// ─── Admin + SPA fallback ─────────────────────────────────────────────────────
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message || err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🏋️  Performance Gym  →  http://localhost:${PORT}`);
  console.log(`📊  Admin panel      →  http://localhost:${PORT}/admin`);
  console.log('🟢  Supabase connected for dynamic data APIs');
});

module.exports = app;
