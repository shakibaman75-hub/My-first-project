import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../auth.ts';
import { IPayment } from '../types.ts';

const router = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_medicare_demo_key';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_sample';

// POST /api/payments/create-order - Create Razorpay Order
router.post('/create-order', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { appointmentId, amount } = req.body;
    if (!appointmentId || !amount) {
      return res.status(400).json({ success: false, message: 'Appointment ID and amount are required.' });
    }

    const appointment = db.appointments.find((a) => a._id === appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const orderId = appointment.orderId || `order_MC${Date.now()}`;
    appointment.orderId = orderId;

    return res.json({
      success: true,
      order: {
        id: orderId,
        amount: Math.round(Number(amount) * 100), // in paise (e.g. 80000 paise = ₹800)
        currency: 'INR',
        receipt: appointment._id,
        key: RAZORPAY_KEY_ID,
        doctorName: appointment.doctorName,
        hospitalName: appointment.hospitalName,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
});

// POST /api/payments/verify - Server-side Payment Verification
router.post('/verify', authenticateToken, (req: AuthRequest, res) => {
  try {
    const {
      appointmentId,
      orderId,
      paymentId,
      signature,
      method = 'UPI',
      isTestMode = true,
    } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'Appointment ID is required.' });
    }

    const appointment = db.appointments.find((a) => a._id === appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const actualPaymentId = paymentId || `pay_rzp_${Date.now()}`;
    const actualOrderId = orderId || appointment.orderId || `order_MC${Date.now()}`;

    // Verify signature if provided and not in test bypass
    let isSignatureValid = true;
    if (signature && RAZORPAY_KEY_SECRET && !isTestMode) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(actualOrderId + '|' + actualPaymentId)
        .digest('hex');

      isSignatureValid = generatedSignature === signature;
    }

    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid transaction signature.',
      });
    }

    // Update appointment state
    appointment.paymentStatus = 'paid';
    appointment.appointmentStatus = 'confirmed';
    appointment.paymentId = actualPaymentId;
    appointment.orderId = actualOrderId;
    appointment.updatedAt = new Date().toISOString();

    // Create payment entry
    const newPayment: IPayment = {
      _id: 'pay_' + Date.now(),
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      amount: appointment.amount,
      paymentGateway: 'Razorpay',
      transactionId: actualPaymentId,
      orderId: actualOrderId,
      status: 'paid',
      method: method,
      createdAt: new Date().toISOString(),
    };

    db.payments.unshift(newPayment);

    // Notifications
    db.addNotification(
      appointment.patientId,
      'Payment Received — Appointment Confirmed',
      `Payment of ₹${appointment.amount} received via ${method}. Appointment ID: ${appointment._id} is confirmed.`,
      'payment',
      '/dashboard'
    );

    db.addNotification(
      appointment.doctorId,
      'New Confirmed Appointment',
      `Confirmed appointment booked by ${appointment.patientName} for ${appointment.appointmentDate} at ${appointment.appointmentTime}.`,
      'appointment',
      '/doctor/dashboard'
    );

    // Simulated email receipt dispatch
    db.logAction(
      'PAYMENT_VERIFIED',
      req.user ? req.user.name : appointment.patientName,
      req.user ? req.user.role : 'patient',
      `Verified payment of ₹${appointment.amount} (Txn: ${actualPaymentId}) for #${appointment._id}`
    );

    db.logAction(
      'EMAIL_DISPATCHED',
      'SYSTEM',
      'system',
      `Sent digital confirmation and invoice to ${appointment.patientEmail}`
    );

    return res.json({
      success: true,
      message: 'Payment verified and appointment confirmed successfully!',
      appointment,
      payment: newPayment,
      receiptNumber: `REC-${actualPaymentId.slice(-8).toUpperCase()}`,
    });
  } catch (err: any) {
    console.error('Payment verification error:', err);
    return res.status(500).json({ success: false, message: 'Server error during payment verification.' });
  }
});

// GET /api/payments/my - Patient Payment History
router.get('/my', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const userPayments = db.payments
      .filter((p) => p.patientId === req.user!._id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      success: true,
      total: userPayments.length,
      payments: userPayments,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payments.' });
  }
});

// GET /api/payments/all - Admin Payments View
router.get('/all', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    return res.json({
      success: true,
      total: db.payments.length,
      payments: db.payments,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payments list.' });
  }
});

// GET /api/payments/receipt/:appointmentId - Receipt Metadata
router.get('/receipt/:appointmentId', authenticateToken, (req: AuthRequest, res) => {
  try {
    const appointment = db.appointments.find((a) => a._id === req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const doctor = db.doctors.find((d) => d._id === appointment.doctorId);
    const hospital = db.hospitals.find((h) => h._id === appointment.hospitalId);
    const payment = db.payments.find((p) => p.appointmentId === appointment._id);

    return res.json({
      success: true,
      receipt: {
        receiptNumber: `REC-${(appointment.paymentId || appointment._id).slice(-8).toUpperCase()}`,
        appointmentId: appointment._id,
        bookingDate: appointment.createdAt,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        patient: {
          name: appointment.patientName,
          email: appointment.patientEmail,
          phone: appointment.patientPhone,
          gender: appointment.patientGender,
          age: appointment.patientAge,
        },
        doctor: {
          name: doctor ? doctor.name : appointment.doctorName,
          specialization: doctor ? doctor.specialization : appointment.doctorSpecialization,
          qualification: doctor?.qualification,
          registrationNumber: doctor?.registrationNumber,
        },
        hospital: {
          name: hospital ? hospital.name : appointment.hospitalName,
          address: hospital?.address,
          city: hospital?.city,
          phone: hospital?.contact.phone,
          emergency: hospital?.contact.emergency,
        },
        financials: {
          consultationFee: appointment.amount,
          facilityCharges: 0,
          taxes: 0,
          totalAmount: appointment.amount,
          paymentStatus: appointment.paymentStatus,
          paymentMethod: payment?.method || 'Online Gateway',
          transactionId: appointment.paymentId || 'N/A',
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to generate receipt data.' });
  }
});

export default router;
