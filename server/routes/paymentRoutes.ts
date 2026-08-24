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

// GET /api/payments/business-settings - Public/Auth Hospital Payment Gateway & Bank Account Info
router.get('/business-settings', (req, res) => {
  try {
    const settings = db.businessSettings || {
      hospitalName: 'MediCare Healthcare Center',
      businessUpiId: 'medicare.billing@okhdfcbank',
      bankName: 'HDFC Bank',
      accountHolderName: 'MediCare Healthcare Services Pvt Ltd',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0001234',
      branch: 'Medical Enclave, New Delhi',
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
      isLiveRazorpayConfigured: !!(process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('demo')),
    };

    return res.json({
      success: true,
      settings: {
        ...settings,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || settings.razorpayKeyId || '',
        isLiveRazorpayConfigured: !!(process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('demo')),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch business payment settings.' });
  }
});

// PUT /api/payments/business-settings - Admin updates bank and payment details
router.put('/business-settings', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    const {
      hospitalName,
      businessUpiId,
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode,
      branch,
      razorpayKeyId,
    } = req.body;

    db.businessSettings = {
      hospitalName: hospitalName || db.businessSettings?.hospitalName || 'MediCare Healthcare Center',
      businessUpiId: businessUpiId || db.businessSettings?.businessUpiId || 'medicare.billing@okhdfcbank',
      bankName: bankName || db.businessSettings?.bankName || 'HDFC Bank',
      accountHolderName: accountHolderName || db.businessSettings?.accountHolderName || 'MediCare Healthcare Services Pvt Ltd',
      accountNumber: accountNumber || db.businessSettings?.accountNumber || '',
      ifscCode: ifscCode || db.businessSettings?.ifscCode || '',
      branch: branch || db.businessSettings?.branch || '',
      razorpayKeyId: razorpayKeyId || db.businessSettings?.razorpayKeyId || '',
      isLiveRazorpayConfigured: !!(razorpayKeyId && !razorpayKeyId.includes('demo')),
    };

    db.logAction(
      'UPDATE_PAYMENT_CONFIG',
      req.user?.name || 'Admin',
      'admin',
      `Updated business bank settlement settings and UPI ID (${db.businessSettings.businessUpiId})`
    );

    return res.json({
      success: true,
      message: 'Business payment settings updated successfully.',
      settings: db.businessSettings,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update business payment settings.' });
  }
});

// POST /api/payments/submit-upi-proof - Submit manual UPI transaction reference (UTR)
router.post('/submit-upi-proof', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { appointmentId, utrNumber, payerUpiId, screenshotNote } = req.body;

    if (!appointmentId || !utrNumber) {
      return res.status(400).json({ success: false, message: 'Appointment ID and 12-digit UTR number are required.' });
    }

    const appointment = db.appointments.find((a) => a._id === appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const txnId = `UTR-${utrNumber.trim()}`;
    appointment.paymentStatus = 'pending'; // Awaiting admin verification or confirmed
    appointment.paymentId = txnId;
    appointment.patientNotes = (appointment.patientNotes ? appointment.patientNotes + ' | ' : '') + `UPI Ref/UTR: ${utrNumber} (Payer: ${payerUpiId || 'UPI'})`;
    appointment.updatedAt = new Date().toISOString();

    // Create a pending payment record
    const newPayment: IPayment = {
      _id: 'pay_manual_' + Date.now(),
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      amount: appointment.amount || appointment.consultationFee || 500,
      paymentGateway: 'UPI',
      transactionId: txnId,
      orderId: appointment.orderId || `manual_${Date.now()}`,
      status: 'pending',
      method: `Direct UPI QR (UTR: ${utrNumber})`,
      createdAt: new Date().toISOString(),
    };

    db.payments.unshift(newPayment);

    // Notify Admin
    db.addNotification(
      'usr_admin',
      'UPI Payment Proof Submitted for Verification',
      `Patient ${appointment.patientName} submitted UPI UTR #${utrNumber} for ₹${appointment.amount || appointment.consultationFee}. Please verify in Admin Dashboard.`,
      'payment',
      '/admin/dashboard'
    );

    return res.json({
      success: true,
      message: 'UPI payment reference submitted successfully! Admin will verify and confirm your slot.',
      appointment,
      payment: newPayment,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to submit payment proof.' });
  }
});

// PUT /api/payments/:paymentId/confirm-manual - Admin verifies and approves payment
router.put('/:paymentId/confirm-manual', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    const payment = db.payments.find((p) => p._id === req.params.paymentId || p.transactionId === req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    payment.status = 'paid';
    const appointment = db.appointments.find((a) => a._id === payment.appointmentId);
    if (appointment) {
      appointment.paymentStatus = 'paid';
      appointment.status = 'confirmed';
      appointment.appointmentStatus = 'confirmed';
      appointment.updatedAt = new Date().toISOString();

      db.addNotification(
        appointment.patientId,
        'Payment Verified & Appointment Confirmed',
        `Admin verified your UPI payment of ₹${payment.amount}. Your appointment with ${appointment.doctorName} is confirmed!`,
        'payment',
        '/patient/dashboard'
      );
    }

    db.logAction(
      'MANUAL_PAYMENT_VERIFIED',
      req.user?.name || 'Admin',
      'admin',
      `Approved manual UPI payment ${payment.transactionId} for ₹${payment.amount}`
    );

    return res.json({
      success: true,
      message: 'Payment verified and appointment confirmed successfully!',
      payment,
      appointment,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to confirm manual payment.' });
  }
});

export default router;
