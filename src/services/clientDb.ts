import { IUser, IDoctor, IHospital, IAppointment, IPayment, IReview, INotification, IBusinessSettings } from '../types.ts';

const LOCAL_STORAGE_KEY = 'shakib_hospital_db_v1';

export interface IClientDbData {
  users: IUser[];
  doctors: IDoctor[];
  hospitals: IHospital[];
  appointments: IAppointment[];
  payments: IPayment[];
  reviews: IReview[];
  notifications: INotification[];
  businessSettings: IBusinessSettings & {
    merchantPanGst?: string;
    isDirectUpiEnabled?: boolean;
  };
  systemLogs: any[];
}

export function getDefaultClientDb(): IClientDbData {
  const users: IUser[] = [
    {
      _id: 'usr_admin',
      name: 'Super Administrator',
      email: 'admin@example.com',
      phone: '+91 98765 00001',
      role: 'admin',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      dateOfBirth: '1985-04-12',
      gender: 'Female',
      address: 'Shakib Hospital HQ, Medical Square',
      city: 'New Delhi',
      isBlocked: false,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      _id: 'usr_patient',
      name: 'Aman Shakib',
      email: 'patient@example.com',
      phone: '+91 98765 12345',
      role: 'patient',
      profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      dateOfBirth: '2001-08-15',
      gender: 'Male',
      address: 'B-402, Sunshine Heights, Viman Nagar',
      city: 'Pune',
      isBlocked: false,
      createdAt: '2025-01-05T10:00:00.000Z',
    },
    {
      _id: 'usr_doc1',
      name: 'Dr. Rahul Sharma',
      email: 'doctor@example.com',
      phone: '+91 98111 22233',
      role: 'doctor',
      profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      dateOfBirth: '1982-06-14',
      gender: 'Male',
      address: '21 Medical Enclave, Connaught Place',
      city: 'New Delhi',
      isBlocked: false,
      createdAt: '2025-01-08T09:00:00.000Z',
    }
  ];

  const hospitals: IHospital[] = [
    {
      _id: 'hosp_1',
      name: 'Shakib Super Speciality Hospital',
      image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
      description: 'JCI and NABH accredited premier multi-speciality tertiary healthcare institution equipped with cutting-edge robotic surgery suites, 24/7 cardiac emergency unit, and comprehensive diagnostic laboratories.',
      address: '21 Medical Enclave, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi NCR',
      pincode: '110001',
      contact: {
        phone: '+91 11 2829 0200',
        emergency: '+91 11 1066',
        email: 'emergency@shakibhospital.demo',
      },
      departments: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology', 'Emergency'],
      facilities: ['24/7 Emergency & Trauma', 'Advanced ICU & NICU', 'Modular OT Suites', 'Robotic Surgery', 'In-house Pharmacy', 'Blood Bank', 'Ambulance GPS Dispatch'],
      rating: 4.9,
      totalReviews: 324,
      emergency24x7: true,
      totalBeds: 550,
      establishedYear: 1998,
      coordinates: { lat: 28.6304, lng: 77.2177 },
      createdAt: '2025-01-10T08:00:00.000Z',
    },
    {
      _id: 'hosp_2',
      name: 'Max Multi-Speciality Institute',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      description: 'World-class healthcare facility recognized for pioneering minimally invasive surgeries, organ transplant excellence, and compassionate specialized pediatric & neonatal care.',
      address: '1, 2 Press Enclave Marg, Saket',
      city: 'New Delhi',
      state: 'Delhi NCR',
      pincode: '110017',
      contact: {
        phone: '+91 11 2651 5050',
        emergency: '+91 11 4055 4055',
        email: 'care@maxsaket.demo',
      },
      departments: ['Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Gynecology', 'Dentistry'],
      facilities: ['Level 1 Trauma Center', 'PET-CT & 3T MRI', 'Cardiac Catheterization Lab', 'Digital Radiography', 'Valet Parking', 'International Patient Lounge'],
      rating: 4.8,
      totalReviews: 245,
      emergency24x7: true,
      totalBeds: 480,
      establishedYear: 1996,
      coordinates: { lat: 28.5284, lng: 77.2185 },
      createdAt: '2025-01-12T08:00:00.000Z',
    },
    {
      _id: 'hosp_3',
      name: 'Fortis Memorial Health City',
      image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=800&q=80',
      description: 'Next-generation hospital known for state-of-the-art neurosciences, orthopedic joint reconstruction, and dedicated clinical research departments.',
      address: 'Sector 44, Opposite HUDA City Centre',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      contact: {
        phone: '+91 124 496 2200',
        emergency: '+91 124 1050',
        email: 'support@fortisgurugram.demo',
      },
      departments: ['Orthopedics', 'Neurology', 'General Medicine', 'ENT', 'Pediatrics'],
      facilities: ['Dedicated Stroke Unit', 'Sports Medicine & Rehab', 'Automated Lab Systems', 'Helipad Access', 'Private Suites'],
      rating: 4.7,
      totalReviews: 189,
      emergency24x7: true,
      totalBeds: 380,
      establishedYear: 2004,
      coordinates: { lat: 28.4595, lng: 77.0725 },
      createdAt: '2025-01-15T08:00:00.000Z',
    }
  ];

  const doctors: IDoctor[] = [
    {
      _id: 'doc_1',
      userId: 'usr_doc1',
      name: 'Dr. Rahul Sharma',
      email: 'doctor@example.com',
      phone: '+91 98111 22233',
      profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      specialization: 'Cardiology',
      qualification: 'MBBS, MD (General Medicine), DM (Cardiology), FACC',
      experience: 18,
      registrationNumber: 'MCI-TN-2007-44912',
      hospitalId: 'hosp_1',
      hospitalName: 'Shakib Super Speciality Hospital',
      consultationFee: 800,
      about: 'Senior Interventional Cardiologist with over 18 years of clinical expertise in coronary angioplasty, transcatheter aortic valve implantation (TAVI), heart failure management, and preventive cardiovascular care.',
      languages: ['English', 'Hindi', 'Tamil'],
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      workingHours: { start: '09:00', end: '17:00' },
      slotDurationMinutes: 30,
      breakTime: { start: '13:00', end: '14:00' },
      rating: 4.9,
      totalReviews: 128,
      approvalStatus: 'approved',
      featured: true,
      createdAt: '2025-01-10T09:00:00.000Z',
    },
    {
      _id: 'doc_2',
      userId: 'usr_doc2',
      name: 'Dr. Ananya Iyer',
      email: 'ananya.iyer@example.com',
      phone: '+91 98222 33344',
      profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      specialization: 'Neurology',
      qualification: 'MBBS, MD (Medicine), DM (Neurology), FINR',
      experience: 14,
      registrationNumber: 'MCI-DL-2011-89321',
      hospitalId: 'hosp_1',
      hospitalName: 'Shakib Super Speciality Hospital',
      consultationFee: 900,
      about: 'Chief Neurologist specializing in acute stroke thrombolysis, epilepsy management, migraine interventions, Parkinson’s disease, and advanced neuro-immunology.',
      languages: ['English', 'Hindi', 'Malayalam'],
      availableDays: ['Monday', 'Wednesday', 'Thursday', 'Friday'],
      workingHours: { start: '10:00', end: '16:00' },
      slotDurationMinutes: 30,
      breakTime: { start: '13:00', end: '14:00' },
      rating: 4.9,
      totalReviews: 94,
      approvalStatus: 'approved',
      featured: true,
      createdAt: '2025-01-12T09:00:00.000Z',
    },
    {
      _id: 'doc_3',
      userId: 'usr_doc3',
      name: 'Dr. Vikramaditya Singh',
      email: 'vikram.singh@example.com',
      phone: '+91 98333 44455',
      profileImage: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
      specialization: 'Orthopedics',
      qualification: 'MBBS, MS (Orthopaedics), MCh (Joint Replacement)',
      experience: 16,
      registrationNumber: 'MCI-HR-2009-55104',
      hospitalId: 'hosp_2',
      hospitalName: 'Max Multi-Speciality Institute',
      consultationFee: 750,
      about: 'Renowned Orthopedic and Robotic Joint Replacement Surgeon with thousands of successful knee and hip arthroplasty procedures and sports ligament repairs.',
      languages: ['English', 'Hindi', 'Punjabi'],
      availableDays: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
      workingHours: { start: '09:30', end: '16:30' },
      slotDurationMinutes: 30,
      breakTime: { start: '13:00', end: '14:00' },
      rating: 4.8,
      totalReviews: 112,
      approvalStatus: 'approved',
      featured: true,
      createdAt: '2025-01-14T09:00:00.000Z',
    }
  ];

  const appointments: IAppointment[] = [
    {
      _id: 'apt_demo_1',
      tokenNumber: 'OPD-01',
      patientId: 'usr_patient',
      patientName: 'Aman Shakib',
      patientEmail: 'patient@example.com',
      patientPhone: '+91 98765 12345',
      patientAge: 24,
      patientGender: 'Male',
      doctorId: 'doc_1',
      doctorName: 'Dr. Rahul Sharma',
      doctorSpecialization: 'Cardiology',
      hospitalId: 'hosp_1',
      hospitalName: 'Shakib Super Speciality Hospital',
      appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      appointmentTime: '10:30 AM',
      status: 'confirmed',
      reason: 'Mild chest heaviness during exercise and routine preventive cardiac check-up.',
      consultationFee: 800,
      paymentStatus: 'paid',
      paymentId: 'pay_1001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  const payments: IPayment[] = [
    {
      _id: 'pay_1001',
      appointmentId: 'apt_demo_1',
      patientId: 'usr_patient',
      patientName: 'Aman Shakib',
      amount: 800,
      paymentGateway: 'UPI',
      transactionId: 'UTR492817294817',
      orderId: 'ORD_1001',
      status: 'paid',
      method: 'upi',
      createdAt: new Date().toISOString(),
    }
  ];

  const reviews: IReview[] = [
    {
      _id: 'rev_1',
      doctorId: 'doc_1',
      patientId: 'usr_patient',
      patientName: 'Aman Shakib',
      rating: 5,
      comment: 'Excellent diagnosis and very calming demeanor by Dr. Rahul Sharma. Explained the ECG and echo report clearly.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    }
  ];

  const notifications: INotification[] = [
    {
      _id: 'notif_1',
      userId: 'usr_admin',
      title: 'Hospital System Online',
      message: 'Shakib Hospital & OPD Booking system initialized successfully.',
      type: 'system',
      isRead: false,
      createdAt: new Date().toISOString(),
    }
  ];

  const systemLogs = [
    {
      _id: 'log_1',
      action: 'SYSTEM_BOOT',
      userName: 'Super Admin',
      userRole: 'admin',
      details: 'Shakib Hospital portal booted with all emergency & OPD modules active.',
      timestamp: new Date().toISOString(),
    }
  ];

  return {
    users,
    doctors,
    hospitals,
    appointments,
    payments,
    reviews,
    notifications,
    businessSettings: {
      hospitalName: 'Shakib Hospital',
      businessUpiId: 'shakib.hospital@okhdfcbank',
      bankName: 'HDFC Bank Ltd',
      accountHolderName: 'SHAKIB HEALTHCARE SERVICES PVT LTD',
      accountNumber: '50200049281742',
      ifscCode: 'HDFC0001024',
      branch: 'Connaught Place, New Delhi',
      razorpayKeyId: 'rzp_test_shakib_hospital_key',
      isLiveRazorpayConfigured: false,
      merchantPanGst: 'AAACM1234F1Z5',
      isDirectUpiEnabled: true,
    },
    systemLogs,
  };
}

export function loadClientDb(): IClientDbData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultClientDb();
      saveClientDb(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.users || !parsed.doctors) {
      const initial = getDefaultClientDb();
      saveClientDb(initial);
      return initial;
    }
    return parsed;
  } catch {
    const initial = getDefaultClientDb();
    saveClientDb(initial);
    return initial;
  }
}

export function saveClientDb(data: IClientDbData) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}
