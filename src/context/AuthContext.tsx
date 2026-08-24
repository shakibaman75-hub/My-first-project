import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, IDoctor, UserRole } from '../types.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: IUser | null;
  doctor: IDoctor | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  updateLocalUser: (updatedUser: IUser, updatedDoctor?: IDoctor) => void;
  updateUser: (updatedUser: IUser, updatedDoctor?: IDoctor) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [doctor, setDoctor] = useState<IDoctor | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('medicare_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('medicare_token');
    if (!storedToken) {
      setUser(null);
      setDoctor(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        setDoctor(res.doctor || null);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Session verification failed, logging out:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    if (!email?.trim() || !password) {
      throw new Error('Please provide both email/phone and password.');
    }
    setIsLoading(true);
    try {
      const res = await api.login({ email: email.trim(), password });
      if (res.success && res.token) {
        localStorage.setItem('medicare_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setDoctor(res.doctor || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      if (res.success && res.token) {
        localStorage.setItem('medicare_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setDoctor(res.doctor || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickDemoLogin = async (role: UserRole) => {
    if (role === 'patient') {
      await login('patient@example.com', 'Patient@123');
    } else if (role === 'doctor') {
      await login('doctor@example.com', 'Doctor@123');
    } else if (role === 'admin') {
      await login('admin@example.com', 'Admin@123');
    }
  };

  const logout = () => {
    localStorage.removeItem('medicare_token');
    setToken(null);
    setUser(null);
    setDoctor(null);
  };

  const updateLocalUser = (updatedUser: IUser, updatedDoctor?: IDoctor) => {
    setUser(updatedUser);
    if (updatedDoctor !== undefined) {
      setDoctor(updatedDoctor);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        doctor,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        quickDemoLogin,
        logout,
        updateLocalUser,
        updateUser: updateLocalUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
