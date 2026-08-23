import { Router } from 'express';
import { db } from '../db.ts';
import { authenticateToken, requireRole, AuthRequest } from '../auth.ts';

const router = Router();

// Helper to format minutes to 12-hour AM/PM string
function formatTimeToAMPM(time24: string): string {
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const min = minStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
  return `${formattedHour}:${min} ${ampm}`;
}

// Generate slot intervals between two times (e.g. "09:00" to "17:00") with step
function generateTimeSlots(startTime: string, endTime: string, stepMinutes = 30, breakTime?: { start: string; end: string }): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let startTotalMins = startH * 60 + startM;
  const endTotalMins = endH * 60 + endM;

  let breakStartMins = -1;
  let breakEndMins = -1;
  if (breakTime && breakTime.start && breakTime.end) {
    const [bsh, bsm] = breakTime.start.split(':').map(Number);
    const [beh, bem] = breakTime.end.split(':').map(Number);
    breakStartMins = bsh * 60 + bsm;
    breakEndMins = beh * 60 + bem;
  }

  while (startTotalMins + stepMinutes <= endTotalMins) {
    // Check if slot falls inside doctor break time
    const slotEnd = startTotalMins + stepMinutes;
    const isDuringBreak = breakStartMins !== -1 && (
      (startTotalMins >= breakStartMins && startTotalMins < breakEndMins) ||
      (slotEnd > breakStartMins && slotEnd <= breakEndMins)
    );

    if (!isDuringBreak) {
      const h = Math.floor(startTotalMins / 60);
      const m = startTotalMins % 60;
      const hStr = h < 10 ? `0${h}` : `${h}`;
      const mStr = m < 10 ? `0${m}` : `${m}`;
      slots.push(formatTimeToAMPM(`${hStr}:${mStr}`));
    }

    startTotalMins += stepMinutes;
  }

  return slots;
}

// GET /api/doctors - Search & Filter Doctors
router.get('/', (req, res) => {
  try {
    const {
      search = '',
      specialization = '',
      hospital = '',
      city = '',
      gender = '',
      experience = '',
      minFee = '',
      maxFee = '',
      minRating = '',
      sortBy = 'rating', // 'rating', 'fee_asc', 'fee_desc', 'experience'
      page = '1',
      limit = '12',
      includePending = 'false',
    } = req.query as Record<string, string>;

    let results = db.doctors.filter((doc) => {
      // By default only show approved doctors unless explicitly requested by admin
      if (includePending !== 'true' && doc.approvalStatus !== 'approved') {
        return false;
      }

      // Search keyword matches name, specialization, qualification, about, hospitalName
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesName = doc.name.toLowerCase().includes(query);
        const matchesSpec = doc.specialization.toLowerCase().includes(query);
        const matchesHosp = doc.hospitalName.toLowerCase().includes(query);
        const matchesQual = doc.qualification.toLowerCase().includes(query);
        if (!matchesName && !matchesSpec && !matchesHosp && !matchesQual) {
          return false;
        }
      }

      // Specialization filter
      if (specialization && specialization !== 'All' && doc.specialization.toLowerCase() !== specialization.toLowerCase()) {
        return false;
      }

      // Hospital filter
      if (hospital && hospital !== 'All' && doc.hospitalId !== hospital && !doc.hospitalName.toLowerCase().includes(hospital.toLowerCase())) {
        return false;
      }

      // City filter
      if (city && city !== 'All') {
        const docHospital = db.hospitals.find((h) => h._id === doc.hospitalId);
        if (!docHospital || docHospital.city.toLowerCase() !== city.toLowerCase()) {
          return false;
        }
      }

      // Experience filter
      if (experience && experience !== 'All') {
        const expNum = parseInt(experience, 10);
        if (!isNaN(expNum) && doc.experience < expNum) {
          return false;
        }
      }

      // Min/Max Fee
      if (minFee && doc.consultationFee < parseFloat(minFee)) {
        return false;
      }
      if (maxFee && doc.consultationFee > parseFloat(maxFee)) {
        return false;
      }

      // Min Rating
      if (minRating && doc.rating < parseFloat(minRating)) {
        return false;
      }

      // Gender filter via user profile
      if (gender && gender !== 'All') {
        const user = db.users.find((u) => u._id === doc.userId);
        if (user && user.gender && user.gender.toLowerCase() !== gender.toLowerCase()) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    results.sort((a, b) => {
      if (sortBy === 'fee_asc') return a.consultationFee - b.consultationFee;
      if (sortBy === 'fee_desc') return b.consultationFee - a.consultationFee;
      if (sortBy === 'experience') return b.experience - a.experience;
      if (sortBy === 'rating') return b.rating - a.rating || b.totalReviews - a.totalReviews;
      return 0;
    });

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);
    const total = results.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedDoctors = results.slice(startIndex, startIndex + limitNum);

    // Enrich with hospital detail
    const enriched = paginatedDoctors.map((doc) => {
      const hospitalObj = db.hospitals.find((h) => h._id === doc.hospitalId);
      return {
        ...doc,
        hospital: hospitalObj ? {
          _id: hospitalObj._id,
          name: hospitalObj.name,
          city: hospitalObj.city,
          address: hospitalObj.address,
          emergency24x7: hospitalObj.emergency24x7,
        } : null,
      };
    });

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      doctors: enriched,
    });
  } catch (error: any) {
    console.error('Doctor Search Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch doctors list.' });
  }
});

// GET /api/doctors/:id - Single Doctor Details
router.get('/:id', (req, res) => {
  try {
    const doctor = db.doctors.find((d) => d._id === req.params.id || d.userId === req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const hospital = db.hospitals.find((h) => h._id === doctor.hospitalId);
    const reviews = db.reviews.filter((r) => r.doctorId === doctor._id);

    return res.json({
      success: true,
      doctor: {
        ...doctor,
        hospital,
        recentReviews: reviews,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to load doctor profile.' });
  }
});

// GET /api/doctors/:id/available-slots - Real-time slot availability by date
router.get('/:id/available-slots', (req, res) => {
  try {
    const { date } = req.query as { date: string };
    if (!date) {
      return res.status(400).json({ success: false, message: 'Please provide a valid date parameter (YYYY-MM-DD).' });
    }

    const doctor = db.doctors.find((d) => d._id === req.params.id || d.userId === req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Determine Day of Week for selected date
    const targetDate = new Date(date + 'T00:00:00Z');
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format provided.' });
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[targetDate.getUTCDay()];

    // Check if Doctor works on this day
    const isWorkingDay = doctor.availableDays.includes(dayOfWeek);
    if (!isWorkingDay) {
      return res.json({
        success: true,
        available: false,
        reason: `${doctor.name} does not have scheduled clinic hours on ${dayOfWeek}s.`,
        availableDays: doctor.availableDays,
        slots: [],
      });
    }

    // Generate base available slots
    const allSlots = generateTimeSlots(
      doctor.workingHours.start || '09:00',
      doctor.workingHours.end || '17:00',
      doctor.slotDurationMinutes || 30,
      doctor.breakTime
    );

    // Find all active booked appointments on this date
    const bookedAppointments = db.appointments.filter(
      (apt) =>
        apt.doctorId === doctor._id &&
        apt.appointmentDate === date &&
        apt.appointmentStatus !== 'cancelled' &&
        apt.appointmentStatus !== 'rejected'
    );

    const bookedTimes = new Set(bookedAppointments.map((apt) => apt.appointmentTime.trim()));

    const slotsWithStatus = allSlots.map((timeStr) => ({
      time: timeStr,
      isAvailable: !bookedTimes.has(timeStr),
    }));

    return res.json({
      success: true,
      available: true,
      date,
      dayOfWeek,
      workingHours: doctor.workingHours,
      slots: slotsWithStatus,
      totalSlots: slotsWithStatus.length,
      availableCount: slotsWithStatus.filter((s) => s.isAvailable).length,
    });
  } catch (err: any) {
    console.error('Slot fetch error:', err);
    return res.status(500).json({ success: false, message: 'Failed to compute slot availability.' });
  }
});

// PUT /api/doctors/:id/availability - Doctor updates their own schedule
router.put('/:id/availability', authenticateToken, (req: AuthRequest, res) => {
  try {
    const doctor = db.doctors.find((d) => d._id === req.params.id || d.userId === req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    // Must be either this doctor or admin
    if (req.user?.role !== 'admin' && doctor.userId !== req.user?._id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this doctor availability.' });
    }

    const { availableDays, workingHours, breakTime, slotDurationMinutes, consultationFee } = req.body;

    if (availableDays) doctor.availableDays = availableDays;
    if (workingHours) doctor.workingHours = workingHours;
    if (breakTime !== undefined) doctor.breakTime = breakTime;
    if (slotDurationMinutes) doctor.slotDurationMinutes = Number(slotDurationMinutes);
    if (consultationFee) doctor.consultationFee = Number(consultationFee);

    db.logAction('DOCTOR_SCHEDULE_UPDATED', doctor.name, 'doctor', `Updated schedule/availability parameters.`);

    return res.json({
      success: true,
      message: 'Consultation availability updated successfully.',
      doctor,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update availability.' });
  }
});

// PUT /api/doctors/:id/status - Admin Approves or Rejects Doctor
router.put('/:id/status', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  try {
    const { status } = req.body; // 'approved' | 'rejected' | 'pending'
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const doctor = db.doctors.find((d) => d._id === req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    doctor.approvalStatus = status;

    // Send notification to the doctor
    db.addNotification(
      doctor.userId,
      `Profile ${status === 'approved' ? 'Verified & Approved' : 'Status Updated'}`,
      status === 'approved'
        ? `Congratulations! Your MediCare doctor profile has been verified and is now live for patient bookings.`
        : `Your doctor verification status has been marked as ${status}. Contact administration for details.`,
      'doctor',
      '/doctor/dashboard'
    );

    db.logAction(
      'DOCTOR_APPROVAL_CHANGED',
      req.user!.name,
      'admin',
      `Changed approval status for ${doctor.name} (${doctor.specialization}) to ${status}`
    );

    return res.json({
      success: true,
      message: `Doctor status successfully updated to ${status}.`,
      doctor,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update doctor status.' });
  }
});

export default router;
