import { useState, useEffect, useCallback } from 'react';
import { Activity, Calendar, Heart, Scale, Utensils, MessageSquare, Plus, Clock, Stethoscope } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { addDays } from 'date-fns';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DatePicker } from '../components/ui/date-picker';
import axios from '../lib/axios';
import Overview from '../components/dashboard/Overview';
import Profile from '../components/dashboard/Profile';
import BookAppointment from '../components/dashboard/BookAppointment';
import DiseasePrediction from '../components/dashboard/DiseasePrediction';
import Appointments from '@/components/dashboard/Appointments';
import HealthAssistantChat from '../components/dashboard/HealthAssistantChat';

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [activeTab, setActiveTab] = useState("overview");
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{message: string, sender: 'user' | 'bot'}[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<{disease: string, probability: number}[]>([]);
  const [symptomsInput, setSymptomsInput] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [userAppointments, setUserAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [chatbotResponses, setChatbotResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specializations, setSpecializations] = useState<string[]>(["Cardiology", "Neurology", "Orthopedics", "Gastroenterology", "Endocrinology"]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const departments = [
  ...new Set(doctors.map(doctor => doctor.specialization).filter(Boolean))
].map(specialization => ({
  id: specialization.toLowerCase().replace(/\s+/g, '-'),
  name: specialization,
  doctors: doctors
    .filter(doctor => doctor.specialization === specialization)
    .map(doctor => doctor.name)
}));

  const fetchAppointments = useCallback(async () => {
    try {
      const appointmentsRes = await axios.get('/user/getAppointments');
      setAppointments(appointmentsRes.data.appointments || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const fetchDoctorsBySpecialization = async (specialization: string) => {
    try {
      const res = await axios.post('/user/getDoctorsBySpecialization', { specialization });
      setDoctors(res.data.doctors || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch doctors');
      setDoctors([]);
    }
  };

  const fetchDoctorSlots = async (doctorId: string, date: Date) => {
    try {
      const res = await axios.get('/user/getDoctorSlots', { params: { doctorId, date: date.toISOString().split('T')[0] } });
      setSlots(res.data.slots || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch slots');
      setSlots([]);
    }
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setSelectedSpecialization(value);
    setSelectedDoctor('');
    setSelectedSlot('');
    setSlots([]);
    fetchDoctorsBySpecialization(value);
  };

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      const doctorObj = doctors.find((d: any) => d.name === selectedDoctor || d.id === selectedDoctor);
      if (doctorObj) {
        fetchDoctorSlots(doctorObj.id, selectedDate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctor, selectedDate]);

  const bookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Please select a doctor, date, and time slot');
      return;
    }
    try {
      const doctorObj = doctors.find((d: any) => d.name === selectedDoctor || d.id === selectedDoctor);
      if (!doctorObj) throw new Error('Doctor not found');
      const formattedDate = selectedDate.toISOString().split('T')[0];
      await axios.post('/user/bookAppointment', {
        doctorId: doctorObj.id,
        date: formattedDate,
        slot: selectedSlot.replace(/\s?(AM|PM)/, ""),
      });
      toast.success('Appointment booked successfully');
      setSelectedDepartment('');
      setSelectedDoctor('');
      setSelectedSlot('');
      setSlots([]);
      fetchAppointments();
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to book appointment. Please try again.');
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom) 
        : [...prev, symptom]
    );
  };

  const handleSymptomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymptomsInput(e.target.value);
  };

  const addCustomSymptom = () => {
    if (symptomsInput.trim() && !selectedSymptoms.includes(symptomsInput.trim())) {
      setSelectedSymptoms([...selectedSymptoms, symptomsInput.trim()]);
      setSymptomsInput('');
    }
  };

  const predictDisease = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error('Please select at least one symptom');
      return;
    }
    try {
      const response = await axios.post('/user/predict', { symptoms: selectedSymptoms });
      setPredictions(response.data.predictions || []);
      toast.success('Disease prediction completed');
    } catch (error: any) {
      console.error('Error predicting disease:', error);
      toast.error(error.response?.data?.message || 'Failed to get disease prediction. Please try again.');
    }
  };

  const findChatbotResponse = (message: string) => {
    const lowercaseMessage = message.toLowerCase();
    
    for (const pattern of chatbotResponses) {
      for (const keyword of pattern.keywords) {
        if (lowercaseMessage.includes(keyword)) {
          const responses = pattern.responses;
          return responses[Math.floor(Math.random() * responses.length)];
        }
      }
    }
        return "I'm sorry, I don't have specific information about that. Would you like to speak with a doctor? You can book an appointment from the 'Book Appointment' tab.";
  };

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    const userMessage = chatMessage.trim();
    setChatHistory([...chatHistory, { message: userMessage, sender: 'user' }]);
    setChatMessage('');
    
    setTimeout(() => {
      const botResponse = findChatbotResponse(userMessage);
      setChatHistory(prev => [...prev, { message: botResponse, sender: 'bot' }]);
    }, 1000);
  };

   const getAvailableSlots = (): string[] => {
    if (!selectedDoctor) return [];
    
    const doctor = doctors.find(d => d.name === selectedDoctor);
    if (!doctor) return [];
    
    const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
    
    const defaultSlots = ['9:00 AM', '10:30 AM', '2:00 PM', '3:30 PM'];
    
    if (!doctor.availableSlots) return defaultSlots;
    
    if (doctor.availableSlots.hasOwnProperty(formattedDate)) {
      return (doctor.availableSlots as any)[formattedDate];
    }
    
    return defaultSlots;
  };

  useEffect(() => {
    let currentPatient: any = null;
    let patientIdForAppointments: number | string | null = null;

    if (user && (user.role === 'patient' || user.role === 'user')) {
      currentPatient = {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age ?? 30, 
        gender: user.gender ?? 'male',
        height: user.height ?? 175,
        weight: user.weight ?? 70,
        bmi: user.bmi ?? 24.5,
        medicalHistory: user.medicalHistory ?? [],
        lastVisit: user.lastVisit ?? '2024-03-01',
        nextAppointment: user.nextAppointment ?? '2024-04-15'
      };
      patientIdForAppointments = user.id;
    } else {
      currentPatient = null;
      patientIdForAppointments = null;
    }

    setUserData(currentPatient);

    if (patientIdForAppointments) {
      const patientAppointments = appointments.filter(
        appointment => appointment.patientId === patientIdForAppointments
      );
      const appointmentsWithDoctors = patientAppointments.map(appointment => {
        const doctor = doctors.find(d => d.id === appointment.doctorId);
        return {
          ...appointment,
          doctor: doctor?.name || 'Unknown Doctor',
          department: doctor?.specialization || 'General',
        };
      });
      setUserAppointments(appointmentsWithDoctors);
    } else {
      setUserAppointments([]);
    }
  }, [user, appointments, doctors]);

  if (!userData) {
    return <div className="container py-8 text-center">Loading patient data...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name || "User"}</h1>
          <p className="text-muted-foreground text-lg">Track your health and manage appointments</p>
        </div>
        <Button
          className="h-12 px-6 text-base font-semibold"
          variant="default"
          onClick={() => setIsChatOpen(true)}
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          Health Assistant
        </Button>
      </div>
      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full flex bg-muted rounded-xl p-1 mb-6">
          <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-background data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-lg transition-colors">
            Overview
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex-1 data-[state=active]:bg-background data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-lg transition-colors">
            Profile
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex-1 data-[state=active]:bg-background data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-lg transition-colors">
            My Appointments
          </TabsTrigger>
          <TabsTrigger value="book" className="flex-1 data-[state=active]:bg-background data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-lg transition-colors">
            Book Appointment
          </TabsTrigger>
          <TabsTrigger value="predict" className="flex-1 data-[state=active]:bg-background data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-lg transition-colors">
            Disease Prediction
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Overview />
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Profile />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Appointments />
        </TabsContent>

        <TabsContent value="book" className="space-y-4">
          <BookAppointment />
        </TabsContent>

        <TabsContent value="predict" className="space-y-4">
          <DiseasePrediction />
        </TabsContent>
      </Tabs>
      <HealthAssistantChat open={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
} 