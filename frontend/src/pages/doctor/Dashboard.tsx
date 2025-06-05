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
  const [selectedPatient, setSelectedPatient] = useState('');
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [formattedSlots, setFormattedSlots] = useState<Array<{start: string, end: string}>>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [doctorData, setDoctorData] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const toggleSlot = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const saveAvailability = async () => {
    if (!selectedDate || selectedSlots.length === 0) {
      toast.error('Please select a date and at least one time slot');
      return;
    }

    const formattedDate = selectedDate.toISOString().split('T')[0];
    const newFormattedSlots = selectedSlots.map(slot => {
      const [time, period] = slot.split(' ');
      const [hour, minute] = time.split(':');
      let hourNum = parseInt(hour);

      if (period === 'PM' && hourNum !== 12) hourNum += 12;
      else if (period === 'AM' && hourNum === 12) hourNum = 0;

      const startTime = `${hourNum.toString().padStart(2, '0')}:${minute}`;

      let endHourNum = hourNum;
      let endMinute = parseInt(minute);

      if (endMinute === 30) {
        endHourNum += 1;
        endMinute = 0;
      } else {
        endMinute = 30;
      }

      if (endHourNum === 24) endHourNum = 0;

      const endTime = `${endHourNum.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

      return { start: startTime, end: endTime };
    });

    setFormattedSlots(newFormattedSlots);

    try {
      await axios.post('/doctor/availability', {
        date: formattedDate,
        slots: newFormattedSlots
      });

      toast.success('Availability saved successfully');

      if (doctorData) {
        setDoctorData({
          ...user,
          appointments: normalizedAppointments
        });
      }

      setSelectedSlots([]);
      setFormattedSlots([]);
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability. Please try again.');
    }
  };

  const updateAppointmentStatus = async (appointmentId: number, newStatus: string) => {
    try {
      await axios.patch('/doctor/appointments/update-status', {
        appointmentId: String(appointmentId),
        stat: newStatus
      });

      setFilteredAppointments(prevAppointments =>
        prevAppointments.map(appointment =>
          appointment.id === appointmentId
            ? { ...appointment, status: newStatus }
            : appointment
        )
      );

      setAppointmentStatus({
        ...appointmentStatus,
        [appointmentId]: newStatus
      });

      toast.success(`Appointment status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status. Please try again.');
    }
  };

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Appointments</CardTitle>
                <CardDescription>View and update your appointment statuses</CardDescription>
              </div>
              <Button variant="outline" onClick={fetchData}>
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{appointment.patient}</p>
                      <p className="text-sm text-muted-foreground">{appointment.type}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-1 h-4 w-4" />
                        {appointment.date} at {appointment.time}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Select 
                        defaultValue={appointment.status}
                        onValueChange={(value) => updateAppointmentStatus(appointment.id, value)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">PENDING</SelectItem>
                          <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                          <SelectItem value="COMPLETED" disabled={(() => {
                            const now = new Date();
                            const apptDate = new Date(`${appointment.date}T${appointment.time}`);
                            return now < apptDate;
                          })()}>COMPLETED</SelectItem>
                          <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Set Your Availability</CardTitle>
              <CardDescription>Choose which time slots you're available for appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Date</Label>
                <DatePicker 
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date: Date) => date < new Date() || date > addDays(new Date(), 30)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Select Available Time Slots</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {timeSlots.map((slot, index) => (
                    <Button
                      key={`${slot}-${index}`}
                      type="button"
                      variant={selectedSlots.includes(slot) ? "default" : "outline"}
                      className="flex items-center justify-center"
                      onClick={() => toggleSlot(slot)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      <span>{slot}</span>
                      {selectedSlots.includes(slot) && <Check className="ml-2 h-4 w-4" />}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveAvailability} className="w-full">
                Save Availability
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <DiseasePrediction />
        </TabsContent>
      </Tabs>
      <HealthAssistantChat open={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
} 