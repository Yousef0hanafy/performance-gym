# 🏋️ Performance Gym — Full-Stack Website

A production-ready gym website built with Node.js, Express, and better-sqlite3.

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd performance-gym
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and change ADMIN_USERNAME, ADMIN_PASSWORD, SESSION_SECRET

# 3. Start the server
npm start
# Dev mode (with auto-reload):
npm run dev
```

Then open:
- **Website:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin (default: admin / changeme123)

---

## 📁 Project Structure

```
performance-gym/
├── public/
│   ├── index.html          Landing page (hero, features, pricing, testimonials, forms)
│   ├── admin.html          Admin dashboard (SPA)
│   ├── css/styles.css      All custom styles
│   ├── js/main.js          Frontend JS (AJAX, animations, validation)
│   └── assets/images/      Static images
├── server.js               Express app entry point
├── database.js             SQLite setup + migrations + seeding
├── routes/
│   ├── api.js              Public API routes
│   └── admin.js            Protected admin routes
├── middleware/
│   └── auth.js             HTTP Basic Auth middleware
├── controllers/
│   ├── bookingController.js
│   ├── contactController.js
│   └── testimonialController.js
├── package.json
└── .env.example
```

---

## 🌐 API Reference

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/testimonials` | List all testimonials |
| POST | `/api/bookings` | Submit a membership booking |
| POST | `/api/contact` | Submit a contact message |

### Admin Endpoints (Basic Auth required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Dashboard stats + recent records |
| GET | `/api/admin/bookings` | All bookings (paginated) |
| PATCH | `/api/admin/bookings/:id/status` | Update booking status |
| DELETE | `/api/admin/bookings/:id` | Delete booking |
| GET | `/api/admin/contacts` | All contacts (paginated) |
| DELETE | `/api/admin/contacts/:id` | Delete contact |
| GET | `/api/admin/testimonials` | All testimonials |
| POST | `/api/admin/testimonials` | Create testimonial |
| DELETE | `/api/admin/testimonials/:id` | Delete testimonial |

---

## 🔒 Security Features

- **Helmet.js** — Sets security HTTP headers (CSP, HSTS, etc.)
- **CORS** — Configurable allowed origins via `CORS_ORIGIN`
- **Rate limiting** — Per-route limits via `express-rate-limit`
- **Input validation** — Server-side via `express-validator`
- **Input sanitization** — Control character stripping
- **SQL injection prevention** — Parameterized queries (better-sqlite3)
- **Timing-safe auth** — Custom Basic Auth with constant-time comparison
- **Body size limiting** — 10kb max payload

---

## 🗄️ Database Schema

```sql
-- Membership bookings
bookings (id, name, email, phone, plan, status, created_at)

-- Contact form submissions
contacts (id, name, email, subject, message, created_at)

-- Member testimonials
testimonials (id, name, quote, rating, image_url, created_at)
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `ADMIN_USERNAME` | `admin` | Admin login username |
| `ADMIN_PASSWORD` | `changeme123` | Admin login password |
| `SESSION_SECRET` | — | Secret key (change in production!) |
| `DB_PATH` | `./database.sqlite` | SQLite database file path |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origins |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `200` | Max requests per window |

---

## 🎨 Frontend Features

- **Responsive design** — Mobile-first, works on all screen sizes
- **Dark theme** — Professional gym aesthetic
- **Scroll animations** — IntersectionObserver-based fade-in
- **Counter animations** — Hero stats count up on scroll
- **Toast notifications** — Success/error feedback for all forms
- **Loading spinners** — Visual feedback during form submission
- **Client-side validation** — Instant field-level error messages
- **Plan → Booking flow** — Clicking a pricing plan pre-fills the form

---

## 🏗️ Production Checklist

- [ ] Change `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
- [ ] Set a strong `SESSION_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` to your domain
- [ ] Set up a reverse proxy (nginx/Caddy) with TLS
- [ ] Consider migrating to PostgreSQL for scale
- [ ] Replace Basic Auth with JWT or session-based auth
- [ ] Set up database backups
- [ ] Configure log rotation (PM2, systemd, etc.)
