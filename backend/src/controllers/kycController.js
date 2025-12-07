import {
  createKYCVerification,
  findKYCById,
  findKYCByUserId,
  getKYCHistoryByUserId,
  listKYCVerifications,
  countKYCVerifications,
  getKYCStats,
  approveKYC,
  rejectKYC,
  setKYCUnderReview,
  ensureKYCTable,
  KYC_STATUS,
  DOC_TYPES,
} from '../models/kycModel.js';

// Initialize KYC tables
export const initKYC = async () => {
  await ensureKYCTable();
  console.log('✅ KYC tables initialized');
};

// ===================
// USER ENDPOINTS
// ===================

// Submit new KYC verification
export const submitKYC = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check for existing pending/under_review KYC
    const existingKYC = await findKYCByUserId(userId);
    if (existingKYC && ['pending', 'under_review'].includes(existingKYC.status)) {
      return res.status(400).json({
        message: 'You already have a pending KYC verification. Please wait for it to be reviewed.',
        existingKYC: {
          id: existingKYC.id,
          status: existingKYC.status,
          submitted_at: existingKYC.submitted_at,
        },
      });
    }
    
    const {
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
      tier,
    } = req.body;
    
    // Validate required fields
    if (!documentType || !Object.values(DOC_TYPES).includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }
    
    if (!idFrontImage || !selfieImage) {
      return res.status(400).json({ message: 'ID front image and selfie are required' });
    }
    
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }
    
    // Create the KYC verification
    const kyc = await createKYCVerification({
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
      tier: tier || 1,
    });
    
    res.status(201).json({
      message: 'KYC verification submitted successfully',
      kyc: {
        id: kyc.id,
        status: kyc.status,
        tier: kyc.tier,
        document_type: kyc.document_type,
        submitted_at: kyc.submitted_at,
      },
    });
  } catch (error) {
    console.error('Error submitting KYC:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get current user's KYC status
export const getMyKYCStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const kyc = await findKYCByUserId(userId);
    
    if (!kyc) {
      return res.json({
        status: 'not_started',
        tier: 0,
        message: 'You have not submitted any KYC verification yet',
      });
    }
    
    res.json({
      id: kyc.id,
      status: kyc.status,
      tier: kyc.tier,
      document_type: kyc.document_type,
      submitted_at: kyc.submitted_at,
      reviewed_at: kyc.reviewed_at,
      rejection_reason: kyc.status === 'rejected' ? kyc.rejection_reason : null,
      expires_at: kyc.expires_at,
    });
  } catch (error) {
    console.error('Error getting KYC status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get current user's KYC history
export const getMyKYCHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await getKYCHistoryByUserId(userId);
    
    res.json({
      history: history.map(kyc => ({
        id: kyc.id,
        status: kyc.status,
        tier: kyc.tier,
        document_type: kyc.document_type,
        submitted_at: kyc.submitted_at,
        reviewed_at: kyc.reviewed_at,
        rejection_reason: kyc.rejection_reason,
      })),
    });
  } catch (error) {
    console.error('Error getting KYC history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ===================
// ADMIN ENDPOINTS
// ===================

// List all KYC verifications (admin)
export const listKYC = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, search = '' } = req.query;
    
    const [verifications, total, stats] = await Promise.all([
      listKYCVerifications({ status, limit: parseInt(limit), offset: parseInt(offset), search }),
      countKYCVerifications({ status, search }),
      getKYCStats(),
    ]);
    
    res.json({
      verifications,
      total,
      stats,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error listing KYC verifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get KYC stats (admin)
export const getStats = async (req, res) => {
  try {
    const stats = await getKYCStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting KYC stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get single KYC verification (admin)
export const getKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const kyc = await findKYCById(id);
    
    if (!kyc) {
      return res.status(404).json({ message: 'KYC verification not found' });
    }
    
    // Get user's KYC history
    const history = await getKYCHistoryByUserId(kyc.user_id);
    
    res.json({
      kyc,
      history: history.filter(h => h.id !== kyc.id).slice(0, 5), // Previous submissions
    });
  } catch (error) {
    console.error('Error getting KYC verification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's KYC (admin) - for user detail page
export const getUserKYC = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [current, history] = await Promise.all([
      findKYCByUserId(userId),
      getKYCHistoryByUserId(userId),
    ]);
    
    res.json({
      current,
      history,
    });
  } catch (error) {
    console.error('Error getting user KYC:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Set KYC under review (admin)
export const startReview = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewerId = req.user.id;
    
    const kyc = await findKYCById(id);
    if (!kyc) {
      return res.status(404).json({ message: 'KYC verification not found' });
    }
    
    if (kyc.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending verifications can be marked as under review' });
    }
    
    const updated = await setKYCUnderReview(id, reviewerId);
    res.json({
      message: 'KYC verification is now under review',
      kyc: updated,
    });
  } catch (error) {
    console.error('Error starting KYC review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve KYC (admin)
export const approve = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewerId = req.user.id;
    const { notes } = req.body;
    
    const kyc = await findKYCById(id);
    if (!kyc) {
      return res.status(404).json({ message: 'KYC verification not found' });
    }
    
    if (!['pending', 'under_review'].includes(kyc.status)) {
      return res.status(400).json({ message: 'Only pending or under review verifications can be approved' });
    }
    
    const updated = await approveKYC(id, reviewerId, notes);
    res.json({
      message: 'KYC verification approved successfully',
      kyc: updated,
    });
  } catch (error) {
    console.error('Error approving KYC:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Reject KYC (admin)
export const reject = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewerId = req.user.id;
    const { rejectionReason, notes } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    const kyc = await findKYCById(id);
    if (!kyc) {
      return res.status(404).json({ message: 'KYC verification not found' });
    }
    
    if (!['pending', 'under_review'].includes(kyc.status)) {
      return res.status(400).json({ message: 'Only pending or under review verifications can be rejected' });
    }
    
    const updated = await rejectKYC(id, reviewerId, rejectionReason, notes);
    res.json({
      message: 'KYC verification rejected',
      kyc: updated,
    });
  } catch (error) {
    console.error('Error rejecting KYC:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

