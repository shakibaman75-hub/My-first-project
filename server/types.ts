export type UserRole = 'patient' | 'doctor' | 'admin';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  profileImage: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  city?: string;
  isBlocked: boolean;
  createdAt: string;
}

export interface IDoctor {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string;
  specialization: string;
  qualification: string;
  experience: number; // in years
  registrationNumber: string;
  hospitalId: string;
  hospitalName: string;
  consultationFee: number;
  about: string;
  languages: string[];
  availableDays: string[]; // e.g. ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  workingHours: {
    start: string; // "09:00"
    end: string;   // "18:00"
  };
  slotDurationMinutes: number; // default 30
  breakTime?: {
    start: string; // "13:00"
    end: string;   // "14:00"
  };
  rating: number;
  totalReviews: number;
  approvalStatus: 'approved' | 'pending' | 'rejected';
  featured?: boolean;
  createdAt: string;
}

export interface IHospital {
  _id: string;
  name: string;
  image: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contact: {
    phone: string;
    emergency: string;
    email: string;
  };
  departments: string[];
  facilities: string[];
  rating: number;
  totalReviews: number;
  emergency24x7: boolean;
  totalBeds?: number;
  establishedYear?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type AppointmentStatus = 'upcoming' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';

export interface IAppointment {
  _id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientGender?: string;
  patientAge?: number;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorProfileImage: string;
  hospitalId: string;
  hospitalName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // "10:30 AM"
  amount: number;
  consultationFee?: number;
  tokenNumber?: string;
  queueTokenNumber?: number | string;
  paymentStatus: PaymentStatus;
  appointmentStatus: AppointmentStatus;
  status?: AppointmentStatus;
  paymentId?: string;
  orderId?: string;
  reason: string;
  patientNotes?: string;
  consultationNotes?: string;
  prescription?: string;
  cancellationReason?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPayment {
  _id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  amount: number;
  paymentGateway: 'Razorpay' | 'Card' | 'UPI' | 'NetBanking' | 'Wallet';
  transactionId: string;
  orderId: string;
  status: PaymentStatus;
  method?: string;
  createdAt: string;
}

export interface IReview {
  _id: string;
  patientId: string;
  patientName: string;
  patientImage?: string;
  doctorId: string;
  appointmentId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'payment' | 'system' | 'cancellation' | 'doctor';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ISystemLog {
  _id: string;
  action: string;
  actor: string;
  role: string;
  details: string;
  timestamp: string;
}

export interface IBusinessSettings {
  hospitalName: string;
  businessUpiId: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  razorpayKeyId?: string;
  isLiveRazorpayConfigured?: boolean;
}
