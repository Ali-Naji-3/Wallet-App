import { getPool } from '../config/db.js';

// KYC Status constants
export const KYC_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

// KYC Tier levels
export const KYC_TIER = {
  TIER_0: 0, // Basic - email verified only
  TIER_1: 1, // Identity verified (ID + Selfie)
  TIER_2: 2, // Enhanced (ID + Selfie + Address proof)
  TIER_3: 3, // Premium (Full verification + income)
};

// Document types
export const DOC_TYPES = {
  ID_CARD: 'id_card',
  PASSPORT: 'passport',
  DRIVER_LICENSE: 'driver_license',
  RESIDENCE_PERMIT: 'residence_permit',
};

// Create the kyc_verifications table
export const ensureKYCTable = async () => {
  const pool = getPool();
  
  const createSql = `
    CREATE TABLE IF NOT EXISTS kyc_verifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      status ENUM('pending', 'under_review', 'approved', 'rejected', 'expired') DEFAULT 'pending',
      tier TINYINT DEFAULT 1,
      
      -- Document information
      document_type ENUM('id_card', 'passport', 'driver_license', 'residence_permit') NOT NULL,
      document_number VARCHAR(100) DEFAULT NULL,
      document_country VARCHAR(3) DEFAULT NULL,
      document_expiry DATE DEFAULT NULL,
      
      -- Document images (stored as base64 or file paths)
      id_front_image LONGTEXT DEFAULT NULL,
      id_back_image LONGTEXT DEFAULT NULL,
      selfie_image LONGTEXT DEFAULT NULL,
      address_proof_image LONGTEXT DEFAULT NULL,
      
      -- Personal information extracted/entered
      first_name VARCHAR(100) DEFAULT NULL,
      last_name VARCHAR(100) DEFAULT NULL,
      date_of_birth DATE DEFAULT NULL,
      nationality VARCHAR(100) DEFAULT NULL,
      address_line1 VARCHAR(255) DEFAULT NULL,
      address_line2 VARCHAR(255) DEFAULT NULL,
      city VARCHAR(100) DEFAULT NULL,
      state VARCHAR(100) DEFAULT NULL,
      postal_code VARCHAR(20) DEFAULT NULL,
      country VARCHAR(100) DEFAULT NULL,
      
      -- Verification scores and results
      face_match_score DECIMAL(5,2) DEFAULT NULL,
      liveness_passed TINYINT(1) DEFAULT 0,
      document_authentic TINYINT(1) DEFAULT NULL,
      
      -- Admin review information
      admin_notes TEXT DEFAULT NULL,
      rejection_reason TEXT DEFAULT NULL,
      reviewed_by INT DEFAULT NULL,
      reviewed_at TIMESTAMP DEFAULT NULL,
      
      -- Timestamps
      expires_at TIMESTAMP DEFAULT NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_submitted_at (submitted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  await pool.query(createSql);
  
  // Add kyc_tier and kyc_verified columns to users table if they don't exist
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN kyc_tier TINYINT DEFAULT 0 AFTER is_active`);
  } catch (e) {
    // Column already exists
  }
  
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN kyc_verified TINYINT(1) DEFAULT 0 AFTER kyc_tier`);
  } catch (e) {
    // Column already exists
  }
  
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN kyc_verified_at TIMESTAMP NULL AFTER kyc_verified`);
  } catch (e) {
    // Column already exists
  }
};

// Create a new KYC verification request
export const createKYCVerification = async (data) => {
  const pool = getPool();
  
  const {
    userId,
    documentType,
    documentNumber,
    documentCountry,
    documentExpiry,
    idFrontImage,
    idBackImage,
    selfieImage,
    addressProofImage,
    firstName,
    lastName,
    dateOfBirth,
    nationality,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    tier = 1,
  } = data;
  
  const [result] = await pool.query(
    `INSERT INTO kyc_verifications 
     (user_id, document_type, document_number, document_country, document_expiry,
      id_front_image, id_back_image, selfie_image, address_proof_image,
      first_name, last_name, date_of_birth, nationality,
      address_line1, address_line2, city, state, postal_code, country, tier)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId, documentType, documentNumber || null, documentCountry || null, documentExpiry || null,
      idFrontImage || null, idBackImage || null, selfieImage || null, addressProofImage || null,
      firstName || null, lastName || null, dateOfBirth || null, nationality || null,
      addressLine1 || null, addressLine2 || null, city || null, state || null, postalCode || null, country || null, tier,
    ]
  );
  
  return findKYCById(result.insertId);
};

// Find KYC by ID
export const findKYCById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT kv.*, u.email, u.full_name 
     FROM kyc_verifications kv
     JOIN users u ON kv.user_id = u.id
     WHERE kv.id = ?`,
    [id]
  );
  return rows[0] || null;
};

// Find KYC by user ID (latest)
export const findKYCByUserId = async (userId) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM kyc_verifications 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

// Get all KYC history for a user
export const getKYCHistoryByUserId = async (userId) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT kv.*, 
            reviewer.full_name as reviewer_name, 
            reviewer.email as reviewer_email
     FROM kyc_verifications kv
     LEFT JOIN users reviewer ON kv.reviewed_by = reviewer.id
     WHERE kv.user_id = ? 
     ORDER BY kv.created_at DESC`,
    [userId]
  );
  return rows;
};

// List all KYC verifications with filters
export const listKYCVerifications = async ({ 
  status = null, 
  limit = 50, 
  offset = 0, 
  search = '' 
} = {}) => {
  const pool = getPool();
  
  let sql = `
    SELECT kv.id, kv.user_id, kv.status, kv.tier, kv.document_type, 
           kv.first_name, kv.last_name, kv.face_match_score, kv.liveness_passed,
           kv.submitted_at, kv.reviewed_at, kv.created_at,
           u.email, u.full_name
    FROM kyc_verifications kv
    JOIN users u ON kv.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ` AND kv.status = ?`;
    params.push(status);
  }
  
  if (search) {
    sql += ` AND (u.email LIKE ? OR u.full_name LIKE ? OR kv.first_name LIKE ? OR kv.last_name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  sql += ` ORDER BY kv.submitted_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const [rows] = await pool.query(sql, params);
  return rows;
};

// Count KYC verifications
export const countKYCVerifications = async ({ status = null, search = '' } = {}) => {
  const pool = getPool();
  
  let sql = `
    SELECT COUNT(*) as count
    FROM kyc_verifications kv
    JOIN users u ON kv.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ` AND kv.status = ?`;
    params.push(status);
  }
  
  if (search) {
    sql += ` AND (u.email LIKE ? OR u.full_name LIKE ? OR kv.first_name LIKE ? OR kv.last_name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  const [rows] = await pool.query(sql, params);
  return rows[0]?.count || 0;
};

// Get KYC stats
export const getKYCStats = async () => {
  const pool = getPool();
  
  const [stats] = await pool.query(`
    SELECT 
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
      COUNT(CASE WHEN status = 'approved' AND DATE(reviewed_at) = CURDATE() THEN 1 END) as approved_today,
      COUNT(CASE WHEN status = 'rejected' AND DATE(reviewed_at) = CURDATE() THEN 1 END) as rejected_today,
      COUNT(*) as total
    FROM kyc_verifications
  `);
  
  return stats[0];
};

// Update KYC verification
export const updateKYCVerification = async (id, data) => {
  const pool = getPool();
  
  const allowedFields = [
    'status', 'tier', 'document_number', 'document_country', 'document_expiry',
    'first_name', 'last_name', 'date_of_birth', 'nationality',
    'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
    'face_match_score', 'liveness_passed', 'document_authentic',
    'admin_notes', 'rejection_reason', 'reviewed_by', 'reviewed_at', 'expires_at',
  ];
  
  const updates = [];
  const params = [];
  
  for (const [key, value] of Object.entries(data)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    if (allowedFields.includes(snakeKey)) {
      updates.push(`${snakeKey} = ?`);
      params.push(value);
    }
  }
  
  if (updates.length === 0) return findKYCById(id);
  
  params.push(id);
  await pool.query(
    `UPDATE kyc_verifications SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  
  return findKYCById(id);
};

// Approve KYC
export const approveKYC = async (id, reviewerId, notes = null) => {
  const pool = getPool();
  
  // Get the KYC record
  const kyc = await findKYCById(id);
  if (!kyc) throw new Error('KYC verification not found');
  
  // Update KYC status
  await pool.query(
    `UPDATE kyc_verifications 
     SET status = 'approved', 
         admin_notes = ?,
         reviewed_by = ?,
         reviewed_at = NOW(),
         expires_at = DATE_ADD(NOW(), INTERVAL 1 YEAR)
     WHERE id = ?`,
    [notes, reviewerId, id]
  );
  
  // Update user's KYC status
  await pool.query(
    `UPDATE users 
     SET kyc_tier = ?, kyc_verified = 1, kyc_verified_at = NOW()
     WHERE id = ?`,
    [kyc.tier, kyc.user_id]
  );
  
  return findKYCById(id);
};

// Reject KYC
export const rejectKYC = async (id, reviewerId, rejectionReason, notes = null) => {
  const pool = getPool();
  
  await pool.query(
    `UPDATE kyc_verifications 
     SET status = 'rejected', 
         rejection_reason = ?,
         admin_notes = ?,
         reviewed_by = ?,
         reviewed_at = NOW()
     WHERE id = ?`,
    [rejectionReason, notes, reviewerId, id]
  );
  
  return findKYCById(id);
};

// Set KYC under review
export const setKYCUnderReview = async (id, reviewerId) => {
  const pool = getPool();
  
  await pool.query(
    `UPDATE kyc_verifications 
     SET status = 'under_review', reviewed_by = ?
     WHERE id = ?`,
    [reviewerId, id]
  );
  
  return findKYCById(id);
};

