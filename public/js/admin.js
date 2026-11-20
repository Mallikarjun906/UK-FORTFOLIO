/**
 * UK RentServe - Admin Dashboard Controller
 * Authentication, search, filtering, table rendering, delete, and CSV export
 */

// Smart API Base URL:
// - Uses relative URL '' when running on localhost or on Render itself
// - Uses Render URL 'https://uk-fortfolio.onrender.com' when hosted on Vercel or external domain
const API_BASE = (() => {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('onrender.com')) {
    return '';
  }
  return 'https://uk-fortfolio.onrender.com';
})();

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  let currentToken = sessionStorage.getItem('uk_admin_token') || '';
  let studentsData = [];

  // DOM Elements
  const authSection = document.getElementById('auth-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('admin-login-form');
  const passwordInput = document.getElementById('admin-password');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  // Stats DOM
  const totalCountEl = document.getElementById('stat-total');
  const internshipCountEl = document.getElementById('stat-internship');
  const projectCountEl = document.getElementById('stat-project');
  const bothCountEl = document.getElementById('stat-both');
  const domainStatsContainer = document.getElementById('domain-breakdown-list');

  // Search & Filter DOM
  const searchInput = document.getElementById('filter-search');
  const domainFilter = document.getElementById('filter-domain');
  const yearFilter = document.getElementById('filter-year');
  const programFilter = document.getElementById('filter-program');
  const refreshBtn = document.getElementById('refresh-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');

  // Table DOM
  const tableBody = document.getElementById('students-table-body');
  const emptyState = document.getElementById('table-empty-state');
  const loadingIndicator = document.getElementById('table-loading');
  const resultCountEl = document.getElementById('results-count');

  // Note Modal
  const noteModal = document.getElementById('note-modal');
  const modalStudentName = document.getElementById('modal-student-name');
  const modalNoteContent = document.getElementById('modal-note-content');
  const closeModalBtn = document.getElementById('close-modal-btn');

  // 1. Check Authentication on Load
  if (currentToken) {
    verifySession();
  } else {
    showAuth();
  }

  function showAuth() {
    authSection.style.display = 'flex';
    dashboardSection.style.display = 'none';
  }

  function showDashboard() {
    authSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    loadData();
    loadStats();
  }

  async function verifySession() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/verify`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (res.ok) {
        showDashboard();
      } else {
        sessionStorage.removeItem('uk_admin_token');
        currentToken = '';
        showAuth();
      }
    } catch (e) {
      showAuth();
    }
  }

  // 2. Login Form Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      loginError.style.display = 'none';
      const password = passwordInput.value.trim();
      if (!password) return;

      try {
        const res = await fetch(`${API_BASE}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          currentToken = data.token;
          sessionStorage.setItem('uk_admin_token', currentToken);
          showDashboard();
        } else {
          loginError.textContent = data.message || 'Incorrect password.';
          loginError.style.display = 'block';
        }
      } catch (err) {
        loginError.textContent = 'Network error while validating password.';
        loginError.style.display = 'block';
      }
    });
  }

  // Logout Handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('uk_admin_token');
      currentToken = '';
      showAuth();
    });
  }

  // 3. Load Registrations
  async function loadData() {
    loadingIndicator.style.display = 'block';
    emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    const params = new URLSearchParams();
    if (searchInput.value.trim()) params.append('search', searchInput.value.trim());
    if (domainFilter.value) params.append('domain', domainFilter.value);
    if (yearFilter.value) params.append('year', yearFilter.value);
    if (programFilter.value) params.append('program', programFilter.value);

    try {
      const res = await fetch(`${API_BASE}/api/students?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem('uk_admin_token');
          showAuth();
          return;
        }
        throw new Error('Failed to fetch data');
      }

      const result = await res.json();
      studentsData = result.data || [];
      renderTable(studentsData);
    } catch (err) {
      console.error('Error fetching students:', err);
      emptyState.innerHTML = '<p class="error-msg">Error loading student registrations. Please refresh.</p>';
      emptyState.style.display = 'block';
    } finally {
      loadingIndicator.style.display = 'none';
    }
  }

  // 4. Load Stats
  async function loadStats() {
    try {
      const res = await fetch(`${API_BASE}/api/stats`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const { stats } = await res.json();
        totalCountEl.textContent = stats.total || 0;

        let internship = 0, project = 0, both = 0;
        stats.byProgram.forEach(p => {
          if (p.program_type === 'Internship') internship = p.count;
          if (p.program_type === 'Project Guidance') project = p.count;
          if (p.program_type === 'Both') both = p.count;
        });

        internshipCountEl.textContent = internship;
        projectCountEl.textContent = project;
        bothCountEl.textContent = both;

        // Render Domain breakdown
        if (domainStatsContainer) {
          domainStatsContainer.innerHTML = stats.byDomain
            .map(d => `
              <div class="domain-stat-item">
                <span class="domain-stat-name">${escapeHtml(d.interest_domain)}</span>
                <span class="domain-stat-badge">${d.count}</span>
              </div>
            `)
            .join('');
        }
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  // 5. Render Students Table
  function renderTable(list) {
    resultCountEl.textContent = `${list.length} student${list.length === 1 ? '' : 's'} registered`;

    if (list.length === 0) {
      tableBody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    tableBody.innerHTML = list.map(student => {
      const dateFormatted = new Date(student.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const whatsappLink = `https://wa.me/91${student.phone}?text=Hello%20${encodeURIComponent(student.full_name)},%20greetings%20from%20UK%20RentServe!%20We%20received%20your%20BCA%20registration%20for%20${encodeURIComponent(student.program_type)}.`;

      return `
        <tr data-id="${student.id}">
          <td class="col-id">#${student.id}</td>
          <td class="col-name">
            <strong>${escapeHtml(student.full_name)}</strong>
            <div class="sub-college">${escapeHtml(student.college_name)}</div>
          </td>
          <td class="col-contact">
            <a href="mailto:${escapeHtml(student.email)}" class="email-link">${escapeHtml(student.email)}</a>
            <div class="phone-row">
              <a href="tel:${student.phone}" class="phone-link"><i class="fa-solid fa-mobile-screen-button"></i> ${student.phone}</a>
              <a href="${whatsappLink}" target="_blank" rel="noopener" class="whatsapp-btn-sm" title="Chat on WhatsApp"><i class="fa-brands fa-whatsapp"></i> WA</a>
            </div>
          </td>
          <td class="col-academic">
            <span class="badge badge-academic">${escapeHtml(student.year_of_study)}</span>
            <div class="sub-semester">${escapeHtml(student.semester)}</div>
          </td>
          <td class="col-domain">
            <span class="domain-pill">${escapeHtml(student.interest_domain)}</span>
          </td>
          <td class="col-program">
            <span class="badge badge-${student.program_type.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(student.program_type)}</span>
          </td>
          <td class="col-message">
            ${student.message ? `
              <button class="view-note-btn" data-id="${student.id}" title="Read student's project idea">
                <i class="fa-regular fa-file-lines"></i> View Idea
              </button>
            ` : '<span class="text-muted">—</span>'}
          </td>
          <td class="col-date">${dateFormatted}</td>
          <td class="col-actions">
            <button class="delete-btn" data-id="${student.id}" title="Delete Record"><i class="fa-solid fa-trash-can"></i></button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row events
    attachRowEventListeners();
  }

  function attachRowEventListeners() {
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm(`Are you sure you want to permanently delete registration #${id}?`)) {
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/api/students/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
          });
          if (res.ok) {
            loadData();
            loadStats();
          } else {
            alert('Failed to delete student record.');
          }
        } catch (e) {
          alert('Network error while deleting record.');
        }
      });
    });

    // View Note buttons
    document.querySelectorAll('.view-note-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const student = studentsData.find(s => s.id === id);
        if (student && noteModal) {
          modalStudentName.textContent = `${student.full_name} (${student.college_name})`;
          modalNoteContent.textContent = student.message || 'No additional note provided.';
          noteModal.style.display = 'flex';
        }
      });
    });
  }

  // 6. CSV Export Button
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      window.location.href = `${API_BASE}/api/students/export?token=${encodeURIComponent(currentToken)}`;
    });
  }

  // 7. Search & Filter debounce
  let searchDebounce;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(loadData, 300);
    });
  }

  [domainFilter, yearFilter, programFilter].forEach(filter => {
    if (filter) filter.addEventListener('change', loadData);
  });

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadData();
      loadStats();
    });
  }

  // Modal Close
  if (closeModalBtn && noteModal) {
    closeModalBtn.addEventListener('click', () => {
      noteModal.style.display = 'none';
    });
    noteModal.addEventListener('click', e => {
      if (e.target === noteModal) noteModal.style.display = 'none';
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
