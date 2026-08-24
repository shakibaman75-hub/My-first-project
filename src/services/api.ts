import { IUser, IDoctor, IHospital, IAppointment, IPayment, IReview, INotification, IPrescription } from '../types.ts';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('medicare_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Server communication error.' }));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
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
