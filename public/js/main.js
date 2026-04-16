/* ============================================================
  Performance Gym - main.js
   ============================================================ */

'use strict';

// ─── Utilities ──────────────────────────────────────────────
/* To Connect Supabase */
const supabaseUrl = 'https://ujsobhoyzqwptarbsstm.supabase.co';
const supabaseKey = 'sb_publishable_C6cHjn300xP5fiaiT4E8ug_4X1VGyFJ';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

/** Show a toast notification */
function showToast(title, message, type = 'success', duration = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-body">
      <div class="toast-title">${escHtml(title)}</div>
      <div class="toast-message">${escHtml(message)}</div>
    </div>
    <button class="toast-close" aria-label="Close">✕</button>
  `;

  container.appendChild(toast);
  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  const dismiss = () => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  toast.querySelector('.toast-close').addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
}

/** Escape HTML to prevent XSS in toast messages */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Set button loading state */
function setButtonLoading(btn, loading) {
  if (loading) {
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

/** Display field-level errors from API response */
function displayFieldErrors(form, errors) {
  // Clear previous errors
  form.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

  if (!errors || !Array.isArray(errors)) return;

  errors.forEach(({ field, message }) => {
    const input = form.querySelector(`[name="${field}"]`);
    const errEl = form.querySelector(`[data-error="${field}"]`);
    if (input) input.classList.add('error');
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.add('visible');
    }
  });
}

/** Clear all field errors on a form */
function clearFieldErrors(form) {
  form.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

/** Simple client-side email validator */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Generic AJAX form submitter */
async function submitForm(form, endpoint, method = 'POST') {
  const data = {};
  new FormData(form).forEach((v, k) => { data[k] = v; });

  const submitBtn = form.querySelector('[type="submit"]');
  if (submitBtn) setButtonLoading(submitBtn, true);

  try {
    const resp = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await resp.json();

    if (resp.ok && json.success) {
      return { ok: true, data: json };
    } else if (json.errors) {
      return { ok: false, errors: json.errors };
    } else {
      return { ok: false, message: json.error || 'Something went wrong. Please try again.' };
    }
  } catch (err) {
    console.error('[submitForm]', err);
    return { ok: false, message: 'Network error. Check your connection and try again.' };
  } finally {
    if (submitBtn) setButtonLoading(submitBtn, false);
  }
}

// ─── Navbar ──────────────────────────────────────────────────

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (!navbar) return;

  // Scrolled state
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Active link highlighting
  const sections = document.querySelectorAll('section[id]');
  const linkEls = document.querySelectorAll('.nav-links a[href^="#"]');

  const observerCb = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        linkEls.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
      }
    });
  };
  const io = new IntersectionObserver(observerCb, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => io.observe(s));

  // Hamburger toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }
}

// ─── Scroll Animations ────────────────────────────────────────

function initScrollAnimations() {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => io.observe(el));
}

// ─── Counter Animation ───────────────────────────────────────

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 1500;
      const step = target / (duration / 16);
      let current = 0;
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current).toLocaleString() + (el.dataset.suffix || '');
        if (current >= target) clearInterval(timer);
      }, 16);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => io.observe(el));
}

// ─── Booking Form ─────────────────────────────────────────────

function initBookingForm() {
  const form = document.getElementById('booking-form');
  if (!form) return;

  // 1. دالة التحقق من البيانات
  function validate() {
    clearFieldErrors(form);
    let valid = true;
    const fields = [
      { name: 'name',  check: v => v.trim().length >= 2,   msg: 'Name must be at least 2 characters' },
      { name: 'email', check: v => isValidEmail(v.trim()), msg: 'Please enter a valid email address' },
      { name: 'phone', check: v => /^[\d\s\+\-\(\)]{7,20}$/.test(v.trim()), msg: 'Please enter a valid phone number' },
      { name: 'plan',  check: v => v !== "", msg: 'Please select a membership plan' },
    ];

    fields.forEach(({ name, check, msg }) => {
      const input = form.querySelector(`[name="${name}"]`);
      const errEl = form.querySelector(`[data-error="${name}"]`);
      if (!input) return;
      if (!check(input.value)) {
        input.classList.add('error');
        if (errEl) { 
          errEl.textContent = msg; 
          errEl.classList.add('visible'); 
        }
        valid = false;
      }
    });
    return valid;
  }

  // 2. إزالة رسائل الخطأ عند الكتابة
  form.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('error');
      const errEl = form.querySelector(`[data-error="${el.name}"]`);
      if (errEl) { 
        errEl.textContent = ''; 
        errEl.classList.remove('visible'); 
      }
    });
  });

  // 3. معالج حدث الإرسال (Submit Event) - واحد فقط ومنظم
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // أولاً: التحقق من الصلاحية
    if (!validate()) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const formData = new FormData(form);
      
      // تجهيز البيانات لـ Supabase
      const bookingData = {
        Name: formData.get('name'),
        Email: formData.get('email'),
        Phone: formData.get('phone'),
        Plan: formData.get('plan'),
        Status: 'Pending',
        Date: new Date().toISOString().split('T')[0]
      };

      // إرسال البيانات (تأكد أن _supabase معرفة في أعلى الملف)
      const { error } = await _supabase
        .from('bookings')
        .insert([bookingData]);

      if (error) throw error;

      // نجاح العملية
      form.reset();
      showToast('Booking Submitted!', 'Your membership request has been saved.', 'success');
      
    } catch (err) {
      console.error('Supabase Error:', err.message);
      showToast('Error', 'Failed to save booking: ' + err.message, 'error');
    } finally {
      // إعادة تفعيل الزر دائماً
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// ─── Contact Form ─────────────────────────────────────────────

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  function validate() {
    clearFieldErrors(form);
    let valid = true;
    const fields = [
      { name: 'name',    check: v => v.trim().length >= 2,    msg: 'Name must be at least 2 characters' },
      { name: 'email',   check: v => isValidEmail(v.trim()),  msg: 'Please enter a valid email address' },
      { name: 'subject', check: v => v.trim().length >= 5,    msg: 'Subject must be at least 5 characters' },
      { name: 'message', check: v => v.trim().length >= 10,   msg: 'Message must be at least 10 characters' },
    ];

    fields.forEach(({ name, check, msg }) => {
      const input = form.querySelector(`[name="${name}"]`);
      const errEl = form.querySelector(`[data-error="${name}"]`);
      if (!input) return;
      if (!check(input.value)) {
        input.classList.add('error');
        if (errEl) { errEl.textContent = msg; errEl.classList.add('visible'); }
        valid = false;
      }
    });

    return valid;
  }

  form.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('error');
      const errEl = form.querySelector(`[data-error="${el.name}"]`);
      if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
    }

    try {
      const formData = new FormData(form);
      
      const contactData = {
        full_name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        created_at: new Date().toISOString()
      };

      const { data, error } = await _supabase
        .from('contacts')
        .insert([contactData]);

      if (error) throw error;

      form.reset();
      showToast('Message Sent!', 'Thanks for reaching out! We will get back to you soon.', 'success');
      
    } catch (err) {
      console.error('Submission Error:', err.message);
      showToast('Error', 'Failed to send message: ' + err.message, 'error');
    } finally {
      if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
      }
    }
  });
}

// ─── Testimonials ─────────────────────────────────────────────

async function loadTestimonials() {
  const container = document.getElementById('testimonials-grid');
  if (!container) return;

  try {
    // جلب البيانات من Supabase
    const { data: testimonials, error } = await _supabase
      .from('testimonials')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    if (!testimonials || !testimonials.length) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted)">No testimonials yet. Be the first!</p>';
      return;
    }

    container.innerHTML = testimonials.map(t => `
      <div class="testimonial-card fade-in">
        <div class="testimonial-stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - (t.rating || 0))}</div>
        <blockquote class="testimonial-quote">${escHtml(t.quote)}</blockquote>
        <div class="testimonial-author">
          ${t.image_url
            ? `<img src="${escHtml(t.image_url)}" alt="${escHtml(t.name)}" class="testimonial-avatar" style="object-fit:cover;">`
            : `<div class="testimonial-avatar">${escHtml(t.name.charAt(0).toUpperCase())}</div>`
          }
          <span class="testimonial-name">${escHtml(t.name)}</span>
        </div>
      </div>
    `).join('');

    if (typeof initScrollAnimations === 'function') initScrollAnimations();
  } catch (err) {
    console.error('[loadTestimonials Error]:', err.message);
  }
}

// ─── Smooth Anchor Scroll ─────────────────────────────────────

function initAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = document.querySelector('.navbar')?.offsetHeight || 70;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ─── Plan Button → Booking Form ────────────────────────────────

function initPlanButtons() {
  document.querySelectorAll('[data-plan]').forEach(btn => {
    btn.addEventListener('click', () => {
      const planSelect = document.querySelector('#booking-form [name="plan"]');
      if (planSelect) {
        planSelect.value = btn.dataset.plan;
        planSelect.dispatchEvent(new Event('input'));
      }
      const bookingSection = document.getElementById('join');
      if (bookingSection) {
        const navH = document.querySelector('.navbar')?.offsetHeight || 70;
        const top = bookingSection.getBoundingClientRect().top + window.scrollY - navH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ─── Init ─────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initCounters();
  initAnchorScroll();
  initPlanButtons();
  initBookingForm();
  initContactForm();
  loadTestimonials();
});
