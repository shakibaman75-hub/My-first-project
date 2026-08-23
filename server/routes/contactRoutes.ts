import { Router } from 'express';
import { db } from '../db.ts';

const router = Router();

// POST /api/contact - Submit Contact / Support Request
router.post('/', (req, res) => {
  try {
    const { name, email, phone, subject, message, department = 'General Support' } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    db.logAction(
      'CONTACT_INQUIRY',
      name,
      'guest',
      `Subject: "${subject || 'General Inquiry'}" from ${email}. Department: ${department}`
    );

    // Notify Admin
    db.addNotification(
      'usr_admin',
      'New Support Inquiry',
      `Inquiry received from ${name} (${email}): "${subject || 'No subject'}"`,
      'system',
      '/admin/dashboard'
    );

    return res.json({
      success: true,
      message: 'Thank you for reaching out! Our medical support team will contact you within 24 hours.',
      ticketId: 'MED-TKT-' + Math.floor(100000 + Math.random() * 900000),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to submit contact message.' });
  }
});

export default router;
