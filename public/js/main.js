/**
 * UK RentServe - Main Interactive Controller
 * Smooth scroll, responsive mobile drawer, card micro-interactions, and BCA Form Handler
 * Built for 100% visibility (no blank spaces or stuck opacities)
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ===================================================
  // 1. STICKY NAVBAR & MOBILE NAVIGATION
  // ===================================================
  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link, .nav-cta-btn, .mobile-cta a');

  function updateNavbar() {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();

  // Mobile Drawer Toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('open');
      document.body.classList.toggle('menu-open', !isExpanded);
    });

    // Close mobile menu on link click
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.classList.remove('active');
        navMenu.classList.remove('open');
        document.body.classList.remove('menu-open');
      });
    });
  }

  // ===================================================
  // 2. SMOOTH SCROLL WITH OFFSET & SMART FORM FOCUS
  // ===================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId.startsWith('#')) return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 70;
        const targetPos = targetEl.getBoundingClientRect().top + window.scrollY - navHeight - 14;

        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });

        // Pre-fill domain or program type if specified on CTA link
        const domainTarget = this.getAttribute('data-domain');
        const programTarget = this.getAttribute('data-program');
        if (domainTarget) {
          const domainSelect = document.getElementById('interest_domain');
          if (domainSelect) domainSelect.value = domainTarget;
        }
        if (programTarget) {
          const programRadio = document.querySelector(`input[name="program_type"][value="${programTarget}"]`);
          if (programRadio) programRadio.checked = true;
        }
      }
    });
  });

  // Active Nav Link Spy
  const sections = document.querySelectorAll('section[id]');
  function highlightNavOnScroll() {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const matchingLink = document.querySelector(`.nav-link[href*="${sectionId}"]`);

      if (matchingLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          matchingLink.classList.add('active');
        } else {
          matchingLink.classList.remove('active');
        }
      }
    });
  }
  window.addEventListener('scroll', highlightNavOnScroll, { passive: true });

  // ===================================================
  // 3. MAGNETIC BUTTONS (Micro-Interaction)
  // ===================================================
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const magneticButtons = document.querySelectorAll('.btn-magnetic');

  if (!prefersReduced && window.innerWidth >= 992) {
    magneticButtons.forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  // ===================================================
  // 4. BCA STUDENT REGISTRATION FORM CONTROLLER
  // ===================================================
  const form = document.getElementById('bca-registration-form');
  const submitBtn = document.getElementById('submit-btn');
  const btnSpinner = submitBtn ? submitBtn.querySelector('.btn-spinner') : null;
  const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  const formAlert = document.getElementById('form-alert');
  const formSuccessCard = document.getElementById('form-success-card');
  const resetBtn = document.getElementById('register-another-btn');

  // Input elements
  const fullNameInput = document.getElementById('full_name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const collegeInput = document.getElementById('college_name');
  const semesterSelect = document.getElementById('semester');
  const domainSelect = document.getElementById('interest_domain');
  const messageInput = document.getElementById('message');
  const consentCheckbox = document.getElementById('consent');

  // Validation Helpers
  function clearFieldError(input) {
    if (!input) return;
    const parent = input.closest('.form-group') || input.parentElement;
    parent.classList.remove('has-error');
    const errorEl = parent.querySelector('.field-error-msg');
    if (errorEl) errorEl.textContent = '';
  }

  function setFieldError(input, msg) {
    if (!input) return;
    const parent = input.closest('.form-group') || input.parentElement;
    parent.classList.add('has-error');
    let errorEl = parent.querySelector('.field-error-msg');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'field-error-msg';
      parent.appendChild(errorEl);
    }
    errorEl.textContent = msg;
  }

  function validateEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function validatePhone(val) {
    const digits = val.replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(digits);
  }

  // Real-time phone input formatting (strictly 10 digits)
  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      let val = phoneInput.value.replace(/\D/g, '');
      if (val.length > 10) val = val.slice(0, 10);
      phoneInput.value = val;
      if (val.length === 10) {
        if (/^[6-9]/.test(val)) {
          clearFieldError(phoneInput);
        } else {
          setFieldError(phoneInput, 'Indian mobile numbers must start with 6, 7, 8, or 9.');
        }
      }
    });
  }

  [fullNameInput, emailInput, collegeInput, semesterSelect, domainSelect, consentCheckbox].forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => clearFieldError(el));
    el.addEventListener('change', () => clearFieldError(el));
  });

  // Client-Side Validation Function
  function validateForm() {
    let isValid = true;

    // Full Name
    const nameVal = fullNameInput.value.trim();
    if (!nameVal || nameVal.length < 2) {
      setFieldError(fullNameInput, 'Please enter your full name (minimum 2 characters).');
      isValid = false;
    } else {
      clearFieldError(fullNameInput);
    }

    // Email
    const emailVal = emailInput.value.trim();
    if (!emailVal || !validateEmail(emailVal)) {
      setFieldError(emailInput, 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearFieldError(emailInput);
    }

    // Phone
    const phoneVal = phoneInput.value.trim();
    if (!phoneVal || !validatePhone(phoneVal)) {
      setFieldError(phoneInput, 'Please enter a valid 10-digit Indian mobile number.');
      isValid = false;
    } else {
      clearFieldError(phoneInput);
    }

    // College Name
    const collegeVal = collegeInput.value.trim();
    if (!collegeVal || collegeVal.length < 2) {
      setFieldError(collegeInput, 'Please enter your college or university name.');
      isValid = false;
    } else {
      clearFieldError(collegeInput);
    }

    // BCA Year of study
    const selectedYear = document.querySelector('input[name="year_of_study"]:checked');
    const yearContainer = document.querySelector('.radio-group-container[data-field="year"]');
    if (!selectedYear) {
      if (yearContainer) setFieldError(yearContainer, 'Please select your current BCA year of study.');
      isValid = false;
    } else if (yearContainer) {
      clearFieldError(yearContainer);
    }

    // Semester
    if (!semesterSelect.value) {
      setFieldError(semesterSelect, 'Please select your current semester.');
      isValid = false;
    } else {
      clearFieldError(semesterSelect);
    }

    // Interest Domain
    if (!domainSelect.value) {
      setFieldError(domainSelect, 'Please select your preferred technology domain.');
      isValid = false;
    } else {
      clearFieldError(domainSelect);
    }

    // Program Type
    const selectedProgram = document.querySelector('input[name="program_type"]:checked');
    const programContainer = document.querySelector('.radio-group-container[data-field="program"]');
    if (!selectedProgram) {
      if (programContainer) setFieldError(programContainer, 'Please select a program type.');
      isValid = false;
    } else if (programContainer) {
      clearFieldError(programContainer);
    }

    // Consent Checkbox
    if (!consentCheckbox.checked) {
      setFieldError(consentCheckbox, 'You must confirm that you are a BCA student and agree to be contacted.');
      isValid = false;
    } else {
      clearFieldError(consentCheckbox);
    }

    return isValid;
  }

  // Handle Form Submission
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      if (formAlert) {
        formAlert.style.display = 'none';
        formAlert.className = 'form-alert';
        formAlert.textContent = '';
      }

      if (!validateForm()) {
        const firstError = form.querySelector('.has-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Collect data
      const selectedYear = document.querySelector('input[name="year_of_study"]:checked')?.value;
      const selectedProgram = document.querySelector('input[name="program_type"]:checked')?.value;

      const payload = {
        full_name: fullNameInput.value.trim(),
        email: emailInput.value.trim().toLowerCase(),
        phone: phoneInput.value.trim(),
        college_name: collegeInput.value.trim(),
        course: 'BCA', // Fixed: strictly BCA
        year_of_study: selectedYear,
        semester: semesterSelect.value,
        interest_domain: domainSelect.value,
        program_type: selectedProgram,
        message: messageInput ? messageInput.value.trim() : '',
        consent: consentCheckbox.checked
      };

      // Loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        if (btnSpinner) btnSpinner.style.display = 'inline-block';
        if (btnText) btnText.textContent = 'Submitting Registration...';
      }

      try {
        const response = await fetch('/api/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Success State
          form.style.display = 'none';
          if (formSuccessCard) {
            formSuccessCard.style.display = 'block';
            const studentNameEl = formSuccessCard.querySelector('.registered-student-name');
            if (studentNameEl) studentNameEl.textContent = payload.full_name;
            formSuccessCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          // Server error or duplicate
          if (formAlert) {
            formAlert.style.display = 'block';
            formAlert.classList.add('alert-error');
            formAlert.textContent = result.message || 'Unable to submit registration. Please try again.';
            formAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          if (result.field) {
            const fieldEl = document.getElementById(result.field);
            if (fieldEl) setFieldError(fieldEl, result.message);
          }
        }
      } catch (err) {
        console.error('Submission error:', err);
        if (formAlert) {
          formAlert.style.display = 'block';
          formAlert.classList.add('alert-error');
          formAlert.textContent = 'Network or connection error. Please reach out on WhatsApp (8151074334).';
          formAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (btnSpinner) btnSpinner.style.display = 'none';
          if (btnText) btnText.textContent = 'Submit BCA Registration';
        }
      }
    });
  }

  // Register Another Student Button
  if (resetBtn && form && formSuccessCard) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      form.style.display = 'block';
      formSuccessCard.style.display = 'none';
      if (formAlert) formAlert.style.display = 'none';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
});
