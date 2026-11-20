/**
 * UK RentServe - Backend Server
 * Express.js with SQLite (better-sqlite3), Helmet, CORS, Rate Limiting
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'RentServe@BCA2026!';

// Allowed technology domains (strictly matches prompt)
const VALID_DOMAINS = [
  'Full-Stack Web Development',
  'Mobile App Development',
  'Artificial Intelligence & Machine Learning',
  'Python & Data Analytics',
  'Java & Python Applications',
  'Database & API Integration'
];

const VALID_YEARS = ['1st Year', '2nd Year', '3rd Year'];
const VALID_SEMESTERS = [
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6'
];
const VALID_PROGRAMS = ['Internship', 'Project Guidance', 'Both'];

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdnjs.cloudflare.com',
          'https://cdn.jsdelivr.net',
          'https://unpkg.com'
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://cdnjs.cloudflare.com',
          'https://cdn.jsdelivr.net'
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : '*';

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
  })
);

// Body parsers with payload size limits
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 registrations per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration attempts from this network. Please wait a few minutes before trying again.'
  }
});

app.use('/api/', generalLimiter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Explicit homepage route (avoids relying on static middleware defaults)
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Admin Authentication Middleware
 * Accepts Bearer token, x-admin-key header, or query token
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-admin-key']) {
    token = String(req.headers['x-admin-key']).trim();
  } else if (req.query && req.query.token) {
    token = String(req.query.token).trim();
  }

  if (!token || token !== ADMIN_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing administrator credentials.'
    });
  }

  next();
}

/**
 * Sanitize strings to prevent XSS / control character injection
 */
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Normalize Indian phone number to 10 digits
 */
function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

// ==========================================
// PUBLIC API ROUTES
// ==========================================

/**
 * POST /api/students
 * Validate & save a BCA student registration
 */
app.post('/api/students', registrationLimiter, (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      college_name,
      course,
      year_of_study,
      semester,
      interest_domain,
      program_type,
      message,
      consent
    } = req.body;

    // 1. Strict Target Audience Validation: BCA ONLY
    if (!course || course.trim().toUpperCase() !== 'BCA') {
      return res.status(400).json({
        success: false,
        field: 'course',
        message: 'This program and registration is exclusively open for BCA (Bachelor of Computer Applications) students.'
      });
    }

    // 2. Validate Full Name
    const cleanName = sanitizeText(full_name);
    if (!cleanName || cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        field: 'full_name',
        message: 'Please provide a valid full name (2 to 100 characters).'
      });
    }

    // 3. Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !emailRegex.test(cleanEmail) || cleanEmail.length > 120) {
      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'Please provide a valid email address.'
      });
    }

    // 4. Validate Phone
    const cleanPhone = normalizePhone(phone);
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        field: 'phone',
        message: 'Please provide a valid 10-digit Indian mobile number.'
      });
    }

    // 5. Validate College Name
    const cleanCollege = sanitizeText(college_name);
    if (!cleanCollege || cleanCollege.length < 2 || cleanCollege.length > 150) {
      return res.status(400).json({
        success: false,
        field: 'college_name',
        message: 'Please enter your college or university name.'
      });
    }

    // 6. Validate Year of Study
    if (!VALID_YEARS.includes(year_of_study)) {
      return res.status(400).json({
        success: false,
        field: 'year_of_study',
        message: 'Please select a valid BCA year of study (1st Year, 2nd Year, or 3rd Year).'
      });
    }

    // 7. Validate Semester
    if (!VALID_SEMESTERS.includes(semester)) {
      return res.status(400).json({
        success: false,
        field: 'semester',
        message: 'Please select your current semester (Semester 1 to 6).'
      });
    }

    // 8. Validate Technology Domain
    if (!VALID_DOMAINS.includes(interest_domain)) {
      return res.status(400).json({
        success: false,
        field: 'interest_domain',
        message: 'Please select one of the 6 recognized technology domains.'
      });
    }

    // 9. Validate Program Type
    if (!VALID_PROGRAMS.includes(program_type)) {
      return res.status(400).json({
        success: false,
        field: 'program_type',
        message: 'Please select a program type: Internship, Project Guidance, or Both.'
      });
    }

    // 10. Consent Check
    if (!consent || consent === 'false') {
      return res.status(400).json({
        success: false,
        field: 'consent',
        message: 'Please confirm that you are a BCA student and agree to be contacted.'
      });
    }

    // 11. Duplicate check (Email or Phone)
    const existing = db.checkDuplicate(cleanEmail, cleanPhone);
    if (existing) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: 'You have already registered with this email or phone number. Our team will contact you shortly!'
      });
    }

    // 12. Create record
    const newStudent = db.createStudent({
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      college_name: cleanCollege,
      year_of_study,
      semester,
      interest_domain,
      program_type,
      message: sanitizeText(message).slice(0, 1000)
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! We'll contact you shortly.",
      studentId: newStudent.id,
      name: newStudent.full_name
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while saving your registration. Please try again or reach out on WhatsApp.'
    });
  }
});

// ==========================================
// ADMIN API ROUTES (Protected)
// ==========================================

/**
 * POST /api/admin/login
 * Verify admin password and return confirmation
 */
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect admin password.'
    });
  }

  return res.json({
    success: true,
    token: ADMIN_SECRET_KEY,
    message: 'Admin authentication successful.'
  });
});

/**
 * GET /api/admin/verify
 * Validate existing admin session
 */
app.get('/api/admin/verify', requireAdmin, (req, res) => {
  res.json({ success: true, authorized: true });
});

/**
 * GET /api/students
 * Admin: List registrations with search and filtering
 */
app.get('/api/students', requireAdmin, (req, res) => {
  try {
    const { search, domain, year, program, limit, offset } = req.query;
    const students = db.getStudents({ search, domain, year, program, limit, offset });
    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    console.error('Admin getStudents error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve registrations.' });
  }
});

/**
 * GET /api/students/export
 * Admin: Download registrations as CSV
 */
app.get('/api/students/export', requireAdmin, (req, res) => {
  try {
    const csvData = db.exportCsv();
    const filename = `UK_RentServe_BCA_Registrations_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).send('Error generating CSV export.');
  }
});

/**
 * GET /api/stats
 * Admin: Aggregated registration statistics
 */
app.get('/api/stats', requireAdmin, (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error('Admin getStats error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve statistics.' });
  }
});

/**
 * DELETE /api/students/:id
 * Admin: Delete a student record
 */
app.delete('/api/students/:id', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID.' });
    }

    const deleted = db.deleteStudent(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    res.json({ success: true, message: 'Record deleted successfully.' });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete record.' });
  }
});

// Admin page route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fallback to index.html for SPA-style client routing (Express 5 compatible)
app.use((req, res) => {
  if (req.path.startsWith('/api/') || /\.[^/]+$/.test(req.path)) {
    return res.status(404).send('Not found');
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  UK RentServe Server running on port ${PORT}`);
    console.log(`  Live URL: http://localhost:${PORT}`);
    console.log(`  Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`===============================================`);
  });
}

module.exports = app;
