import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Import mock data
import { patients, doctors, admins } from '../lib';

interface User {
  id: string | number;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin' | 'user';
  specialization?: string; // For doctors
  age?: number; // For patients
  height?: number; // For patients
  weight?: number; // For patients
  gender?: string; // For patients
  medicalHistory?: string[];
  lastVisit?: string;
  nextAppointment?: string;
  bmi?: number;
  experience?: number; // For doctors
  availableSlots?: Record<string, string[]>; // For doctors
  department?: string; // For admins
  joinDate?: string; // For admins
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
    gender?: string;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const userJson = localStorage.getItem('user');
    const role = localStorage.getItem('userRole');
    if (userJson && role) {
      try {
        const userData = JSON.parse(userJson);
        setUser({
          ...userData,
          role: role as User['role']
        });
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: User['role']) => {
    // Mock authentication logic using our mock data
    let userData = null;
    
    // Convert 'user' role to 'patient' for consistency with our data model
    const dataRole = role === 'user' ? 'patient' : role;
    
    if (dataRole === 'patient') {
      userData = patients.find(
        patient => patient.email === email && patient.password === password
      );
    } else if (dataRole === 'doctor') {
      const foundDoctor = doctors.find(
        doctor => doctor.email === email && doctor.password === password
      );
      
      if (foundDoctor) {
        const slots: Record<string, string[]> = {};
        if (foundDoctor.availableSlots) {
          Object.entries(foundDoctor.availableSlots).forEach(([date, timeSlots]) => {
            if (Array.isArray(timeSlots)) {
              slots[date] = timeSlots;
            }
          });
        }

        userData = {
          id: foundDoctor.id,
          name: foundDoctor.name,
          email: foundDoctor.email,
          password: foundDoctor.password,
          specialization: foundDoctor.specialization,
          experience: foundDoctor.experience,
          availableSlots: slots,
          role: 'doctor'
        };
      }
    } else if (dataRole === 'admin') {
      userData = admins.find(
        admin => admin.email === email && admin.password === password
      );
    }
    
    if (!userData) {
      throw new Error('Invalid email or password');
    }
    
    const { password: _, ...userWithoutPassword } = userData;
    
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    localStorage.setItem('userRole', dataRole);
    
    setUser({...userWithoutPassword, role: dataRole} as User);
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
    gender?: string;
  }) => {
    
    const { role, ...registrationData } = userData;
    
    const dataRole = role === 'user' ? 'patient' : role;
    
    if (dataRole === 'patient') {
      if (!registrationData.age || !registrationData.height || !registrationData.weight || !registrationData.gender) {
        throw new Error('All fields are required for patient registration');
      }
    } else if (dataRole === 'doctor') {
      if (!registrationData.specialization) {
        throw new Error('Specialization is required for doctor registration');
      }
    }
    
    const newUser = {
      id: Date.now(), 
      ...registrationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    localStorage.setItem('userRole', dataRole);
    
    setUser({
      ...userWithoutPassword,
      role
    } as User);
  };

  const logout = () => {
    localStorage.removeItem('user');
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