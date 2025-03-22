import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'doctor' | 'admin';
  specialization?: string; // For doctors
  age?: number; // For users
  height?: number; // For users
  weight?: number; // For users
  gender?: 'male' | 'female' | 'other'; // For users
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: User['role']) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    role: User['role'];
    specialization?: string;
    age?: number;
    height?: number;
    weight?: number;
    gender?: 'male' | 'female' | 'other';
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create an axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token && role) {
      api.get(`/${role}/profile`)
        .then(response => {
          let userData;
          if (role === 'user') {
            userData = response.data.user;
          } else if (role === 'doctor') {
            userData = response.data.doctor;
          } else {
            userData = response.data.admin;
          }
          setUser({
            ...userData,
            role: role as User['role']
          });
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, role: User['role']) => {
    const response = await api.post(`/${role}/signin`, { email, password });
    const { token, message } = response.data;
    
    if (!token) {
      throw new Error(message || 'Failed to login');
    }
    
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
    
    // Get user profile after successful login
    const profileResponse = await api.get(`/${role}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    let userData;
    if (role === 'user') {
      userData = profileResponse.data.user;
    } else if (role === 'doctor') {
      userData = profileResponse.data.doctor;
    } else {
      userData = profileResponse.data.admin;
    }
    
    setUser({
      ...userData,
      role
    });
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
    role: User['role'];
    specialization?: string;
    age?: number;
    height?: number;
    weight?: number;
    gender?: 'male' | 'female' | 'other';
  }) => {
    const { role, ...registrationData } = userData;
    
    // Validate required fields based on role
    if (role === 'user') {
      if (!registrationData.age || !registrationData.height || !registrationData.weight || !registrationData.gender) {
        throw new Error('All fields are required for patient registration');
      }
    } else if (role === 'doctor') {
      if (!registrationData.specialization) {
        throw new Error('Specialization is required for doctor registration');
      }
    }
    
    const response = await api.post(`/${role}/signup`, registrationData);
    const { token, message } = response.data;
    
    if (!token) {
      throw new Error(message || 'Failed to register');
    }
    
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
    
    // Get user profile after successful registration
    const profileResponse = await api.get(`/${role}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    let newUserData;
    if (role === 'user') {
      newUserData = profileResponse.data.user;
    } else if (role === 'doctor') {
      newUserData = profileResponse.data.doctor;
    } else {
      newUserData = profileResponse.data.admin;
    }
    
    setUser({
      ...newUserData,
      role
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 