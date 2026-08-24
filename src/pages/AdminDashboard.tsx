import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Stethoscope,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Activity,
  FileText,
  Mail,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  X,
  Printer,
  Phone,
  MapPin,
  User,
  ChevronRight,
  Download,
  AlertTriangle,
  Landmark,
  CreditCard,
  QrCode,
  Copy,
  ExternalLink,
  HelpCircle,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useNotifications } from '../context/NotificationContext.tsx';
import { IAppointment, IDoctor, IHospital, IUser, IBusinessSettings, IPayment } from '../types.ts';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useNotifications();

  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [hospitals, setHospitals] = useState<IHospital[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'doctors' | 'hospitals' | 'users' | 'inquiries' | 'payments'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Business & Payment Settings State
  const [bizSettings, setBizSettings] = useState<IBusinessSettings>({
    hospitalName: 'MediCare Multi-Speciality Hospital',
    bankName: 'HDFC Bank Ltd',
    accountHolderName: 'MEDICARE HEALTHCARE PVT LTD',
    accountNumber: '50200049281742',
    ifscCode: 'HDFC0001024',
    branch: 'Connaught Place, New Delhi',
    businessUpiId: 'medicare.billing@okhdfcbank',
    razorpayKeyId: 'rzp_test_medicare_hospital_key',
    merchantPanGst: 'AAACM1234F1Z5',
    isDirectUpiEnabled: true,
  });
  const [isSavingBizSettings, setIsSavingBizSettings] = useState(false);
  const [allPayments, setAllPayments] = useState<IPayment[]>([]);
  const [isConfirmingPaymentId, setIsConfirmingPaymentId] = useState<string | null>(null);

  // Filter state for appointments
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [appSearch, setAppSearch] = useState('');

  // Selected appointment for detail inspection & confirmation
  const [selectedAppointment, setSelectedAppointment] = useState<IAppointment | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Reschedule modal state
  const [rescheduleApp, setRescheduleApp] = useState<IAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Reject / Cancel modal state
  const [rejectApp, setRejectApp] = useState<IAppointment | null>(null);
  const [rejectReason, setRejectReason] = useState('Doctor unavailable at requested time slot. Please choose another time.');
  const [isRejecting, setIsRejecting] = useState(false);

  // Add Hospital Modal
  const [isAddHospitalOpen, setIsAddHospitalOpen] = useState(false);
  const [newHospName, setNewHospName] = useState('');
  const [newHospCity, setNewHospCity] = useState('New Delhi');
  const [newHospAddress, setNewHospAddress] = useState('');
  const [newHospBeds, setNewHospBeds] = useState(250);
  const [newHospEmergency, setNewHospEmergency] = useState(true);
  const [newHospDepts, setNewHospDepts] = useState('Cardiology, Neurology, Orthopedics');
  const [isAddingHospital, setIsAddingHospital] = useState(false);

  const fetchAdminData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [statsRes, appRes, docRes, hospRes, usersRes, inqRes, bizRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminAppointments(),
        api.getDoctors(),
        api.getHospitals(),
        api.getAdminUsers(),
        api.getAdminInquiries(),
        api.getBusinessSettings(),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (appRes.success) setAppointments(appRes.appointments);
      if (docRes.success) setDoctors(docRes.doctors);
      if (hospRes.success) setHospitals(hospRes.hospitals);
      if (usersRes.success) setUsers(usersRes.users);
      if (inqRes.success) setInquiries(inqRes.inquiries || []);
      if (bizRes.success && bizRes.settings) setBizSettings(bizRes.settings);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSaveBusinessSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBizSettings(true);
    try {
      const res = await api.updateBusinessSettings(bizSettings);
      if (res.success) {
        showToast('Settings Saved', 'Hospital bank account & UPI receiving details updated successfully!', 'success');
      } else {
        showToast('Update Failed', res.message || 'Could not update settings', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Error saving settings', 'error');
    } finally {
      setIsSavingBizSettings(false);
    }
  };

  const handleConfirmManualPayment = async (paymentId: string) => {
    setIsConfirmingPaymentId(paymentId);
    try {
      const res = await api.confirmManualPayment(paymentId);
      if (res.success) {
        showToast('Payment Verified! 🎉', 'UTR verified and patient appointment confirmed.', 'success');
        fetchAdminData(true);
      } else {
        showToast('Confirmation Failed', res.message || 'Could not confirm payment', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Error confirming manual payment', 'error');
    } finally {
      setIsConfirmingPaymentId(null);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveDoctor = async (doctorId: string) => {
    try {
      const res = await api.approveDoctor(doctorId);
      if (res.success) {
        showToast('Doctor Approved', 'Doctor credentials verified and activated for public booking.', 'success');
        fetchAdminData(true);
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to approve doctor.', 'error');
    }
  };

  const handleToggleDoctorStatus = async (doctor: IDoctor) => {
    try {
      const res = await api.updateDoctor(doctor._id, {
        isActive: !doctor.isActive,
      });
      if (res.success) {
        showToast('Doctor Status Updated', `Doctor marked as ${!doctor.isActive ? 'Active' : 'Inactive'}.`, 'info');
        fetchAdminData(true);
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to toggle doctor.', 'error');
    }
  };

  // Direct 1-Click Confirm Slot
  const handleConfirmAppointment = async (app: IAppointment) => {
    setActionLoadingId(app._id);
    try {
      const res = await api.updateAppointmentStatus(app._id, 'confirmed');
      if (res.success) {
        showToast(
          'Slot Confirmed! ✅',
          `Appointment for ${app.patientName} with ${app.doctorName} confirmed. Token #${app.tokenNumber || app.queueTokenNumber || 'Generated'} dispatched.`,
          'success'
        );
        if (selectedAppointment && selectedAppointment._id === app._id) {
          setSelectedAppointment({ ...selectedAppointment, status: 'confirmed', appointmentStatus: 'confirmed' });
        }
        await fetchAdminData(true);
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to confirm slot.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateAppointmentStatus = async (appId: string, newStatus: string) => {
    setActionLoadingId(appId);
    try {
      const res = await api.updateAppointmentStatus(appId, newStatus);
      if (res.success) {
        showToast('Status Updated', `Appointment marked as ${newStatus}.`, 'success');
        if (selectedAppointment && selectedAppointment._id === appId) {
          setSelectedAppointment({ ...selectedAppointment, status: newStatus as any, appointmentStatus: newStatus as any });
        }
        fetchAdminData(true);
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update appointment.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reschedule Slot Submit
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleApp || !rescheduleDate || !rescheduleTime) return;

    setIsRescheduling(true);
    try {
      const res = await api.rescheduleAppointment(rescheduleApp._id, rescheduleDate, rescheduleTime);
      if (res.success) {
        showToast('Slot Rescheduled', `Appointment updated to ${rescheduleDate} at ${rescheduleTime}.`, 'success');
        setRescheduleApp(null);
        if (selectedAppointment && selectedAppointment._id === rescheduleApp._id) {
          setSelectedAppointment({
            ...selectedAppointment,
            appointmentDate: rescheduleDate,
            appointmentTime: rescheduleTime,
            status: 'confirmed',
            appointmentStatus: 'confirmed',
          });
        }
        fetchAdminData(true);
      }
    } catch (err: any) {
      showToast('Reschedule Failed', err.message || 'Slot conflict or server error.', 'error');
    } finally {
      setIsRescheduling(false);
    }
  };

  // Reject / Cancel Submit
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectApp) return;

    setIsRejecting(true);
    try {
      const res = await api.cancelAppointment(rejectApp._id, rejectReason);
      if (res.success) {
        showToast('Slot Cancelled/Declined', `Appointment for ${rejectApp.patientName} cancelled. Reason sent to patient.`, 'info');
        setRejectApp(null);
        if (selectedAppointment && selectedAppointment._id === rejectApp._id) {
          setSelectedAppointment({
            ...selectedAppointment,
            status: 'cancelled',
            appointmentStatus: 'cancelled',
            cancellationReason: rejectReason,
          });
        }
        fetchAdminData(true);
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to cancel appointment.', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleToggleUserActive = async (user: IUser) => {
    try {
      const res = await api.updateUserStatus(user.id || user._id, !user.isActive);
      if (res.success) {
        showToast('User Updated', `User account ${!user.isActive ? 'activated' : 'deactivated'}.`, 'info');
        fetchAdminData(true);
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update user.', 'error');
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospName.trim()) return;

    setIsAddingHospital(true);
    try {
      const res = await api.createHospital({
        name: newHospName.trim(),
        city: newHospCity,
        state: 'Delhi NCR',
        address: newHospAddress.trim() || `${newHospCity} Medical Square`,
        pincode: '110001',
        totalBeds: Number(newHospBeds),
        emergency24x7: newHospEmergency,
        departments: newHospDepts.split(',').map((s) => s.trim()).filter(Boolean),
        facilities: ['ICU', 'Emergency 24x7', 'Blood Bank', 'Advanced Pathology Lab', 'Pharmacy'],
        contact: { phone: '+91 11 2345 6789', email: 'info@hospital.org', emergency: '108' },
        image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=60',
        description: `${newHospName} is a state-of-the-art super-specialty hospital providing comprehensive diagnostic and surgical care.`,
      });

      if (res.success) {
        showToast('Hospital Added', 'New hospital facility added to MediCare platform.', 'success');
        setIsAddHospitalOpen(false);
        setNewHospName('');
        fetchAdminData(true);
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to create hospital.', 'error');
    } finally {
      setIsAddingHospital(false);
    }
  };

  const handlePrintSlip = (app: IAppointment) => {
    const printContent = `
      <html>
        <head>
          <title>Appointment Token Slip - #${app.tokenNumber || app.queueTokenNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #0f172a; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
            .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 12px; }
            .token-box { background: #f8fafc; border: 2px dashed #94a3b8; padding: 16px; text-align: center; margin: 16px 0; border-radius: 12px; }
            .token-num { font-size: 28px; font-weight: 900; color: #2563eb; font-family: monospace; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .label { color: #64748b; font-weight: 600; }
            .value { font-weight: bold; }
            .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0; color:#2563eb;">MediCare Hospital Management</h2>
            <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Official OPD Consultation Token & Slip</p>
          </div>
          <div class="token-box">
            <span class="badge">CONFIRMED APPOINTMENT</span>
            <div class="token-num">#${app.tokenNumber || app.queueTokenNumber || 'TK-1001'}</div>
            <div style="font-size:12px; color:#64748b; margin-top:4px;">Queue Serial: #${app.queueTokenNumber || '1'}</div>
          </div>
          <div class="row"><span class="label">Patient Name:</span><span class="value">${app.patientName}</span></div>
          <div class="row"><span class="label">Patient Phone:</span><span class="value">${app.patientPhone || '-'}</span></div>
          <div class="row"><span class="label">Doctor Assigned:</span><span class="value">${app.doctorName}</span></div>
          <div class="row"><span class="label">Hospital / Center:</span><span class="value">${app.hospitalName}</span></div>
          <div class="row"><span class="label">Appointment Date:</span><span class="value">${app.appointmentDate}</span></div>
          <div class="row"><span class="label">Time Slot:</span><span class="value">${app.appointmentTime}</span></div>
          <div class="row"><span class="label">Consultation Fee:</span><span class="value">₹${app.consultationFee || app.amount || 0} (${app.paymentStatus})</span></div>
          <div class="row"><span class="label">Reason / Symptoms:</span><span class="value">${app.reason || 'General Consultation'}</span></div>
          <div class="footer">
            <p>Please arrive at the hospital OPD desk 15 minutes before your scheduled slot time.</p>
            <p>Issued via MediCare Administration Portal • ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  const pendingAppointments = appointments.filter(
    (a) => (a.status === 'pending' || a.appointmentStatus === 'pending' || a.status === 'upcoming' || a.appointmentStatus === 'upcoming') && a.status !== 'confirmed' && a.appointmentStatus !== 'confirmed'
  );

  const filteredAppointments = appointments.filter((a) => {
    const effectiveStatus = a.appointmentStatus || a.status;
    if (appStatusFilter === 'pending') {
      if (effectiveStatus !== 'pending' && effectiveStatus !== 'upcoming') return false;
    } else if (appStatusFilter !== 'All') {
      if (effectiveStatus !== appStatusFilter) return false;
    }

    if (appSearch) {
      const q = appSearch.toLowerCase();
      const match =
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.patientPhone?.toLowerCase().includes(q) ||
        a.tokenNumber?.toLowerCase().includes(q) ||
        a.hospitalName?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Admin Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-blue-600/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Admin Management Portal</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Check and confirm patient slot bookings, manage doctors, verify credentials and monitor OPD queues.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAdminData(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              title={`Last refreshed at ${lastRefreshedAt.toLocaleTimeString()}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
            <button
              onClick={() => setIsAddHospitalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Partner Hospital
            </button>
          </div>
        </div>

        {/* PENDING SLOT APPROVAL ALERT BANNER */}
        {pendingAppointments.length > 0 && (
          <div className="p-5 rounded-3xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-700/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-amber-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  {pendingAppointments.length} New Patient Slot Booking{pendingAppointments.length > 1 ? 's' : ''} Awaiting Confirmation!
                </h3>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  Patients have selected appointment slots. Review details, check doctor availability, and confirm or reschedule their slots.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  setActiveTab('appointments');
                  setAppStatusFilter('pending');
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Check Pending Slots
              </button>
            </div>
          </div>
        )}

        {/* 5 Analytics Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div
            onClick={() => {
              setActiveTab('appointments');
              setAppStatusFilter('pending');
            }}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 cursor-pointer hover:border-amber-400 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Slots</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            </div>
            <p className="text-2xl font-black text-amber-600">{pendingAppointments.length}</p>
            <span className="text-[11px] text-amber-600 font-semibold">Needs Confirmation</span>
          </div>

          <div
            onClick={() => {
              setActiveTab('appointments');
              setAppStatusFilter('All');
            }}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 cursor-pointer hover:border-blue-400 transition-all"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalAppointments || appointments.length}</p>
            <span className="text-[11px] text-blue-600 font-semibold">Live appointments</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <p className="text-2xl font-black text-emerald-600">₹{stats?.totalRevenue || 12400}</p>
            <span className="text-[11px] text-emerald-600 font-semibold">Processed via Gateway</span>
          </div>

          <div
            onClick={() => setActiveTab('doctors')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 cursor-pointer hover:border-indigo-400 transition-all"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doctors Listed</span>
            <p className="text-2xl font-black text-indigo-600">{doctors.length}</p>
            <span className="text-[11px] text-indigo-600 font-semibold">{doctors.filter((d) => d.isApproved).length} verified</span>
          </div>

          <div
            onClick={() => setActiveTab('hospitals')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 cursor-pointer hover:border-purple-400 transition-all"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Partner Hospitals</span>
            <p className="text-2xl font-black text-purple-600">{hospitals.length}</p>
            <span className="text-[11px] text-purple-600 font-semibold">Multi-specialty centers</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto">
          {[
            { id: 'overview', label: 'Dashboard & Quick Actions', icon: Activity },
            { id: 'appointments', label: 'Slot Bookings & Confirmation', icon: Calendar, count: appointments.length },
            { id: 'payments', label: 'Bank Account & Payment Gateway', icon: Landmark },
            { id: 'doctors', label: 'Doctor Verification', icon: Stethoscope, count: doctors.filter((d) => !d.isApproved).length || undefined },
            { id: 'hospitals', label: 'Hospitals Registry', icon: Building2, count: hospitals.length },
            { id: 'users', label: 'User Directory', icon: Users, count: users.length },
            { id: 'inquiries', label: 'Contact Inquiries', icon: Mail, count: inquiries.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Slot Confirmation Queue Quick Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" /> Recent Slot Bookings to Review & Confirm
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click "Confirm Slot" to immediately notify the patient and approve the booking.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('appointments');
                    setAppStatusFilter('pending');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View All ({appointments.length}) <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {appointments.slice(0, 4).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No appointments recorded yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointments.slice(0, 4).map((app) => {
                    const isPending = (app.status === 'pending' || app.appointmentStatus === 'pending' || app.status === 'upcoming' || app.appointmentStatus === 'upcoming') && app.status !== 'confirmed' && app.appointmentStatus !== 'confirmed';
                    const isConfirmed = app.status === 'confirmed' || app.appointmentStatus === 'confirmed';

                    return (
                      <div
                        key={app._id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          isPending
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                            : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-600 text-xs">
                                #{app.tokenNumber || app.queueTokenNumber || 'TK-1001'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isConfirmed ? 'bg-emerald-100 text-emerald-800' :
                                isPending ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {isConfirmed ? 'Confirmed' : isPending ? 'Pending Approval' : (app.appointmentStatus || app.status)}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{app.patientName}</h4>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" /> {app.patientPhone || 'Phone not provided'}
                            </p>
                          </div>

                          <div className="text-right text-xs">
                            <span className="font-bold text-slate-900 dark:text-white">₹{app.consultationFee || app.amount || 0}</span>
                            <span className={`block text-[10px] font-semibold ${
                              app.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              {app.paymentStatus === 'paid' ? 'Paid Online' : 'Pay at Hospital'}
                            </span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                          <p className="font-semibold text-slate-900 dark:text-white">Dr. {app.doctorName}</p>
                          <p className="text-[11px] text-slate-500">{app.hospitalName}</p>
                          <div className="flex items-center gap-3 text-[11px] text-blue-600 font-semibold pt-1">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {app.appointmentDate}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {app.appointmentTime}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            onClick={() => setSelectedAppointment(app)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Check Details
                          </button>

                          {isPending ? (
                            <button
                              onClick={() => handleConfirmAppointment(app)}
                              disabled={actionLoadingId === app._id}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                            >
                              <Check className="w-3.5 h-3.5" /> {actionLoadingId === app._id ? 'Confirming...' : 'Confirm Slot'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePrintSlip(app)}
                              className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" /> Token Slip
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Pending Doctor Approvals */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" /> Pending Doctor Licenses
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    {doctors.filter((d) => !d.isApproved).length} Pending
                  </span>
                </div>

                {doctors.filter((d) => !d.isApproved).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    All doctor registrations are approved and verified.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {doctors
                      .filter((d) => !d.isApproved)
                      .map((doc) => (
                        <div
                          key={doc._id}
                          className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex justify-between items-center text-xs"
                        >
                          <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">{doc.name}</p>
                            <p className="text-blue-600 font-semibold">{doc.specialization} • {doc.qualification}</p>
                            <p className="text-slate-500 mt-0.5">Reg #: {doc.registrationNumber} • Fee: ₹{doc.consultationFee}</p>
                          </div>
                          <button
                            onClick={() => handleApproveDoctor(doc._id)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                          >
                            Verify & Approve
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Right: Recent Inquiries */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" /> Recent Patient Support Inquiries
                  </h3>
                  <span className="text-xs text-slate-500">{inquiries.length} Messages</span>
                </div>

                {inquiries.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No support tickets found.</div>
                ) : (
                  <div className="space-y-3">
                    {inquiries.slice(0, 4).map((inq) => (
                      <div
                        key={inq.id || inq._id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 dark:text-white">{inq.name} ({inq.email})</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(inq.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-semibold text-blue-600">{inq.subject}</p>
                        <p className="text-slate-600 dark:text-slate-400 italic">"{inq.message}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APPOINTMENTS MASTER & CONFIRMATION */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {/* Filter Strip & Quick Status Filter Chips */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search patient, phone, doctor, token..."
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => fetchAdminData(true)}
                    disabled={isRefreshing}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold text-[11px]">Filter by Status:</span>
                {[
                  { id: 'All', label: `All (${appointments.length})` },
                  { id: 'pending', label: `Pending Approval (${pendingAppointments.length})`, highlight: pendingAppointments.length > 0 },
                  { id: 'confirmed', label: `Confirmed (${appointments.filter((a) => a.status === 'confirmed' || a.appointmentStatus === 'confirmed').length})` },
                  { id: 'completed', label: `Completed (${appointments.filter((a) => a.status === 'completed' || a.appointmentStatus === 'completed').length})` },
                  { id: 'cancelled', label: `Cancelled (${appointments.filter((a) => a.status === 'cancelled' || a.appointmentStatus === 'cancelled').length})` },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setAppStatusFilter(chip.id)}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      appStatusFilter === chip.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : chip.highlight
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Token & Queue</th>
                      <th className="p-4">Patient Details</th>
                      <th className="p-4">Doctor & Hospital</th>
                      <th className="p-4">Slot Date & Time</th>
                      <th className="p-4">Fee / Payment</th>
                      <th className="p-4">Slot Status</th>
                      <th className="p-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No slot bookings matching the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((app) => {
                        const isPending = (app.status === 'pending' || app.appointmentStatus === 'pending' || app.status === 'upcoming' || app.appointmentStatus === 'upcoming') && app.status !== 'confirmed' && app.appointmentStatus !== 'confirmed';
                        const isConfirmed = app.status === 'confirmed' || app.appointmentStatus === 'confirmed';
                        const isCompleted = app.status === 'completed' || app.appointmentStatus === 'completed';
                        const isCancelled = app.status === 'cancelled' || app.appointmentStatus === 'cancelled' || app.status === 'rejected' || app.appointmentStatus === 'rejected';

                        return (
                          <tr
                            key={app._id}
                            className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                              isPending ? 'bg-amber-50/25 dark:bg-amber-950/10' : ''
                            }`}
                          >
                            <td className="p-4">
                              <span className="font-mono font-bold text-blue-600 block text-xs">
                                #{app.tokenNumber || app.queueTokenNumber || 'TK-1001'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                Queue #{app.queueTokenNumber || '1'}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-slate-900 dark:text-white">{app.patientName}</p>
                              <p className="text-[11px] text-slate-500">{app.patientPhone || app.patientEmail}</p>
                              {app.reason && (
                                <p className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5" title={app.reason}>
                                  Reason: {app.reason}
                                </p>
                              )}
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-slate-900 dark:text-white">Dr. {app.doctorName}</p>
                              <p className="text-[11px] text-slate-500">{app.hospitalName}</p>
                            </td>
                            <td className="p-4 font-medium">
                              <p className="font-semibold text-slate-900 dark:text-white">{app.appointmentDate}</p>
                              <p className="text-blue-600 font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {app.appointmentTime}
                              </p>
                            </td>
                            <td className="p-4">
                              <p className="font-bold">₹{app.consultationFee || app.amount || 0}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                app.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {app.paymentStatus === 'paid' ? 'Paid' : 'Pay at Hospital'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                                isConfirmed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                isCompleted ? 'bg-indigo-100 text-indigo-800' :
                                isCancelled ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {isConfirmed ? 'Confirmed' : isCompleted ? 'Completed' : isCancelled ? 'Cancelled' : 'Pending Approval'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Check Details Button */}
                                <button
                                  onClick={() => setSelectedAppointment(app)}
                                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1"
                                  title="Check all details of this slot booking"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Check</span>
                                </button>

                                {/* 1-Click Confirm Button if pending */}
                                {isPending && (
                                  <button
                                    onClick={() => handleConfirmAppointment(app)}
                                    disabled={actionLoadingId === app._id}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-all"
                                    title="Confirm this slot and issue token to patient"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{actionLoadingId === app._id ? '...' : 'Confirm'}</span>
                                  </button>
                                )}

                                {/* Token Slip Print */}
                                {isConfirmed && (
                                  <button
                                    onClick={() => handlePrintSlip(app)}
                                    className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                                    title="Print Token Slip"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Status dropdown */}
                                <select
                                  value={app.appointmentStatus || app.status}
                                  onChange={(e) => handleUpdateAppointmentStatus(app._id, e.target.value)}
                                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DOCTOR MANAGEMENT */}
        {activeTab === 'doctors' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Specialization</th>
                    <th className="p-4">Registration #</th>
                    <th className="p-4">Hospital</th>
                    <th className="p-4">Fee (₹)</th>
                    <th className="p-4">License Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {doctors.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={doc.profileImage}
                            alt={doc.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{doc.name}</p>
                            <p className="text-[11px] text-slate-500">{doc.qualification}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-blue-600">{doc.specialization}</td>
                      <td className="p-4 font-mono">{doc.registrationNumber}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{doc.hospitalName}</td>
                      <td className="p-4 font-bold">₹{doc.consultationFee}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          doc.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {doc.isApproved ? 'Verified' : 'Pending Verification'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {!doc.isApproved && (
                          <button
                            onClick={() => handleApproveDoctor(doc._id)}
                            className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] shadow-sm"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleDoctorStatus(doc)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold border ${
                            doc.isActive ? 'text-rose-600 border-rose-200' : 'text-emerald-600 border-emerald-200'
                          }`}
                        >
                          {doc.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: HOSPITALS REGISTRY */}
        {activeTab === 'hospitals' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hosp) => (
              <div
                key={hosp._id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{hosp.name}</h3>
                    {hosp.emergency24x7 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                        24x7 Emergency
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{hosp.address}, {hosp.city}</p>
                  <p className="text-xs text-blue-600 font-semibold">{hosp.totalBeds || 450} Beds Capacity</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {hosp.departments.slice(0, 3).map((d) => (
                      <span key={d} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px]">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-4">User Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id || u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{u.name}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{u.email}</td>
                      <td className="p-4 text-slate-500">{u.phone || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                          u.role === 'doctor' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserActive(u)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold border ${
                              u.isActive ? 'text-rose-600 border-rose-200' : 'text-emerald-600 border-emerald-200'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: INQUIRIES */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {inquiries.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                No user messages found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id || inq._id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{inq.name} ({inq.email})</h4>
                      <span className="text-[10px] text-slate-400">{new Date(inq.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="font-semibold text-blue-600">{inq.subject}</p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl">
                      "{inq.message}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: BANK ACCOUNT & PAYMENT GATEWAY SETTINGS */}
        {activeTab === 'payments' && (
          <div className="space-y-8">
            {/* How Payments Work Notice Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-blue-800/50 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                    <Landmark className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">Direct Hospital Bank Settlement & Gateway System</h3>
                    <p className="text-xs text-blue-200/90">Receive patient appointment consultation fees directly in your business bank account</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready for Production
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10 text-xs">
                <div className="space-y-1.5 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" /> Option 1: Direct Hospital UPI & QR Code (Zero Fees)
                  </p>
                  <p className="text-blue-100/90 leading-relaxed">
                    Patients scan your Hospital UPI QR or transfer via UPI ID. They submit their 12-digit UTR number. You verify and click "Approve" — funds go straight to your bank account instantly with 0% gateway commission.
                  </p>
                </div>
                <div className="space-y-1.5 bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="font-bold text-teal-300 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> Option 2: Razorpay / Gateway Integration
                  </p>
                  <p className="text-blue-100/90 leading-relaxed">
                    Add your Razorpay Key ID and Secret in Settings. Patients pay via Credit/Debit Cards, Net Banking, or UPI Auto-Checkout. Payouts are deposited into your linked bank account every T+1 days automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Account Details Form */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-indigo-600" /> Hospital Bank Account & Settlement Configuration
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    These bank details and UPI ID are shown to patients when they book appointments.
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Current UPI: <strong className="text-indigo-600">{bizSettings.businessUpiId}</strong>
                </span>
              </div>

              <form onSubmit={handleSaveBusinessSettings} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Hospital / Clinic Legal Entity Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bizSettings.hospitalName}
                      onChange={(e) => setBizSettings({ ...bizSettings, hospitalName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Official Business UPI ID (GPay / PhonePe / Paytm / BHIM) *
                    </label>
                    <input
                      type="text"
                      required
                      value={bizSettings.businessUpiId}
                      onChange={(e) => setBizSettings({ ...bizSettings, businessUpiId: e.target.value })}
                      placeholder="e.g. hospitalname@okhdfcbank"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold font-mono text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bizSettings.bankName}
                      onChange={(e) => setBizSettings({ ...bizSettings, bankName: e.target.value })}
                      placeholder="e.g. HDFC Bank, SBI, ICICI"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Account Holder Name (as per Bank Passbook) *
                    </label>
                    <input
                      type="text"
                      required
                      value={bizSettings.accountHolderName}
                      onChange={(e) => setBizSettings({ ...bizSettings, accountHolderName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Bank Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={bizSettings.accountNumber}
                      onChange={(e) => setBizSettings({ ...bizSettings, accountNumber: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Bank IFSC Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={bizSettings.ifscCode}
                      onChange={(e) => setBizSettings({ ...bizSettings, ifscCode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Bank Branch Location
                    </label>
                    <input
                      type="text"
                      value={bizSettings.branch}
                      onChange={(e) => setBizSettings({ ...bizSettings, branch: e.target.value })}
                      placeholder="e.g. Connaught Place, New Delhi"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Hospital PAN / GST Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={bizSettings.merchantPanGst || ''}
                      onChange={(e) => setBizSettings({ ...bizSettings, merchantPanGst: e.target.value.toUpperCase() })}
                      placeholder="e.g. AAACM1234F1Z5"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input
                      id="direct-upi-toggle"
                      type="checkbox"
                      checked={bizSettings.isDirectUpiEnabled}
                      onChange={(e) => setBizSettings({ ...bizSettings, isDirectUpiEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="direct-upi-toggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Enable Direct QR & UTR submission for patient appointments
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingBizSettings}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSavingBizSettings ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Bank & UPI Details</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Pending UTR Verification Queue */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-amber-500" /> Patient Manual UPI & UTR Verification Queue
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Patients who submitted a 12-digit UTR / Transaction reference for direct bank verification.
                  </p>
                </div>
              </div>

              {appointments.filter(a => a.utrNumber && (a.status === 'pending' || a.appointmentStatus === 'pending' || a.paymentStatus === 'pending' || a.paymentStatus === 'under_review')).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">All Manual Payments are Verified!</p>
                  <p className="text-slate-400 mt-1">When patients scan your UPI QR and enter a UTR number, it will show here for instant 1-click confirmation.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Patient & Doctor</th>
                        <th className="pb-3">12-Digit UTR / Ref</th>
                        <th className="pb-3">Payer UPI ID</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Appointment Date</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {appointments
                        .filter(a => a.utrNumber && (a.status === 'pending' || a.appointmentStatus === 'pending' || a.paymentStatus === 'pending' || a.paymentStatus === 'under_review'))
                        .map((app) => (
                          <tr key={app._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-3">
                              <p className="font-bold text-slate-900 dark:text-white">{app.patientName}</p>
                              <p className="text-[11px] text-slate-500">Dr. {app.doctorName}</p>
                            </td>
                            <td className="py-3">
                              <span className="font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 text-xs">
                                {app.utrNumber}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-slate-600 dark:text-slate-300 text-xs">
                              {app.upiPayerId || 'UPI App'}
                            </td>
                            <td className="py-3 font-black text-emerald-600 text-sm">
                              ₹{app.amount}
                            </td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">
                              {app.appointmentDate} at {app.appointmentTime}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                disabled={actionLoadingId === app._id}
                                onClick={() => handleConfirmAppointment(app)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 ml-auto transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{actionLoadingId === app._id ? 'Confirming...' : 'Verify & Confirm'}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Step-by-Step Hosting and Account Linking Instructions */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4 text-xs">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" /> Guide: How Payments & Hosting Work for Your Business (व्यापार के लिए खाता और होस्टिंग गाइड)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">1</div>
                  <h5 className="font-bold text-slate-900 dark:text-white">Direct Hospital Bank Settlement</h5>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    ऊपर अपने बैंक का नाम, खाता संख्या, IFSC कोड और UPI ID डालें। जब भी कोई मरीज टोकन बुक करेगा, वह सीधे आपके बैंक खाते में पैसे भेजेगा।
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">2</div>
                  <h5 className="font-bold text-slate-900 dark:text-white">Automatic Token & Slot Confirmation</h5>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    जैसे ही मरीज भुगतान करता है या आप 1-क्लिक से "Confirm" करते हैं, मरीज को लाइव कतार टोकन (Queue Token ID) और रसीद मिल जाती है।
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">3</div>
                  <h5 className="font-bold text-slate-900 dark:text-white">Production Hosting & Custom Domain</h5>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    इस वेबसाइट को Google Cloud Run, Vercel, Render या अपने कस्टम डोमेन (जैसे yourhospital.com) पर आसानी से डिप्लॉय किया जा सकता है।
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED SLOT INSPECTION & CONFIRMATION MODAL */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white">Slot Booking Verification</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      selectedAppointment.status === 'confirmed' || selectedAppointment.appointmentStatus === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedAppointment.status === 'cancelled' || selectedAppointment.appointmentStatus === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedAppointment.appointmentStatus || selectedAppointment.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Token ID: #{selectedAppointment.tokenNumber || selectedAppointment.queueTokenNumber || 'TK-1001'} • Queue Serial #{selectedAppointment.queueTokenNumber || 1}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient & Doctor Two-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Patient Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Patient Profile</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" /> {selectedAppointment.patientName}
                </p>
                <div className="space-y-1 text-slate-600 dark:text-slate-300">
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedAppointment.patientPhone || 'Not provided'}</p>
                  <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedAppointment.patientEmail}</p>
                  <p>Age / Gender: <span className="font-semibold">{selectedAppointment.patientAge || '25'} yrs, {selectedAppointment.patientGender || 'Not specified'}</span></p>
                </div>
              </div>

              {/* Doctor & Hospital Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Doctor & Facility</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-600" /> Dr. {selectedAppointment.doctorName}
                </p>
                <div className="space-y-1 text-slate-600 dark:text-slate-300">
                  <p className="font-semibold text-blue-600">{selectedAppointment.doctorSpecialization || selectedAppointment.specialization || 'Super Specialist'}</p>
                  <p className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" /> {selectedAppointment.hospitalName}</p>
                </div>
              </div>
            </div>

            {/* Appointment Schedule & Reason Box */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-xs space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Appointment Date</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-4 h-4 text-blue-600" /> {selectedAppointment.appointmentDate}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Time Slot</span>
                  <p className="text-sm font-bold text-blue-600 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-4 h-4" /> {selectedAppointment.appointmentTime}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Fee & Payment</span>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">
                    ₹{selectedAppointment.consultationFee || selectedAppointment.amount || 0} ({selectedAppointment.paymentStatus})
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Reason for Consultation / Symptoms</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  {selectedAppointment.reason || 'General Consultation & Examination'}
                </p>
              </div>

              {selectedAppointment.patientNotes && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Patient Notes / Medical Remarks</span>
                  <p className="text-slate-600 dark:text-slate-400 italic mt-0.5">"{selectedAppointment.patientNotes}"</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintSlip(selectedAppointment)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-slate-500" /> Print Token Slip
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRescheduleApp(selectedAppointment);
                    setRescheduleDate(selectedAppointment.appointmentDate);
                    setRescheduleTime(selectedAppointment.appointmentTime);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 font-bold text-xs flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" /> Reschedule Slot
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedAppointment.status !== 'cancelled' && selectedAppointment.appointmentStatus !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRejectApp(selectedAppointment);
                      setRejectReason('Doctor unavailable at requested time slot. Please choose another time.');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-xs"
                  >
                    Decline / Cancel
                  </button>
                )}

                {selectedAppointment.status !== 'confirmed' && selectedAppointment.appointmentStatus !== 'confirmed' && (
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedAppointment._id}
                    onClick={() => handleConfirmAppointment(selectedAppointment)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-4 h-4" /> {actionLoadingId === selectedAppointment._id ? 'Confirming...' : 'Confirm Slot & Dispatch Token'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE SLOT MODAL */}
      {rescheduleApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Reschedule Patient Slot
            </h3>
            <p className="text-slate-500">
              Change the scheduled date and time slot for <strong>{rescheduleApp.patientName}</strong> with <strong>Dr. {rescheduleApp.doctorName}</strong>.
            </p>

            <form onSubmit={handleRescheduleSubmit} className="space-y-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  New Appointment Date:
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  New Time Slot:
                </label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRescheduleApp(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRescheduling}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  {isRescheduling ? 'Updating...' : 'Confirm New Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT / DECLINE REASON MODAL */}
      {rejectApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Decline / Cancel Slot Request
            </h3>
            <p className="text-slate-500">
              Are you sure you want to cancel the booking for <strong>{rejectApp.patientName}</strong>? The patient will be notified with the reason.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Reason for Cancellation:
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectApp(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20"
                >
                  {isRejecting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Hospital Modal */}
      {isAddHospitalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" /> Register Partner Hospital
            </h3>

            <form onSubmit={handleCreateHospital} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Hospital Name: *
                </label>
                <input
                  type="text"
                  required
                  value={newHospName}
                  onChange={(e) => setNewHospName(e.target.value)}
                  placeholder="e.g. Apollo International Hospital"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                    City:
                  </label>
                  <select
                    value={newHospCity}
                    onChange={(e) => setNewHospCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    {['New Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Hyderabad'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Beds Capacity:
                  </label>
                  <input
                    type="number"
                    value={newHospBeds}
                    onChange={(e) => setNewHospBeds(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Full Street Address:
                </label>
                <input
                  type="text"
                  value={newHospAddress}
                  onChange={(e) => setNewHospAddress(e.target.value)}
                  placeholder="Sector 62, Institutional Area"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Clinical Departments (comma separated):
                </label>
                <input
                  type="text"
                  value={newHospDepts}
                  onChange={(e) => setNewHospDepts(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hosp-emergency"
                  checked={newHospEmergency}
                  onChange={(e) => setNewHospEmergency(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="hosp-emergency" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Includes 24x7 Critical Care / Trauma OPD
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddHospitalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingHospital}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                  {isAddingHospital ? 'Saving...' : 'Add Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
