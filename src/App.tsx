import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';

import { Navbar } from './components/layout/Navbar.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { ToastContainer } from './components/common/ToastContainer.tsx';
import { AISymptomModal } from './components/common/AISymptomModal.tsx';

import { HomePage } from './pages/HomePage.tsx';
import { FindDoctorsPage } from './pages/FindDoctorsPage.tsx';
import { DoctorProfilePage } from './pages/DoctorProfilePage.tsx';
import { HospitalsPage } from './pages/HospitalsPage.tsx';
import { HospitalDetailPage } from './pages/HospitalDetailPage.tsx';
import { SpecializationsPage } from './pages/SpecializationsPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { PatientDashboard } from './pages/PatientDashboard.tsx';
import { DoctorDashboard } from './pages/DoctorDashboard.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';

import { Sparkles, Stethoscope } from 'lucide-react';

// Protected Route Wrapper for Patients
const PatientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Protected Route Wrapper for Doctors
const DoctorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'doctor' && user?.role !== 'admin') {
    return <Navigate to="/patient/dashboard" replace />;
  }
  return <>{children}</>;
};

// Protected Route Wrapper for Admins
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') {
    return <Navigate to="/patient/dashboard" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Navbar onOpenAIModal={() => setIsAIModalOpen(true)} />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage onOpenAIModal={() => setIsAIModalOpen(true)} />} />
          <Route path="/doctors" element={<FindDoctorsPage />} />
          <Route path="/doctors/:id" element={<DoctorProfilePage />} />
          <Route path="/hospitals" element={<HospitalsPage />} />
          <Route path="/hospitals/:id" element={<HospitalDetailPage />} />
          <Route path="/specializations" element={<SpecializationsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Protected Dashboards */}
          <Route
            path="/patient/dashboard"
            element={
              <PatientRoute>
                <PatientDashboard />
              </PatientRoute>
            }
          />
          <Route
            path="/doctor/dashboard"
            element={
              <DoctorRoute>
                <DoctorDashboard />
              </DoctorRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <ToastContainer />

      {/* Floating AI Symptom Checker Button */}
      <button
        id="floating-ai-symptom-btn"
        onClick={() => setIsAIModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black text-xs shadow-2xl shadow-teal-500/40 flex items-center gap-2 transition-all transform hover:scale-105 group border border-teal-400/30"
        title="AI Symptom Checker & Department Recommender"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">AI Symptom Assistant</span>
      </button>

      {/* AI Symptom Modal */}
      <AISymptomModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
