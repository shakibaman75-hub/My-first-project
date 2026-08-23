import { Router } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../auth.ts';
import { IReview } from '../types.ts';

const router = Router();

// POST /api/reviews - Submit Review for Doctor
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { doctorId, appointmentId, rating, comment } = req.body;

    if (!doctorId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Doctor ID, rating (1-5), and feedback comment are required.' });
    }

    const numericRating = Math.min(5, Math.max(1, Number(rating)));

    // Verify if patient actually has a completed appointment with this doctor
    const completedApt = db.appointments.find(
      (a) =>
        a.doctorId === doctorId &&
        (a.patientId === req.user!._id || a.patientEmail === req.user!.email) &&
        a.appointmentStatus === 'completed'
    );

    if (!completedApt && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only patients with a completed consultation with this doctor can submit a verified review.',
      });
    }

    const doctor = db.doctors.find((d) => d._id === doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const newReview: IReview = {
      _id: 'rev_' + Date.now(),
      patientId: req.user._id,
      patientName: req.user.name,
      patientImage: req.user.profileImage,
      doctorId: doctor._id,
      appointmentId: appointmentId || (completedApt ? completedApt._id : 'apt_manual'),
      rating: numericRating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    db.reviews.unshift(newReview);

    // Recalculate doctor rating
    const docReviews = db.reviews.filter((r) => r.doctorId === doctor._id);
    const avg = docReviews.reduce((sum, r) => sum + r.rating, 0) / docReviews.length;
    doctor.rating = parseFloat(avg.toFixed(1));
    doctor.totalReviews = docReviews.length;

    db.addNotification(
      doctor.userId,
      'New Patient Review',
      `${req.user.name} rated you ${numericRating} Stars: "${comment.slice(0, 60)}..."`,
      'doctor',
      '/doctor/dashboard'
    );

    db.logAction('REVIEW_SUBMITTED', req.user.name, req.user.role, `Reviewed ${doctor.name} with rating ${numericRating}/5`);

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your verified review has been published.',
      review: newReview,
      doctorRating: doctor.rating,
      totalReviews: doctor.totalReviews,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
});

// GET /api/reviews/doctor/:doctorId - Get Doctor Reviews
router.get('/doctor/:doctorId', (req, res) => {
  try {
    const reviews = db.reviews
      .filter((r) => r.doctorId === req.params.doctorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      success: true,
      total: reviews.length,
      reviews,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
});

// GET /api/reviews/all - Admin All Reviews
router.get('/all', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    return res.json({
      success: true,
      total: db.reviews.length,
      reviews: db.reviews,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch all reviews.' });
  }
});

// DELETE /api/reviews/:id - Admin Delete Review
router.delete('/:id', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    const revIndex = db.reviews.findIndex((r) => r._id === req.params.id);
    if (revIndex === -1) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const removed = db.reviews.splice(revIndex, 1)[0];

    // Recalculate doctor rating
    const doctor = db.doctors.find((d) => d._id === removed.doctorId);
    if (doctor) {
      const docReviews = db.reviews.filter((r) => r.doctorId === doctor._id);
      if (docReviews.length > 0) {
        const avg = docReviews.reduce((sum, r) => sum + r.rating, 0) / docReviews.length;
        doctor.rating = parseFloat(avg.toFixed(1));
        doctor.totalReviews = docReviews.length;
      } else {
        doctor.totalReviews = 0;
      }
    }

    db.logAction('REVIEW_DELETED', req.user!.name, 'admin', `Deleted review #${removed._id}`);

    return res.json({
      success: true,
      message: 'Review removed successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete review.' });
  }
});

export default router;
