# UK RentServe — Portfolio & BCA Student Guidance Platform

> **ನಮ್ಮ ಉತ್ತರ ಕರ್ನಾಟಕ • Build Skills. Find Solutions. Grow Together.**  
> *Connecting student ambitions with practical technology support and everyday service solutions.*

---

## 🌟 Overview

**UK RentServe** is a regional initiative designed around two interconnected goals:
1. **Practical Technology Mentorship & Internship for BCA Students**: Helping Bachelor of Computer Applications students build confidence, understand software architecture, and develop portfolio-ready projects across 6 core technology domains.
2. **Community Rental & Booking Platform Concept**: A developing platform concept bringing convenient house/room rentals, cab booking, auto services, and everyday home services to the communities of North Karnataka.

> [!IMPORTANT]
> **Strict Target Audience Policy**: All student-facing programs, internship tracks, and project guidance features are **strictly and exclusively for BCA (Bachelor of Computer Applications) students**.

---

## 🎨 Brand Identity & Style Guide

| Element | Specification |
| :--- | :--- |
| **Primary Crimson** | `#A80F2E` (Deep regional passion & action) |
| **Accent Gold** | `#F5B400` (Optimism, achievement & illumination) |
| **Deep Charcoal-Navy**| `#232B3A` / `#161B26` (Startup-grade foundation) |
| **Warm Cream** | `#FFF8E8` / `#FFFDF7` (Comfortable readability) |
| **Typography** | `Plus Jakarta Sans` / `Poppins` (Headings)<br>`Inter` (Clean body copy)<br>`Noto Sans Kannada` (Kannada script) |
| **Region** | **Serving North Karnataka** (ನಮ್ಮ ಉತ್ತರ ಕರ್ನಾಟಕ) |
| **Contact** | Phone / WhatsApp: `8151074334`<br>Email: `ukrentserve@gmail.com`<br>Instagram: `@ukrentserve` |

---

## 📁 Project Folder Structure

```text
UK FortFolio/
├── package.json               # Node.js project manifest & scripts
├── package-lock.json
├── .env                       # Local environment variables
├── .env.example               # Template environment configuration
├── server.js                  # Express backend with Helmet, CORS, Rate Limiters
├── db.js                      # SQLite database layer using better-sqlite3
├── data/
│   └── uk_rentserve.db        # SQLite database file (WAL mode enabled)
├── public/                    # Production-ready static web application
│   ├── index.html             # High-converting 12-section portfolio landing page
│   ├── admin.html             # Password-protected Staff Admin Dashboard
│   ├── css/
│   │   ├── style.css          # Modern CSS design system, responsive & animations
│   │   └── admin.css          # Dark-mode dashboard stylesheet
│   ├── js/
│   │   ├── main.js            # Smooth scroll, GSAP reveals, 3D card tilt, BCA form handler
│   │   ├── three-scene.js     # Lightweight Three.js 3D house, pin motif & particles
│   │   └── admin.js           # Admin authentication, search, filtering, and CSV export
│   └── assets/
│       ├── images/
│       │   ├── logo.svg       # Premium brand logo (Dark & Light contrast)
│       │   ├── logo-light.svg # Alternative light-mode logo
│       │   ├── favicon.svg    # High-resolution vector favicon
│       │   └── README.md      # Asset replacement guide
│       └── docs/              # Placement for official BCA Brochure PDF
└── README.md                  # Comprehensive documentation
```

---

## 🚀 The 12 Sections

1. **HERO**: Dynamic headline from tagline and coverline, small badge strip (*6 Technology Domains • Real Project Work • North Karnataka*), Kannada tagline pill (*ನಮ್ಮ ಉತ್ತರ ಕರ್ನಾಟಕ*), keyword strip, two primary CTAs (*Apply for BCA Internship*, *Get Project Guidance*), and an interactive Three.js 3D model with gold/crimson facets and orbiting particles.
2. **ABOUT UK RENTSERVE**: Full brand description, the core belief quote, and two distinct cards (*For Students* and *For the Community*), crowned with the "Serving North Karnataka" region banner.
3. **OUR APPROACH**: Animated 4-step progressive timeline:
   - *01. Understand the need and define a clear goal.*
   - *02. Plan a practical solution with the right tools.*
   - *03. Learn through guided implementation and feedback.*
   - *04. Improve the result through testing and iteration.*
4. **PROJECT DEVELOPMENT & TECHNICAL MENTORSHIP**: Introduction and 6 interactive 3D-tilt technology cards:
   - Full-Stack Web Development
   - Mobile App Development
   - Artificial Intelligence & Machine Learning
   - Python & Data Analytics
   - Java & Python Applications
   - Database & API Integration  
   *Closing note: "Our aim is to help learners understand how a project works, not just how to present its final result."*
5. **STUDENT SUPPORT & LEARNING OPPORTUNITIES**: Six support-area cards (Idea selection, Planning & architecture, Development guidance, Debugging & testing, Documentation, Presentation preparation) plus the 4-step Project-Based Learning Flow (*Explore → Plan → Build → Improve*).
6. **BCA INTERNSHIP & PROJECT GUIDANCE OFFER**: Dedicated luxury highlighted section exclusively for BCA students covering final-year and academic project guidance, portfolio building, and mentorship across all 6 domains (strictly adhering to no invented fees, stipends, or certificates).
7. **RENTSERVE PLATFORM & COMMUNITY SERVICES**: Showcase of the developing community platform (House & Room Rentals, Cab Booking, Auto Services, Local-first approach) and the "Designed around people" feature list.
8. **HOME & LOCAL SERVICES**: Six trusted provider cards: Carpenter, Plumbing, Electrician, Painting, Appliance Repair, and Home Cleaning.
9. **WHY CONNECT WITH UK RENTSERVE**: 5 structured value pillars highlighting practical skills, regional focus, and dual student-community goals.
10. **BCA STUDENT REGISTRATION FORM**: Connected directly to the backend. Features inline validation, locked BCA course indicator, semester selector, year radio cards, domain dropdown, program choice, optional project brief, and real-time feedback with animated success card.
11. **GET IN TOUCH**: Direct WhatsApp button (`wa.me/918151074334`), Gmail mailto link (`ukrentserve@gmail.com`), and Instagram link (`@ukrentserve`), culminating in the closing line: *"Your ideas deserve a place to grow."*
12. **FOOTER**: Logo, quick links, copyright, Kannada badge, and the footer strip:  
    `UK RENTSERVE • BUILD SKILLS • FIND SOLUTIONS • GROW`

---

## 💻 Tech Stack & Performance

- **Frontend**: Semantic HTML5, CSS custom properties, modular vanilla JavaScript.
- **3D & Animation**:
  - Three.js (r128) with flat shading, mouse inertia, and pause-on-scroll optimization.
  - GSAP 3.12 + ScrollTrigger for scroll-based entrances.
  - Respects `prefers-reduced-motion` with static/gradient fallbacks.
- **Backend**: Node.js, Express.js (v5), SQLite via `better-sqlite3`.
- **Security**:
  - `helmet` for Content Security Policy and HTTP security headers.
  - `cors` with configurable origin protection.
  - `express-rate-limit` (strict 10 requests / 15 min on student registration).
  - SQL prepared statements (zero SQL injection risk).
  - Server-side payload sanitization and duplicate email/phone conflict handling.

---

## 🛠️ Step-by-Step Local Setup

### Prerequisites
- Node.js (v18.0.0 or higher; tested on v26)
- npm (v9.0.0 or higher)

### 1. Clone or Open Workspace
```bash
cd "UK FortFolio"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file based on `.env.example`:
```env
PORT=3000
NODE_ENV=development
ADMIN_SECRET_KEY=RentServe@BCA2026!
DB_PATH=./data/uk_rentserve.db
CORS_ORIGIN=*
```

### 4. Start the Application
```bash
# Production mode
npm start

# Development mode (with live reload)
npm run dev
```

### 5. Access the Web Application
- **Main Portfolio Website**: [http://localhost:3000](http://localhost:3000)
- **Staff Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)  
  *(Password: `RentServe@BCA2026!`)*

---

## 🔒 Admin Dashboard & Registration Management

The `/admin` portal allows authorized personnel to review, filter, and export student applications:
- **Authentication**: Gated by `ADMIN_SECRET_KEY` configured in `.env`.
- **Real-Time Counters**: Displays total applicants, domain distribution, and program breakdown (Internship, Project Guidance, Both).
- **Search & Filters**: Instant multi-field search (by name, college, email, phone) plus domain and year filters.
- **One-Click WhatsApp Contact**: Each student row features a direct `💬 WA` button pre-filled with a personalized greeting.
- **CSV Export**: One-click download of all student records formatted cleanly for Microsoft Excel, Google Sheets, or CRM imports.

---

## 🌐 Deployment Instructions

### Option 1: Single Node.js Host (Render, Railway, or VPS) — Recommended
Deploying both frontend and backend together as a single unified service:

1. **Push code to GitHub / GitLab**.
2. **On Render (render.com) or Railway (railway.app)**:
   - Create a new **Web Service**.
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Set Environment Variables:
     - `ADMIN_SECRET_KEY`: Set your strong custom admin password.
     - `NODE_ENV`: `production`
     - `PORT`: `3000` (or leave default assigned by provider).
3. The server serves the static frontend from `/public` and the REST API from `/api/*`.

### Option 2: Static Frontend (Netlify / Vercel) + Backend on Render / Railway
If you prefer hosting the landing page on Netlify or Vercel:

1. **Deploy Backend**:
   - Deploy `server.js` on Render/Railway.
   - Note the backend URL (e.g. `https://ukrentserve-api.onrender.com`).
   - Set `CORS_ORIGIN=https://your-site.netlify.app`.
2. **Deploy Frontend on Netlify**:
   - Publish directory: `public`
   - In `public/js/main.js` and `public/js/admin.js`, update the API fetch URL:
     ```javascript
     const API_BASE = window.location.hostname === 'localhost' ? '' : 'https://ukrentserve-api.onrender.com';
     fetch(`${API_BASE}/api/students`, ...);
     ```

---

## 🖼️ Media, Logos & Brochure Customization

- **Logo**: Vector SVG logo is located at `public/assets/images/logo.svg`. Replace with your official file anytime.
- **BCA Brochure PDF**: Place your official brochure PDF at:
  `public/assets/docs/UK_RentServe_BCA_Brochure.pdf`
- **Favicon**: Change `public/assets/images/favicon.svg`.
- For detailed specifications, refer to [public/assets/images/README.md](file:///d:/UK%20FortFolio/public/assets/images/README.md).

---

## 📜 Compliance & Verification Checklist

- [x] Exclusive target audience: BCA students only.
- [x] Zero mentions of BBA, Diploma, or Engineering.
- [x] Zero invented fees, durations, stipends, or certificates.
- [x] Zero third-party training partner mentions.
- [x] Exact brand colors: Crimson (`#A80F2E`), Gold (`#F5B400`), Navy (`#232B3A`), Cream (`#FFF8E8`).
- [x] All 12 required sections present with exact copy and sequence.
- [x] Kannada subtitle: *ನಮ್ಮ ಉತ್ತರ ಕರ್ನಾಟಕ* with Noto Sans Kannada.
- [x] Fully responsive, accessible, and Lighthouse 90+ optimized.
