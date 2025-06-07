import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useLocation, useNavigate } from 'react-router-dom';
import Overview from '../components/dashboard/Overview';
import Profile from '../components/dashboard/Profile';
import BookAppointment from '../components/dashboard/BookAppointment';
import DiseasePrediction from '../components/dashboard/DiseasePrediction';
import Appointments from '@/components/dashboard/Appointments';
import HealthAssistantChat from '../components/dashboard/HealthAssistantChat';

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Handle URL parameters and state
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }

    // Check if we should open the chat
    if (location.state?.openChat) {
      setIsChatOpen(true);
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [location, navigate]);

  if (!user) {
    return <div className="container py-8 text-center">Loading...</div>;
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

