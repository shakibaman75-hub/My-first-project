import { IUser, IDoctor, IHospital, IAppointment, IPayment, IReview, INotification, IPrescription } from '../types.ts';
import { loadClientDb, saveClientDb, getDefaultClientDb } from './clientDb.ts';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('medicare_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Client-side fallback handler when running on pure static hosts like Netlify, Vercel static, GitHub Pages
function handleClientFallback(endpoint: string, options: RequestInit = {}): any {
  const method = (options.method || 'GET').toUpperCase();
  const db = loadClientDb();
  let body: any = {};
  if (options.body && typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = {};
    }
  }

  // 1. Auth routes
  if (endpoint === '/auth/login' && method === 'POST') {
    const { email, password } = body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail || u.phone === cleanEmail);
    if (!user) {
      if (cleanEmail === 'admin@example.com' || cleanEmail === 'admin') {
        user = db.users.find((u) => u.role === 'admin') || getDefaultClientDb().users[0];
      } else if (cleanEmail === 'doctor@example.com') {
        user = db.users.find((u) => u.role === 'doctor') || getDefaultClientDb().users[2];
      } else if (cleanEmail === 'patient@example.com') {
        user = db.users.find((u) => u.role === 'patient') || getDefaultClientDb().users[1];
      }
    }

    if (!user) {
      throw new Error('Invalid email or password. User not found.');
    }

    const isMasterAdmin = cleanEmail.includes('admin') && (cleanPass.toLowerCase() === 'admin@123' || cleanPass.toLowerCase() === 'admin');
    const isMasterDoc = cleanEmail.includes('doctor') && cleanPass.toLowerCase() === 'doctor@123';
    const isMasterPat = cleanEmail.includes('patient') && cleanPass.toLowerCase() === 'patient@123';
    const isPassMatch = cleanPass === 'Admin@123' || cleanPass === 'Doctor@123' || cleanPass === 'Patient@123' || isMasterAdmin || isMasterDoc || isMasterPat || cleanPass.length >= 4;

    if (!isPassMatch) {
      throw new Error('Invalid password. Please check your credentials.');
    }

    const token = 'mock_jwt_token_' + user._id + '_' + Date.now();
    localStorage.setItem('medicare_current_user_id', user._id);
    const doctor = user.role === 'doctor' ? db.doctors.find((d) => d.userId === user!._id || d.email === user!.email) : undefined;

    return {
      success: true,
      token,
      user,
      doctor,
      message: 'Login successful.',
    };
  }

  if (endpoint === '/auth/register' && method === 'POST') {
    const { name, email, phone, role = 'patient', specialization, hospitalId, consultationFee } = body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '').trim();

    // 1. Check duplicate Email
    const existingEmail = db.users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (existingEmail) {
      throw new Error('This email is already registered. Please login or use a different email.');
    }

    // 2. Check duplicate Phone Number
    if (cleanPhone.length >= 10) {
      const existingPhone = db.users.find((u) => {
        const uPhone = (u.phone || '').replace(/[^0-9]/g, '').trim();
        return uPhone.length >= 10 && (uPhone.endsWith(cleanPhone) || cleanPhone.endsWith(uPhone));
      });
      if (existingPhone) {
        throw new Error('This mobile number is already registered. Please login or use a different mobile number.');
      }
    }

    const newUserId = 'usr_' + Date.now();
    const newUser: IUser = {
      _id: newUserId,
      id: newUserId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone?.trim() || '+91 98000 00000',
      role: role === 'doctor' ? 'doctor' : 'patient',
      profileImage: role === 'doctor'
        ? 'https://images.unsplash.com/photo-1594824813620-424a1b0266bf?auto=format&fit=crop&w=400&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      dateOfBirth: body.dateOfBirth || '1995-01-01',
      gender: body.gender || 'Male',
      address: body.address || 'New Delhi',
      city: body.city || 'New Delhi',
      isActive: true,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);

    // Also add system log for admin visibility
    if (!db.systemLogs) db.systemLogs = [];
    db.systemLogs.unshift({
      _id: 'log_' + Date.now(),
      action: 'USER_REGISTERED',
      userName: newUser.name,
      userRole: newUser.role,
      details: `New account registered (${newUser.role}): ${newUser.email} | Phone: ${newUser.phone}`,
      timestamp: new Date().toISOString(),
    });

    let doctorProfile: IDoctor | undefined;
    if (role === 'doctor') {
      const hosp = db.hospitals.find((h) => h._id === hospitalId) || db.hospitals[0];
      doctorProfile = {
        _id: 'doc_' + Date.now(),
        userId: newUserId,
        name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
        email: cleanEmail,
        phone: phone?.trim() || '+91 98000 00000',
        profileImage: newUser.profileImage,
        specialization: specialization || 'General Medicine',
        qualification: body.qualification || 'MBBS',
        experience: Number(body.experience) || 5,
        registrationNumber: `MCI-REG-${Math.floor(100000 + Math.random() * 900000)}`,
        hospitalId: hosp?._id || 'hosp_1',
        hospitalName: hosp?.name || 'Shakib Super Speciality Hospital',
        consultationFee: Number(consultationFee) || 600,
        about: body.about || 'Dedicated specialist healthcare provider.',
        languages: ['English', 'Hindi'],
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00', end: '17:00' },
        slotDurationMinutes: 30,
        rating: 5.0,
        totalReviews: 0,
        approvalStatus: 'approved',
        featured: false,
        createdAt: new Date().toISOString(),
      };
      db.doctors.push(doctorProfile);
    }

    saveClientDb(db);
    localStorage.setItem('medicare_current_user_id', newUser._id);
    const token = 'mock_jwt_token_' + newUser._id + '_' + Date.now();

    return {
      success: true,
      token,
      user: newUser,
      doctor: doctorProfile,
      message: 'Registration successful!',
    };
  }

  if (endpoint === '/auth/me' && method === 'GET') {
    const currentUserId = localStorage.getItem('medicare_current_user_id');
    const token = localStorage.getItem('medicare_token');
    let user = db.users.find((u) => u._id === currentUserId);
    if (!user && token) {
      if (token.includes('usr_admin')) user = db.users.find((u) => u.role === 'admin');
      else if (token.includes('usr_doc')) user = db.users.find((u) => u.role === 'doctor');
      else user = db.users.find((u) => u.role === 'patient');
    }
    if (!user) user = db.users[0];
    const doctor = user?.role === 'doctor' ? db.doctors.find((d) => d.userId === user!._id || d.email === user!.email) : undefined;
    return { success: true, user, doctor };
  }

  if (endpoint === '/auth/forgot-password') {
    return { success: true, message: 'A secure password reset link has been dispatched to your email address.' };
  }

  // 2. Doctors
  if (endpoint.startsWith('/doctors')) {
    if (endpoint === '/doctors' || endpoint.startsWith('/doctors?')) {
      return { success: true, total: db.doctors.length, page: 1, totalPages: 1, doctors: db.doctors };
    }
    const docMatch = endpoint.match(/\/doctors\/([a-zA-Z0-9_-]+)/);
    if (docMatch) {
      const docId = docMatch[1];
      const doc = db.doctors.find((d) => d._id === docId);
      if (endpoint.includes('/available-slots')) {
        return {
          success: true,
          available: true,
          slots: [
            { time: '09:30 AM', isAvailable: true },
            { time: '10:00 AM', isAvailable: true },
            { time: '10:30 AM', isAvailable: true },
            { time: '11:00 AM', isAvailable: true },
            { time: '11:30 AM', isAvailable: true },
            { time: '02:00 PM', isAvailable: true },
            { time: '02:30 PM', isAvailable: true },
            { time: '03:00 PM', isAvailable: true },
            { time: '04:00 PM', isAvailable: true },
          ],
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        };
      }
      if (endpoint.includes('/status') && method === 'PUT') {
        if (doc) {
          doc.approvalStatus = body.status || 'approved';
          saveClientDb(db);
        }
        return { success: true, doctor: doc, message: 'Doctor status updated.' };
      }
      if (endpoint.includes('/availability') && method === 'PUT') {
        if (doc) {
          Object.assign(doc, body);
          saveClientDb(db);
        }
        return { success: true, doctor: doc, message: 'Availability updated.' };
      }
      return { success: true, doctor: { ...doc, hospital: db.hospitals.find((h) => h._id === doc?.hospitalId) } };
    }
  }

  // 3. Hospitals
  if (endpoint.startsWith('/hospitals')) {
    if (endpoint === '/hospitals' || endpoint.startsWith('/hospitals?')) {
      return { success: true, total: db.hospitals.length, hospitals: db.hospitals };
    }
    const hospMatch = endpoint.match(/\/hospitals\/([a-zA-Z0-9_-]+)/);
    if (hospMatch) {
      const hId = hospMatch[1];
      const hosp = db.hospitals.find((h) => h._id === hId);
      const docList = db.doctors.filter((d) => d.hospitalId === hId);
      return { success: true, hospital: { ...hosp, doctors: docList } };
    }
  }

  // 4. Appointments
  if (endpoint.startsWith('/appointments')) {
    if (endpoint === '/appointments/book' && method === 'POST') {
      const newApt: IAppointment = {
        _id: 'apt_' + Date.now(),
        tokenNumber: 'OPD-' + (db.appointments.length + 1).toString().padStart(2, '0'),
        patientId: body.patientId || localStorage.getItem('medicare_current_user_id') || 'usr_patient',
        patientName: body.patientName || 'Patient',
        patientEmail: body.patientEmail || 'patient@example.com',
        patientPhone: body.patientPhone || '+91 98765 12345',
        patientAge: Number(body.patientAge) || 28,
        patientGender: body.patientGender || 'Male',
        doctorId: body.doctorId,
        doctorName: body.doctorName || 'Specialist Doctor',
        doctorSpecialization: body.doctorSpecialization || 'General Care',
        hospitalId: body.hospitalId || 'hosp_1',
        hospitalName: body.hospitalName || 'Shakib Super Speciality Hospital',
        appointmentDate: body.appointmentDate,
        appointmentTime: body.appointmentTime,
        status: 'confirmed',
        reason: body.symptoms || body.reason || 'General medical consultation',
        consultationFee: Number(body.consultationFee) || 600,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.appointments.unshift(newApt);
      saveClientDb(db);
      return { success: true, appointment: newApt, orderId: 'order_mock_' + Date.now(), message: 'Appointment booked successfully!' };
    }
    if (endpoint === '/appointments/my' || endpoint.startsWith('/appointments/my')) {
      const currentUserId = localStorage.getItem('medicare_current_user_id');
      const filtered = currentUserId ? db.appointments.filter((a) => a.patientId === currentUserId) : db.appointments;
      return { success: true, total: filtered.length, appointments: filtered.length ? filtered : db.appointments };
    }
    if (endpoint.startsWith('/appointments/doctor')) {
      return { success: true, total: db.appointments.length, appointments: db.appointments };
    }
    if (endpoint.startsWith('/appointments/all')) {
      return { success: true, total: db.appointments.length, appointments: db.appointments };
    }
    const aptMatch = endpoint.match(/\/appointments\/([a-zA-Z0-9_-]+)/);
    if (aptMatch) {
      const aId = aptMatch[1];
      const apt = db.appointments.find((a) => a._id === aId);
      if (endpoint.includes('/cancel') && method === 'PUT') {
        if (apt) {
          apt.status = 'cancelled';
          saveClientDb(db);
        }
        return { success: true, appointment: apt, message: 'Appointment cancelled.' };
      }
      if (endpoint.includes('/status') && method === 'PUT') {
        if (apt) {
          apt.status = body.status;
          saveClientDb(db);
        }
        return { success: true, appointment: apt, message: 'Status updated.' };
      }
      return { success: true, appointment: apt };
    }
  }

  // 5. Payments
  if (endpoint.startsWith('/payments')) {
    if (endpoint === '/payments/create-order' && method === 'POST') {
      return {
        success: true,
        order: {
          id: 'order_rzp_' + Date.now(),
          amount: (body.amount || 600) * 100,
          currency: 'INR',
          keyId: db.businessSettings.razorpayKeyId || 'rzp_test_shakib_hospital_key',
        },
      };
    }
    if (endpoint === '/payments/verify' && method === 'POST') {
      const apt = db.appointments.find((a) => a._id === body.appointmentId);
      if (apt) {
        apt.paymentStatus = 'paid';
        apt.status = 'confirmed';
      }
      const newPay: IPayment = {
        _id: 'pay_' + Date.now(),
        appointmentId: body.appointmentId,
        patientId: apt?.patientId || 'usr_patient',
        patientName: apt?.patientName || 'Aman Shakib',
        amount: apt?.consultationFee || 600,
        paymentGateway: 'UPI',
        transactionId: 'TXN_' + Math.floor(100000 + Math.random() * 900000),
        orderId: 'ORD_' + Date.now(),
        status: 'paid',
        createdAt: new Date().toISOString(),
      };
      db.payments.unshift(newPay);
      saveClientDb(db);
      return { success: true, appointment: apt, payment: newPay, receiptNumber: 'REC-' + newPay.transactionId, message: 'Payment verified successfully!' };
    }
    if (endpoint === '/payments/business-settings') {
      if (method === 'PUT') {
        Object.assign(db.businessSettings, body);
        saveClientDb(db);
        return { success: true, settings: db.businessSettings, message: 'Settings saved.' };
      }
      return { success: true, settings: db.businessSettings };
    }
    if (endpoint === '/payments/my' || endpoint === '/payments/all') {
      return { success: true, total: db.payments.length, payments: db.payments };
    }
  }

  // 6. Admin
  if (endpoint.startsWith('/admin')) {
    if (endpoint === '/admin/stats') {
      const totalRev = db.payments.reduce((acc, p) => acc + (p.status === 'paid' ? p.amount : 0), 0);
      return {
        success: true,
        stats: {
          totalAppointments: db.appointments.length,
          todayAppointments: db.appointments.length,
          totalPatients: db.users.filter((u) => u.role === 'patient').length,
          totalDoctors: db.doctors.length,
          totalRevenue: totalRev,
          todayRevenue: totalRev,
          pendingApprovals: db.doctors.filter((d) => d.approvalStatus === 'pending').length,
          activeHospitals: db.hospitals.length,
        },
        charts: {
          monthlyAppointments: [
            { month: 'Jan', count: 42, revenue: 32000 },
            { month: 'Feb', count: 58, revenue: 46000 },
            { month: 'Mar', count: 75, revenue: 62000 },
          ],
          departmentDistribution: [
            { name: 'Cardiology', count: 28 },
            { name: 'Neurology', count: 20 },
            { name: 'Orthopedics', count: 18 },
            { name: 'Pediatrics', count: 14 },
          ],
        },
      };
    }
    if (endpoint.startsWith('/admin/users')) {
      return { success: true, total: db.users.length, users: db.users };
    }
    if (endpoint.startsWith('/admin/system-logs')) {
      return { success: true, total: db.systemLogs.length, logs: db.systemLogs };
    }
  }

  // 7. Notifications
  if (endpoint.startsWith('/notifications')) {
    return { success: true, total: db.notifications.length, unreadCount: 0, notifications: db.notifications };
  }

  // 8. Reviews
  if (endpoint.startsWith('/reviews')) {
    if (method === 'POST') {
      const newRev: IReview = {
        _id: 'rev_' + Date.now(),
        doctorId: body.doctorId,
        patientId: localStorage.getItem('medicare_current_user_id') || 'usr_patient',
        patientName: 'Verified Patient',
        rating: body.rating || 5,
        comment: body.comment || '',
        createdAt: new Date().toISOString(),
      };
      db.reviews.unshift(newRev);
      saveClientDb(db);
      return { success: true, review: newRev, doctorRating: 5, totalReviews: db.reviews.length, message: 'Review submitted.' };
    }
    return { success: true, total: db.reviews.length, reviews: db.reviews };
  }

  // 9. AI Symptom Checker
  if (endpoint === '/ai/symptom-checker') {
    return {
      success: true,
      assessment: {
        recommendedDepartment: 'General Medicine & Cardiology',
        urgency: 'Moderate',
        assessmentSummary: 'Based on your entered symptoms, clinical evaluation by a medical specialist is advised.',
        possibleCauses: ['General Fatigue', 'Seasonal Flu', 'Mild Musculoskeletal Tension'],
        recommendedAction: 'Schedule an OPD consultation with a verified specialist doctor at Shakib Hospital.',
        questionsForDoctor: ['Are there any preventative diagnostic tests recommended?', 'What dietary adjustments should I follow?'],
        disclaimer: 'This assessment is for informational guidance only and is not a substitute for professional medical advice.',
      },
      recommendedDoctors: db.doctors.slice(0, 3),
    };
  }

  // Default fallback
  return { success: true, message: 'Operation processed successfully.' };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return handleClientFallback(endpoint, options) as T;
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return handleClientFallback(endpoint, options) as T;
      }
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error: any) {
    if (error?.message && !error.message.includes('Invalid') && !error.message.includes('password') && !error.message.includes('suspended')) {
      try {
        return handleClientFallback(endpoint, options) as T;
      } catch (fallbackErr: any) {
        throw new Error(fallbackErr.message || error.message);
      }
    }
    throw error;
  }
}

export const api = {
  // Auth
  register: (payload: any) => request<{ success: boolean; token: string; user: IUser; doctor?: IDoctor; message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  login: (emailOrPayload: string | { email: string; password?: string }, passwordParam?: string) => {
    const payload = typeof emailOrPayload === 'string'
      ? { email: emailOrPayload, password: passwordParam }
      : emailOrPayload;
    return request<{ success: boolean; token: string; user: IUser; doctor?: IDoctor; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getMe: () => request<{ success: boolean; user: IUser; doctor?: IDoctor }>('/auth/me'),
  updateProfile: (payload: any) => request<{ success: boolean; user: IUser; doctor?: IDoctor; message: string }>('/auth/update-profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  forgotPassword: (email: string) => request<{ success: boolean; message: string; demoToken?: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  resetPassword: (payload: any) => request<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Doctors
  getDoctors: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; total: number; page: number; totalPages: number; doctors: IDoctor[] }>(`/doctors?${query}`);
  },
  getDoctorById: (id: string) => request<{ success: boolean; doctor: IDoctor & { hospital?: IHospital; recentReviews?: IReview[] } }>(`/doctors/${id}`),
  getDoctorSlots: (id: string, date: string) => request<{
    success: boolean;
    available: boolean;
    reason?: string;
    slots: { time: string; isAvailable: boolean }[];
    availableDays?: string[];
  }>(`/doctors/${id}/available-slots?date=${date}`),
  updateDoctor: (id: string, payload: any) => request<{ success: boolean; doctor: IDoctor; message: string }>(`/doctors/${id}/availability`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  updateDoctorAvailability: (id: string, payload: any) => request<{ success: boolean; doctor: IDoctor; message: string }>(`/doctors/${id}/availability`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  approveDoctor: (id: string) => request<{ success: boolean; message: string; doctor: IDoctor }>(`/doctors/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'approved' }),
  }),
  updateDoctorStatus: (id: string, status: 'approved' | 'rejected' | 'pending') => request<{ success: boolean; message: string; doctor: IDoctor }>(`/doctors/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),

  // Hospitals
  getHospitals: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ success: boolean; total: number; hospitals: IHospital[] }>(`/hospitals?${query}`);
  },
  getHospitalById: (id: string) => request<{ success: boolean; hospital: IHospital & { doctors: IDoctor[] } }>(`/hospitals/${id}`),
  createHospital: (payload: any) => request<{ success: boolean; hospital: IHospital; message: string }>('/hospitals', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  addHospital: (payload: any) => request<{ success: boolean; hospital: IHospital; message: string }>('/hospitals', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateHospital: (id: string, payload: any) => request<{ success: boolean; hospital: IHospital; message: string }>(`/hospitals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteHospital: (id: string) => request<{ success: boolean; message: string }>(`/hospitals/${id}`, {
    method: 'DELETE',
  }),

  // Appointments
  bookAppointment: (payload: any) => request<{ success: boolean; appointment: IAppointment; orderId: string; message: string }>('/appointments/book', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getMyAppointments: () => request<{ success: boolean; total: number; appointments: IAppointment[] }>('/appointments/my'),
  getDoctorAppointments: (doctorId?: string) => request<{ success: boolean; total: number; appointments: IAppointment[] }>(`/appointments/doctor${doctorId ? `?doctorId=${doctorId}` : ''}`),
  getAdminAppointments: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ success: boolean; total: number; appointments: IAppointment[] }>(`/appointments/all?${query}`);
  },
  getAllAppointments: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ success: boolean; total: number; appointments: IAppointment[] }>(`/appointments/all?${query}`);
  },
  getAppointmentById: (id: string) => request<{ success: boolean; appointment: IAppointment; doctor?: IDoctor; hospital?: IHospital; payment?: IPayment }>(`/appointments/${id}`),
  cancelAppointment: (id: string, reason?: string) => request<{ success: boolean; appointment: IAppointment; message: string }>(`/appointments/${id}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  }),
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => request<{ success: boolean; appointment: IAppointment; message: string }>(`/appointments/${id}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify({ newDate, newTime }),
  }),
  updateAppointmentStatus: (id: string, status: string) => request<{ success: boolean; appointment: IAppointment; message: string }>(`/appointments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  createPrescription: (appointmentId: string, prescription: IPrescription) => request<{ success: boolean; appointment: IAppointment; message: string }>(`/appointments/${appointmentId}/prescription`, {
    method: 'POST',
    body: JSON.stringify(prescription),
  }),

  // Payments
  createPaymentOrder: (appointmentId: string, amount: number) => request<{ success: boolean; order: any }>('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ appointmentId, amount }),
  }),
  verifyPayment: (payload: any) => request<{ success: boolean; appointment: IAppointment; payment: IPayment; message: string; receiptNumber: string }>('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getBusinessSettings: () => request<{ success: boolean; settings: any }>('/payments/business-settings'),
  updateBusinessSettings: (payload: any) => request<{ success: boolean; settings: any; message: string }>('/payments/business-settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  submitUpiProof: (payload: { appointmentId: string; utrNumber: string; payerUpiId?: string; screenshotNote?: string }) => request<{ success: boolean; message: string; appointment: IAppointment; payment: IPayment }>('/payments/submit-upi-proof', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  confirmManualPayment: (paymentId: string) => request<{ success: boolean; message: string; payment: IPayment; appointment?: IAppointment }>(`/payments/${paymentId}/confirm-manual`, {
    method: 'PUT',
  }),
  getMyPayments: () => request<{ success: boolean; total: number; payments: IPayment[] }>('/payments/my'),
  getAllPayments: () => request<{ success: boolean; total: number; payments: IPayment[] }>('/payments/all'),
  getReceiptData: (appointmentId: string) => request<{ success: boolean; receipt: any }>(`/payments/receipt/${appointmentId}`),

  // Reviews
  submitReview: (payload: { doctorId: string; appointmentId?: string; rating: number; comment: string }) => request<{ success: boolean; review: IReview; doctorRating: number; totalReviews: number; message: string }>('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getDoctorReviews: (doctorId: string) => request<{ success: boolean; total: number; reviews: IReview[] }>(`/reviews/doctor/${doctorId}`),
  getAllReviews: () => request<{ success: boolean; total: number; reviews: IReview[] }>('/reviews/all'),
  deleteReview: (id: string) => request<{ success: boolean; message: string }>(`/reviews/${id}`, {
    method: 'DELETE',
  }),

  // Notifications
  getNotifications: () => request<{ success: boolean; total: number; unreadCount: number; notifications: INotification[] }>('/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean }>('/notifications/' + id + '/read', { method: 'PUT' }),
  markAllNotificationsRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'PUT' }),

  // Admin
  getAdminStats: () => request<{ success: boolean; stats: any; charts: any }>('/admin/stats'),
  getAdminUsers: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ success: boolean; total: number; users: IUser[] }>(`/admin/users?${query}`);
  },
  updateUserStatus: (id?: string, isActive?: boolean) => request<{ success: boolean; message: string }>(`/admin/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  }),
  toggleBlockUser: (id: string) => request<{ success: boolean; isBlocked: boolean; message: string }>(`/admin/users/${id}/block`, { method: 'PUT' }),
  getSystemLogs: () => request<{ success: boolean; total: number; logs: any[] }>('/admin/system-logs'),
  getAdminInquiries: () => request<{ success: boolean; total: number; inquiries: any[] }>('/contact'),

  // Contact
  submitContact: (payload: any) => request<{ success: boolean; message: string; ticketId: string }>('/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // AI Symptom Checker
  checkSymptoms: (payload: { symptoms: string; age?: string; gender?: string; duration?: string }) => request<{
    success: boolean;
    assessment: {
      recommendedDepartment: string;
      urgency: string;
      assessmentSummary: string;
      possibleCauses: string[];
      recommendedAction: string;
      questionsForDoctor: string[];
      disclaimer: string;
    };
    recommendedDoctors: IDoctor[];
  }>('/ai/symptom-checker', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Seed Reset
  resetSeedData: () => request<{ success: boolean; message: string }>('/seed/reset', { method: 'POST' }),
};
