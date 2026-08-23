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
  Sparkles
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useNotifications } from '../context/NotificationContext.tsx';
import { IAppointment, IDoctor, IHospital, IUser } from '../types.ts';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useNotifications();

  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [hospitals, setHospitals] = useState<IHospital[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'doctors' | 'hospitals' | 'users' | 'inquiries'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Filter state for appointments
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [appSearch, setAppSearch] = useState('');

  // Add Hospital Modal
  const [isAddHospitalOpen, setIsAddHospitalOpen] = useState(false);
  const [newHospName, setNewHospName] = useState('');
  const [newHospCity, setNewHospCity] = useState('New Delhi');
  const [newHospAddress, setNewHospAddress] = useState('');
  const [newHospBeds, setNewHospBeds] = useState(250);
  const [newHospEmergency, setNewHospEmergency] = useState(true);
  const [newHospDepts, setNewHospDepts] = useState('Cardiology, Neurology, Orthopedics');
  const [isAddingHospital, setIsAddingHospital] = useState(false);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, appRes, docRes, hospRes, usersRes, inqRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminAppointments(),
        api.getDoctors(),
        api.getHospitals(),
        api.getAdminUsers(),
        api.getAdminInquiries(),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (appRes.success) setAppointments(appRes.appointments);
      if (docRes.success) setDoctors(docRes.doctors);
      if (hospRes.success) setHospitals(hospRes.hospitals);
      if (usersRes.success) setUsers(usersRes.users);
      if (inqRes.success) setInquiries(inqRes.inquiries || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
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
        fetchAdminData();
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
        fetchAdminData();
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to toggle doctor.', 'error');
    }
  };

  const handleUpdateAppointmentStatus = async (appId: string, newStatus: string) => {
    try {
      const res = await api.updateAppointmentStatus(appId, newStatus);
      if (res.success) {
        showToast('Status Updated', `Appointment marked as ${newStatus}.`, 'success');
        fetchAdminData();
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update appointment.', 'error');
    }
  };

  const handleToggleUserActive = async (user: IUser) => {
    try {
      const res = await api.updateUserStatus(user.id, !user.isActive);
      if (res.success) {
        showToast('User Updated', `User account ${!user.isActive ? 'activated' : 'deactivated'}.`, 'info');
        fetchAdminData();
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
        fetchAdminData();
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to create hospital.', 'error');
    } finally {
      setIsAddingHospital(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (appStatusFilter !== 'All' && a.status !== appStatusFilter) return false;
    if (appSearch) {
      const q = appSearch.toLowerCase();
      const match =
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
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
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Master Administration</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hospital verification, doctor credential auditing, system logs & financial telemetry.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddHospitalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Partner Hospital
            </button>
          </div>
        </div>

        {/* 5 Analytics Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalAppointments || appointments.length}</p>
            <span className="text-[11px] text-blue-600 font-semibold">Live appointments</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <p className="text-2xl font-black text-emerald-600">₹{stats?.totalRevenue || 12400}</p>
            <span className="text-[11px] text-emerald-600 font-semibold">Processed via Gateway</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doctors Listed</span>
            <p className="text-2xl font-black text-blue-600">{doctors.length}</p>
            <span className="text-[11px] text-blue-600 font-semibold">{doctors.filter((d) => d.isApproved).length} verified</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Partner Hospitals</span>
            <p className="text-2xl font-black text-indigo-600">{hospitals.length}</p>
            <span className="text-[11px] text-indigo-600 font-semibold">Multi-specialty centers</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Platform Users</span>
            <p className="text-2xl font-black text-purple-600">{users.length}</p>
            <span className="text-[11px] text-purple-600 font-semibold">Patients, Docs & Staff</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Queue', icon: Activity },
            { id: 'appointments', label: 'Appointments Master', icon: Calendar, count: appointments.length },
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
        )}

        {/* TAB 2: APPOINTMENTS MASTER */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            {/* Filter Strip */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between gap-3 items-center">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search patient, doctor, token..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-semibold">Status:</span>
                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Token</th>
                      <th className="p-4">Patient</th>
                      <th className="p-4">Doctor & Hospital</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Fee / Payment</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAppointments.map((app) => (
                      <tr key={app._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-4 font-mono font-bold text-blue-600">
                          #{app.queueTokenNumber || app.tokenNumber}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-900 dark:text-white">{app.patientName}</p>
                          <p className="text-[11px] text-slate-500">{app.patientPhone}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-900 dark:text-white">{app.doctorName}</p>
                          <p className="text-[11px] text-slate-500">{app.hospitalName}</p>
                        </td>
                        <td className="p-4 font-medium">
                          <p>{app.appointmentDate}</p>
                          <p className="text-slate-500">{app.appointmentTime}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold">₹{app.consultationFee}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            app.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.paymentStatus}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                            app.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            app.status === 'completed' ? 'bg-indigo-100 text-indigo-800' :
                            app.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <select
                            value={app.status}
                            onChange={(e) => handleUpdateAppointmentStatus(app._id, e.target.value)}
                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
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
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
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
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
      </div>

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
