export type UserRole = 'patient' | 'doctor' | 'admin';

export interface IUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  emergencyContact?: string;
  medicalHistory?: {
    allergies?: string[];
    chronicConditions?: string[];
  };
  address?: string;
  city?: string;
  isActive?: boolean;
  isBlocked?: boolean;
  createdAt: string;
}

export interface IDoctor {
  _id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  profileImage: string;
  specialization: string;
  qualification: string;
  experience: number;
  registrationNumber: string;
  hospitalId: string;
  hospitalName: string;
  consultationFee: number;
  about: string;
  languages: string[];
  availableDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  slotDurationMinutes?: number;
  breakTime?: {
    start: string;
    end: string;
  };
  rating: number;
  totalReviews: number;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  isApproved?: boolean;
  isActive?: boolean;
  featured?: boolean;
  hospital?: {
    _id: string;
    name: string;
    city: string;
    address: string;
    emergency24x7: boolean;
  };
  recentReviews?: IReview[];
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
  doctorCount?: number;
  doctors?: IDoctor[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type AppointmentStatus = 'upcoming' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';

export interface IPrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface IPrescription {
  diagnosis: string;
  symptoms?: string[];
  medicines: IPrescriptionMedicine[];
  advice?: string;
  followUpDate?: string;
}

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
  doctorSpecialization?: string;
  specialization?: string;
  doctorProfileImage?: string;
  hospitalId: string;
  hospitalName: string;
  appointmentDate: string;
  appointmentTime: string;
  amount?: number;
  consultationFee?: number;
  tokenNumber?: string;
  queueTokenNumber?: number | string;
  paymentStatus: PaymentStatus;
  status: AppointmentStatus;
  appointmentStatus?: AppointmentStatus;
  paymentId?: string;
  orderId?: string;
  reason: string;
  patientNotes?: string;
  consultationNotes?: string;
  prescription?: IPrescription | any;
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
  appointmentId?: string;
  rating: number;
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
