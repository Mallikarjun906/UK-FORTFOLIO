/**
 * UK RentServe - Database Layer
 * MongoDB database powered by Mongoose
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Determine MongoDB URI from environment or default local MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uk_rentserve';

/**
 * Mask credentials in MongoDB connection string for safe logging
 */
function maskMongoUri(uri) {
  if (!uri) return '';
  return uri.replace(/\/\/(.*?):(.*?)@/, '//***:***@');
}

/**
 * BCA Student Registration Schema
 */
const studentSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: 120
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: 15
    },
    college_name: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      maxlength: 150
    },
    course: {
      type: String,
      required: true,
      default: 'BCA',
      enum: ['BCA']
    },
    year_of_study: {
      type: String,
      required: true,
      enum: ['1st Year', '2nd Year', '3rd Year']
    },
    semester: {
      type: String,
      required: true,
      enum: [
        'Semester 1',
        'Semester 2',
        'Semester 3',
        'Semester 4',
        'Semester 5',
        'Semester 6'
      ]
    },
    interest_domain: {
      type: String,
      required: true
    },
    program_type: {
      type: String,
      required: true,
      enum: ['Internship', 'Project Guidance', 'Both']
    },
    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      }
    }
  }
);

// Indexes for high search & duplicate check performance
studentSchema.index({ email: 1 });
studentSchema.index({ phone: 1 });
studentSchema.index({ created_at: -1 });

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

/**
 * Connect to MongoDB
 */
async function connectDb() {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      dbName: 'uk_rentserve',
      serverSelectionTimeoutMS: 8000
    });

    console.log(` MongoDB Connected successfully: ${maskMongoUri(MONGODB_URI)}`);

    // Auto-seed backup if collection is newly created / empty
    await autoSeedFromBackup();
  } catch (err) {
    console.warn(`⚠️  MongoDB connection notice: ${err.message}`);
    console.warn(`   Target URI: ${maskMongoUri(MONGODB_URI)}`);
    console.warn(`   Configure MONGODB_URI in .env with your MongoDB Atlas or local connection string.`);
  }
}

/**
 * Seed existing data from backup JSON if database is empty
 */
async function autoSeedFromBackup() {
  try {
    const count = await Student.countDocuments();
    if (count > 0) return;

    const backupFile = path.join(__dirname, 'data', 'backup_students.json');
    if (fs.existsSync(backupFile)) {
      const raw = fs.readFileSync(backupFile, 'utf8');
      const records = JSON.parse(raw);
      if (Array.isArray(records) && records.length > 0) {
        const cleanRecords = records.map(r => ({
          full_name: r.full_name,
          email: r.email,
          phone: r.phone,
          college_name: r.college_name,
          course: 'BCA',
          year_of_study: r.year_of_study,
          semester: r.semester,
          interest_domain: r.interest_domain,
          program_type: r.program_type,
          message: r.message || '',
          created_at: r.created_at ? new Date(r.created_at) : new Date()
        }));
        await Student.insertMany(cleanRecords);
        console.log(` Seeded ${cleanRecords.length} records from backup into MongoDB.`);
      }
    }
  } catch (err) {
    console.warn('Could not auto-seed backup records:', err.message);
  }
}

/**
 * Helper to escape regex special characters
 */
function escapeRegex(text) {
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Register a new BCA student
 */
async function createStudent(data) {
  const student = new Student({
    full_name: data.full_name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    college_name: data.college_name.trim(),
    course: 'BCA',
    year_of_study: data.year_of_study,
    semester: data.semester,
    interest_domain: data.interest_domain,
    program_type: data.program_type,
    message: data.message ? data.message.trim() : ''
  });

  await student.save();
  return student.toJSON();
}

/**
 * Check if a student with email or phone already exists
 */
async function checkDuplicate(email, phone) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPhone = String(phone || '').trim();

  const found = await Student.findOne({
    $or: [
      { email: cleanEmail },
      { phone: cleanPhone }
    ]
  }).lean();

  if (!found) return null;

  return {
    id: found._id.toString(),
    email: found.email,
    phone: found.phone,
    created_at: found.created_at
  };
}

/**
 * Get student registrations with optional search and filters
 */
async function getStudents({ search, domain, year, program, limit = 500, offset = 0 } = {}) {
  const filter = {};

  if (search && search.trim()) {
    const term = search.trim();
    const regex = new RegExp(escapeRegex(term), 'i');
    filter.$or = [
      { full_name: regex },
      { email: regex },
      { phone: regex },
      { college_name: regex }
    ];
  }

  if (domain && domain !== 'all') {
    filter.interest_domain = domain;
  }

  if (year && year !== 'all') {
    filter.year_of_study = year;
  }

  if (program && program !== 'all') {
    filter.program_type = program;
  }

  const docs = await Student.find(filter)
    .sort({ created_at: -1 })
    .skip(Number(offset) || 0)
    .limit(Number(limit) || 500)
    .lean();

  return docs.map(doc => ({
    ...doc,
    id: doc._id.toString()
  }));
}

/**
 * Get aggregated statistics for the admin dashboard
 */
async function getStats() {
  const total = await Student.countDocuments();

  const [byDomain, byYear, byProgram, recentDocs] = await Promise.all([
    Student.aggregate([
      { $group: { _id: '$interest_domain', count: { $sum: 1 } } },
      { $project: { _id: 0, interest_domain: '$_id', count: 1 } },
      { $sort: { count: -1 } }
    ]),
    Student.aggregate([
      { $group: { _id: '$year_of_study', count: { $sum: 1 } } },
      { $project: { _id: 0, year_of_study: '$_id', count: 1 } },
      { $sort: { year_of_study: 1 } }
    ]),
    Student.aggregate([
      { $group: { _id: '$program_type', count: { $sum: 1 } } },
      { $project: { _id: 0, program_type: '$_id', count: 1 } },
      { $sort: { count: -1 } }
    ]),
    Student.find({})
      .sort({ created_at: -1 })
      .limit(5)
      .select('full_name college_name interest_domain program_type created_at')
      .lean()
  ]);

  const recent = recentDocs.map(r => ({
    id: r._id.toString(),
    full_name: r.full_name,
    college_name: r.college_name,
    interest_domain: r.interest_domain,
    program_type: r.program_type,
    created_at: r.created_at
  }));

  return { total, byDomain, byYear, byProgram, recent };
}

/**
 * Delete a student record by ID
 */
async function deleteStudent(id) {
  if (!id) return false;
  if (!mongoose.Types.ObjectId.isValid(id)) return false;

  const result = await Student.findByIdAndDelete(id);
  return !!result;
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
async function exportCsv() {
  const students = await Student.find({}).sort({ created_at: -1 }).lean();

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
    escapeCsv(s._id ? s._id.toString() : s.id),
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
    escapeCsv(s.created_at ? new Date(s.created_at).toISOString() : '')
  ].join(','));

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Check if MongoDB connection is active
 */
function isConnected() {
  return mongoose.connection.readyState === 1;
}

function getDbUri() {
  return maskMongoUri(MONGODB_URI);
}

module.exports = {
  mongoose,
  Student,
  connectDb,
  isConnected,
  getDbUri,
  createStudent,
  checkDuplicate,
  getStudents,
  getStats,
  deleteStudent,
  exportCsv
};
