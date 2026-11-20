/**
 * UK RentServe - Database Layer
 * SQLite database powered by better-sqlite3 with prepared statements
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Determine database path with safe fallback for read-only/serverless environments
let dbPath = process.env.DB_PATH;
if (!dbPath) {
  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const testFile = path.join(dataDir, '.write_test');
    fs.writeFileSync(testFile, '1');
    fs.unlinkSync(testFile);
    dbPath = path.join(dataDir, 'uk_rentserve.db');
  } catch (err) {
    // Read-only filesystem fallback (e.g. Vercel serverless container)
    const tmpDir = process.env.TMPDIR || '/tmp';
    dbPath = path.join(tmpDir, 'uk_rentserve.db');
  }
}

const db = new Database(dbPath, {
  // verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Enable WAL mode if supported, fallback to DELETE
try {
  db.pragma('journal_mode = WAL');
} catch (e) {
  try { db.pragma('journal_mode = DELETE'); } catch (_) {}
}
db.pragma('foreign_keys = ON');

/**
 * Initialize the database tables and indexes
 */
function initDb() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      college_name TEXT NOT NULL,
      course TEXT NOT NULL CHECK(course = 'BCA'),
      year_of_study TEXT NOT NULL,
      semester TEXT NOT NULL,
      interest_domain TEXT NOT NULL,
      program_type TEXT NOT NULL,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
    CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
    CREATE INDEX IF NOT EXISTS idx_students_created ON students(created_at);
  `;

  db.exec(createTableQuery);
}

// Call initDb immediately to ensure tables exist before preparing statements
initDb();

// Prepared statements for high performance & security
const statements = {
  insertStudent: db.prepare(`
    INSERT INTO students (
      full_name, email, phone, college_name, course,
      year_of_study, semester, interest_domain, program_type, message
    ) VALUES (
      @full_name, @email, @phone, @college_name, 'BCA',
      @year_of_study, @semester, @interest_domain, @program_type, @message
    )
  `),

  findByEmailOrPhone: db.prepare(`
    SELECT id, email, phone, created_at FROM students
    WHERE LOWER(email) = LOWER(?) OR phone = ?
    LIMIT 1
  `),

  findById: db.prepare(`
    SELECT * FROM students WHERE id = ?
  `),

  deleteById: db.prepare(`
    DELETE FROM students WHERE id = ?
  `)
};

/**
 * Register a new BCA student
 */
function createStudent(data) {
  const info = statements.insertStudent.run({
    full_name: data.full_name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    college_name: data.college_name.trim(),
    year_of_study: data.year_of_study,
    semester: data.semester,
    interest_domain: data.interest_domain,
    program_type: data.program_type,
    message: data.message ? data.message.trim() : ''
  });

  return statements.findById.get(info.lastInsertRowid);
}

/**
 * Check if a student with email or phone already exists
 */
function checkDuplicate(email, phone) {
  return statements.findByEmailOrPhone.get(email.trim().toLowerCase(), phone.trim());
}

/**
 * Get all student registrations with optional search and filters
 */
function getStudents({ search, domain, year, program, limit = 500, offset = 0 } = {}) {
  let query = `SELECT * FROM students WHERE 1=1`;
  const params = [];

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query += ` AND (LOWER(full_name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ? OR LOWER(college_name) LIKE ?)`;
    params.push(term, term, term, term);
  }

  if (domain && domain !== 'all') {
    query += ` AND interest_domain = ?`;
    params.push(domain);
  }

  if (year && year !== 'all') {
    query += ` AND year_of_study = ?`;
    params.push(year);
  }

  if (program && program !== 'all') {
    query += ` AND program_type = ?`;
    params.push(program);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

/**
 * Get aggregated statistics for the admin dashboard
 */
function getStats() {
  const total = db.prepare(`SELECT COUNT(*) AS count FROM students`).get().count;

  const byDomain = db.prepare(`
    SELECT interest_domain, COUNT(*) AS count 
    FROM students 
    GROUP BY interest_domain 
    ORDER BY count DESC
  `).all();

  const byYear = db.prepare(`
    SELECT year_of_study, COUNT(*) AS count 
    FROM students 
    GROUP BY year_of_study 
    ORDER BY year_of_study ASC
  `).all();

  const byProgram = db.prepare(`
    SELECT program_type, COUNT(*) AS count 
    FROM students 
    GROUP BY program_type
  `).all();

  const recent = db.prepare(`
    SELECT id, full_name, college_name, interest_domain, program_type, created_at 
    FROM students 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();

  return { total, byDomain, byYear, byProgram, recent };
}

/**
 * Delete a student record by ID
 */
function deleteStudent(id) {
  const result = statements.deleteById.run(id);
  return result.changes > 0;
}

/**
 * Escape CSV field to prevent CSV injection and handle commas/quotes/newlines
 */
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Neutralize CSV formula injection (=, +, -, @)
  if (/^[=+\-@]/.test(str)) {
    str = "'" + str;
  }
  // Double quotes escape
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generate CSV string of all students
 */
function exportCsv() {
  const students = db.prepare(`SELECT * FROM students ORDER BY created_at DESC`).all();

  const headers = [
    'ID',
    'Full Name',
    'Email Address',
    'Phone / WhatsApp',
    'College / University',
    'Course',
    'Year of Study',
    'Semester',
    'Area of Interest',
    'Program Type',
    'Project Idea / Message',
    'Registration Date (UTC)'
  ];

  const rows = students.map(s => [
    escapeCsv(s.id),
    escapeCsv(s.full_name),
    escapeCsv(s.email),
    escapeCsv(s.phone),
    escapeCsv(s.college_name),
    escapeCsv(s.course),
    escapeCsv(s.year_of_study),
    escapeCsv(s.semester),
    escapeCsv(s.interest_domain),
    escapeCsv(s.program_type),
    escapeCsv(s.message),
    escapeCsv(s.created_at)
  ].join(','));

  return [headers.join(','), ...rows].join('\r\n');
}

// Initialize tables on startup
initDb();

module.exports = {
  db,
  initDb,
  createStudent,
  checkDuplicate,
  getStudents,
  getStats,
  deleteStudent,
  exportCsv
};
