# Performance Gym - Full-Stack Website

A modern, responsive gym landing page with dynamic features powered by Supabase.

## Features

- Hero section with animated stats
- Services/Plans display (from Supabase)
- Membership booking system
- Testimonials (from Supabase)
- Contact form
- Admin dashboard
- Dark theme with neon accents

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Render.com

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Visit `http://localhost:3000`

## Environment Variables (optional)

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` or `SUPABASE_ANON_KEY` - Supabase anon key

## Deployment on Render

1. Connect your GitHub repo to Render
2. Create a new Web Service
3. Set start command: `node server.js`
4. Deploy!

## API Endpoints

- `GET /api/services` - Get all plans
- `GET /api/pricing` - Get pricing tiers
- `GET /api/testimonials` - Get approved testimonials
- `POST /api/testimonials` - Add new testimonial
- `POST /api/bookings` - Create a booking
- `POST /api/contact` - Submit contact form
- `GET /api/admin/bookings` - Admin: get all bookings
- `GET /api/admin/contacts` - Admin: get all contacts

## Supabase Tables

- `Plans` - Service/plan offerings
- `Testimonials` - Customer reviews
- `Booking` - Membership bookings
- `Contacts` - Contact form submissions