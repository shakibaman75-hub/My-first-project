import { Router } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../auth.ts';
import { IAppointment } from '../types.ts';

const router = Router();

// POST /api/appointments/book - Book New Appointment
router.post('/book', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      patientName,
      patientEmail,
      patientPhone,
      patientGender,
      patientAge,
      reason,
      patientNotes,
      paymentMethod = 'Online Gateway',
    } = req.body;

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ success: false, message: 'Doctor ID, appointment date, and time slot are required.' });
    }

    const doctor = db.doctors.find((d) => d._id === doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Selected doctor not found.' });
    }

    // Check for double-booking conflict
    const conflict = db.appointments.find(
      (a) =>
        a.doctorId === doctorId &&
        a.appointmentDate === appointmentDate &&
        a.appointmentTime.trim() === appointmentTime.trim() &&
        a.appointmentStatus !== 'cancelled' &&
        a.appointmentStatus !== 'rejected'
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `The slot ${appointmentTime} on ${appointmentDate} has just been booked by another patient. Please select another slot.`,
      });
    }

    const hospital = db.hospitals.find((h) => h._id === doctor.hospitalId);

    const appointmentId = 'apt_' + Date.now();
    const orderId = 'order_MC' + Math.floor(1000000 + Math.random() * 9000000);

    const newAppointment: IAppointment = {
      _id: appointmentId,
      patientId: req.user._id,
      patientName: patientName || req.user.name,
      patientEmail: patientEmail || req.user.email,
      patientPhone: patientPhone || req.user.phone,
      patientGender: patientGender || req.user.gender || 'Not specified',
      patientAge: Number(patientAge) || 25,
      doctorId: doctor._id,
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      doctorProfileImage: doctor.profileImage,
      hospitalId: doctor.hospitalId,
      hospitalName: hospital ? hospital.name : doctor.hospitalName,
      appointmentDate,
      appointmentTime: appointmentTime.trim(),
      amount: doctor.consultationFee,
      paymentStatus: 'pending',
      appointmentStatus: 'upcoming',
      orderId,
      reason: reason || 'General Consultation & Medical Examination',
      patientNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.appointments.unshift(newAppointment);

    db.logAction(
      'APPOINTMENT_CREATED',
      req.user.name,
      req.user.role,
      `Booked appointment with ${doctor.name} on ${appointmentDate} at ${appointmentTime}`
    );

    return res.status(201).json({
      success: true,
      message: 'Appointment booking initiated. Please proceed to payment.',
      appointment: newAppointment,
      orderId,
    });
  } catch (err: any) {
    console.error('Booking error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create appointment.' });
  }
});

// GET /api/appointments/my - Current Patient's Appointments
router.get('/my', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const userAppointments = db.appointments
      .filter((a) => a.patientId === req.user!._id || a.patientEmail.toLowerCase() === req.user!.email.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      success: true,
      total: userAppointments.length,
      appointments: userAppointments,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch appointments.' });
  }
});

// GET /api/appointments/doctor - Doctor's Appointment Schedule
router.get('/doctor', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const doctor = db.doctors.find((d) => d.userId === req.user!._id || d.email === req.user!.email);
    if (!doctor && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Doctor profile not found.' });
    }

    const doctorId = doctor ? doctor._id : (req.query.doctorId as string);
    const doctorAppointments = db.appointments
      .filter((a) => !doctorId || a.doctorId === doctorId)
      .sort((a, b) => new Date(b.appointmentDate + 'T00:00:00Z').getTime() - new Date(a.appointmentDate + 'T00:00:00Z').getTime());

    return res.json({
      success: true,
      total: doctorAppointments.length,
      appointments: doctorAppointments,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch doctor appointments.' });
  }
});

// GET /api/appointments/all - Admin All Appointments
router.get('/all', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    const { status, doctorId, hospitalId, search } = req.query as Record<string, string>;

    let list = db.appointments.filter((a) => {
      if (status && status !== 'All' && a.appointmentStatus !== status) return false;
      if (doctorId && doctorId !== 'All' && a.doctorId !== doctorId) return false;
      if (hospitalId && hospitalId !== 'All' && a.hospitalId !== hospitalId) return false;
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          a.patientName.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q) ||
          a.hospitalName.toLowerCase().includes(q) ||
          a._id.toLowerCase().includes(q)
        );
      }
      return true;
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      success: true,
      total: list.length,
      appointments: list,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch all appointments.' });
  }
});

// GET /api/appointments/:id - Single Appointment Details & Receipt
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const appointment = db.appointments.find((a) => a._id === req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const doctor = db.doctors.find((d) => d._id === appointment.doctorId);
    const hospital = db.hospitals.find((h) => h._id === appointment.hospitalId);
    const payment = db.payments.find((p) => p.appointmentId === appointment._id || p.orderId === appointment.orderId);

    return res.json({
      success: true,
      appointment,
      doctor,
      hospital,
      payment,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to load appointment details.' });
  }
});

// PUT /api/appointments/:id/cancel - Cancel Appointment
router.put('/:id/cancel', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { reason = 'Cancelled by patient' } = req.body;
    const aptIndex = db.appointments.findIndex((a) => a._id === req.params.id);

    if (aptIndex === -1) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const appointment = db.appointments[aptIndex];

    // Check authorization: patient, assigned doctor, or admin
    const isPatient = appointment.patientId === req.user._id || appointment.patientEmail === req.user.email;
    const isDoctor = req.user.role === 'doctor' && req.doctor?._id === appointment.doctorId;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment.' });
    }

    if (appointment.appointmentStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Completed appointments cannot be cancelled.' });
    }

    appointment.appointmentStatus = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.updatedAt = new Date().toISOString();

    // If paid, process simulated refund
    if (appointment.paymentStatus === 'paid') {
      appointment.paymentStatus = 'refunded';
      appointment.refundAmount = appointment.amount;

      // Update payment record if exists
      const payment = db.payments.find((p) => p.appointmentId === appointment._id);
      if (payment) {
        payment.status = 'refunded';
      }
    }

    // Notifications
    db.addNotification(
      appointment.patientId,
      'Appointment Cancelled',
      `Your appointment with ${appointment.doctorName} on ${appointment.appointmentDate} was cancelled. ${appointment.paymentStatus === 'refunded' ? 'Full refund of ₹' + appointment.amount + ' has been initiated.' : ''}`,
      'cancellation',
      '/dashboard'
    );

    db.addNotification(
      appointment.doctorId,
      'Appointment Cancelled',
      `Appointment with ${appointment.patientName} for ${appointment.appointmentDate} at ${appointment.appointmentTime} has been cancelled.`,
      'cancellation',
      '/doctor/dashboard'
    );

    db.logAction('APPOINTMENT_CANCELLED', req.user.name, req.user.role, `Cancelled appointment #${appointment._id}. Reason: ${reason}`);

    return res.json({
      success: true,
      message: 'Appointment cancelled successfully. Refund processed if eligible.',
      appointment,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to cancel appointment.' });
  }
});

// PUT /api/appointments/:id/reschedule - Reschedule Appointment
router.put('/:id/reschedule', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { newDate, newTime } = req.body;
    if (!newDate || !newTime) {
      return res.status(400).json({ success: false, message: 'New date and time slot are required.' });
    }

    const appointment = db.appointments.find((a) => a._id === req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Check conflict
    const conflict = db.appointments.find(
      (a) =>
        a._id !== appointment._id &&
        a.doctorId === appointment.doctorId &&
        a.appointmentDate === newDate &&
        a.appointmentTime.trim() === newTime.trim() &&
        a.appointmentStatus !== 'cancelled' &&
        a.appointmentStatus !== 'rejected'
    );

    if (conflict) {
      return res.status(409).json({ success: false, message: 'This new time slot is already occupied. Please select another.' });
    }

    const prevDate = appointment.appointmentDate;
    const prevTime = appointment.appointmentTime;

    appointment.appointmentDate = newDate;
    appointment.appointmentTime = newTime.trim();
    appointment.appointmentStatus = 'confirmed';
    appointment.updatedAt = new Date().toISOString();

    db.addNotification(
      appointment.patientId,
      'Appointment Rescheduled',
      `Your appointment with ${appointment.doctorName} was rescheduled to ${newDate} at ${newTime}.`,
      'appointment',
      '/dashboard'
    );

    db.addNotification(
      appointment.doctorId,
      'Appointment Rescheduled',
      `Patient ${appointment.patientName} rescheduled from ${prevDate} ${prevTime} to ${newDate} ${newTime}.`,
      'appointment',
      '/doctor/dashboard'
    );

    db.logAction(
      'APPOINTMENT_RESCHEDULED',
      req.user.name,
      req.user.role,
      `Rescheduled #${appointment._id} to ${newDate} ${newTime}`
    );

    return res.json({
      success: true,
      message: 'Appointment successfully rescheduled.',
      appointment,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to reschedule appointment.' });
  }
});

// PUT /api/appointments/:id/status - Doctor/Admin Updates Status & Notes (Complete, Accept, Reject)
router.put('/:id/status', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { status, consultationNotes, prescription, rejectionReason } = req.body;
    const appointment = db.appointments.find((a) => a._id === req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (status) appointment.appointmentStatus = status;
    if (consultationNotes) appointment.consultationNotes = consultationNotes;
    if (prescription) appointment.prescription = prescription;
    if (rejectionReason) appointment.cancellationReason = rejectionReason;
    appointment.updatedAt = new Date().toISOString();

    if (status === 'completed') {
      db.addNotification(
        appointment.patientId,
        'Consultation Completed',
        `Your consultation with ${appointment.doctorName} is completed. You can now download your digital prescription and submit a review.`,
        'appointment',
        '/dashboard'
      );
    } else if (status === 'rejected') {
      db.addNotification(
        appointment.patientId,
        'Appointment Request Declined',
        `Your appointment request was declined: ${rejectionReason || 'Doctor unavailable'}. Refund has been initiated.`,
        'cancellation',
        '/dashboard'
      );
      if (appointment.paymentStatus === 'paid') {
        appointment.paymentStatus = 'refunded';
      }
    }

    db.logAction(
      'APPOINTMENT_STATUS_UPDATED',
      req.user.name,
      req.user.role,
      `Updated appointment #${appointment._id} status to ${status}`
    );

    return res.json({
      success: true,
      message: `Appointment marked as ${status}.`,
      appointment,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update appointment status.' });
  }
});

export default router;
