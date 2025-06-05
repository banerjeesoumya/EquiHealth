import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import axios from '../../lib/axios';
import Overview from '../../components/dashboard/Overview';
import Profile from '../../components/dashboard/Profile';
import BookAppointment from '../../components/dashboard/BookAppointment';
import DiseasePrediction from '../../components/dashboard/DiseasePrediction';
import Appointments from '@/components/dashboard/Appointments';
import HealthAssistantChat from '../../components/dashboard/HealthAssistantChat';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [doctorData, setDoctorData] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const appointmentsRes = await axios.get('/doctor/getAppointments');
        const appointments = appointmentsRes.data.appointments || [];
        
        // Normalize the data structure
        const normalizedAppointments = appointments.map((appointment: any) => ({
          id: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status,
          patient: {
            id: appointment.patient?.id,
            name: appointment.patient?.name,
            email: appointment.patient?.email,
            age: appointment.patient?.age,
            gender: appointment.patient?.gender,
            height: appointment.patient?.height,
            weight: appointment.patient?.weight,
            bmi: appointment.patient?.bmi,
            medicalHistory: appointment.patient?.medicalHistory,
            lastVisit: appointment.patient?.lastVisit,
            nextAppointment: appointment.patient?.nextAppointment
          }
        }));

        setDoctorData({
          ...user,
          appointments: normalizedAppointments
        });
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (!doctorData) {
    return <div className="container py-8 text-center">Loading doctor data...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Dr. {user?.name || "User"}</h1>
          <p className="text-muted-foreground text-lg">Manage your appointments and patient care</p>
        </div>
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
            Appointments
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex-1 data-[state=active]:bg-background data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-lg transition-colors">
            Set Availability
          </TabsTrigger>
          <TabsTrigger value="patients" className="flex-1 data-[state=active]:bg-background data-[state=active]:font-bold data-[state=active]:shadow-sm rounded-lg transition-colors">
            Patients
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

        <TabsContent value="availability" className="space-y-4">
          <BookAppointment />
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <DiseasePrediction />
        </TabsContent>
      </Tabs>
      <HealthAssistantChat open={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
} 