import { useState, useEffect } from 'react';
import { Activity, Calendar, Heart, Scale, Utensils, MessageSquare, Plus, Clock, Stethoscope } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { addDays, format } from 'date-fns';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DatePicker } from '../components/ui/date-picker';

import { 
  patients, 
  doctors, 
  appointments, 
  symptoms as allSymptoms, 
  predictionResults, 
  chatbotResponses 
} from '../lib';

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
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  
  const departments = [
    ...new Set(doctors.map(doctor => doctor.specialization))
  ].map(specialization => ({
    id: specialization.toLowerCase().replace(/\s+/g, '-'),
    name: specialization,
    doctors: doctors.filter(doctor => doctor.specialization === specialization)
      .map(doctor => doctor.name)
  }));

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
    } else if (!user) {
      currentPatient = patients[0];
      patientIdForAppointments = patients[0].id;
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

    setAvailableDoctors(doctors);

  }, [user]); 

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setSelectedDoctor('');
    setSelectedSlot('');
  };

  const handleDoctorChange = (value: string) => {
    setSelectedDoctor(value);
    setSelectedSlot('');
  };

  const bookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Please select a doctor, date, and time slot');
      return;
    }

    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      console.log('Booking appointment:', {
        doctorId: selectedDoctor,
        date: formattedDate,
        slot: selectedSlot
      });
      
      const newAppointment = {
        id: userAppointments.length + 1,
        patientId: userData.id,
        doctorId: doctors.find(d => d.name === selectedDoctor)?.id || 1,
        date: formattedDate,
        time: selectedSlot,
        type: 'New Patient',
        status: 'PENDING',
        doctor: selectedDoctor,
        department: selectedDepartment,
      };
      
      setUserAppointments([...userAppointments, newAppointment]);
      
      toast.success('Appointment booked successfully');
      setSelectedDepartment('');
      setSelectedDoctor('');
      setSelectedSlot('');
      setActiveTab('appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
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
      const symptomKey = selectedSymptoms.slice(0, 4).sort().join(',');
      
      const results = predictionResults[symptomKey as keyof typeof predictionResults] || 
                       predictionResults.default;
      
      setPredictions(results);
      toast.success('Disease prediction completed');
    } catch (error) {
      console.error('Error predicting disease:', error);
      toast.error('Failed to get disease prediction. Please try again.');
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

  if (!userData) {
    return <div className="container py-8 text-center">Loading patient data...</div>;
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {userData?.name?.split(' ')[0]}</h1>
          <p className="text-muted-foreground">Track your health and manage appointments</p>
        </div>
        <Button onClick={() => setShowChatbot(!showChatbot)}>
          <MessageSquare className="mr-2 h-4 w-4" />
          {showChatbot ? 'Close Chat' : 'Health Assistant'}
        </Button>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">My Appointments</TabsTrigger>
          <TabsTrigger value="book">Book Appointment</TabsTrigger>
          <TabsTrigger value="predict">Disease Prediction</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">BMI</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userData?.bmi}</div>
                <p className="text-xs text-muted-foreground">Normal weight</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">72 BPM</div>
                <p className="text-xs text-muted-foreground">Last checked 2h ago</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Steps</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8,246</div>
                <p className="text-xs text-muted-foreground">Goal: 10,000</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calories</CardTitle>
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,892</div>
                <p className="text-xs text-muted-foreground">Goal: 2,000</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your health quickly</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Button onClick={() => setActiveTab("book")} className="h-24 flex flex-col items-center justify-center space-y-2">
                  <Calendar className="h-6 w-6" />
                  <span>Book Appointment</span>
                </Button>
                <Button onClick={() => setActiveTab("predict")} variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <Stethoscope className="h-6 w-6" />
                  <span>Check Symptoms</span>
                </Button>
                <Button onClick={() => setShowChatbot(true)} variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <MessageSquare className="h-6 w-6" />
                  <span>Ask Health Assistant</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <Activity className="h-6 w-6" />
                  <span>Track Vitals</span>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled consultations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userAppointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED').length > 0 ? (
                    userAppointments
                      .filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED')
                      .map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{appointment.doctor}</p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.department}
                            </p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="mr-1 h-4 w-4" />
                              {appointment.date} at {appointment.time}
                            </div>
                          </div>
                          <Button>Join Call</Button>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No upcoming appointments</p>
                      <Button onClick={() => setActiveTab("book")} variant="outline" className="mt-4">
                        Book an Appointment
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Appointments</CardTitle>
              <CardDescription>View your appointment history</CardDescription>
            </CardHeader>
            <CardContent>
              {userAppointments.length > 0 ? (
                <div className="space-y-4">
                  {userAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{appointment.doctor}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.department}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-1 h-4 w-4" />
                          {appointment.date} at {appointment.time}
                        </div>
                      </div>
                      <div>
                        <Button 
                          variant={
                            appointment.status === 'PENDING' || appointment.status === 'CONFIRMED' 
                              ? 'default' 
                              : 'secondary'
                          }
                        >
                          {appointment.status === 'PENDING' || appointment.status === 'CONFIRMED' 
                            ? 'Join Call' 
                            : 'View Summary'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">You don't have any appointments yet</p>
                  <Button onClick={() => setActiveTab("book")} className="mt-4">
                    Book Your First Appointment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="book" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Book Appointment</CardTitle>
              <CardDescription>Schedule a consultation with our specialists</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedDepartment && (
                <div className="space-y-2">
                  <Label>Doctor</Label>
                  <Select value={selectedDoctor} onValueChange={handleDoctorChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments
                        .find((dept) => dept.name === selectedDepartment)
                        ?.doctors.map((doctor) => (
                          <SelectItem key={doctor} value={doctor}>
                            {doctor}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {selectedDoctor && (
                <>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <DatePicker
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date: Date) => date < new Date() || date > addDays(new Date(), 30)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Available Time Slots</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {getAvailableSlots().map((slot) => (
                        <Button
                          key={slot}
                          type="button"
                          variant={selectedSlot === slot ? "default" : "outline"}
                          className="flex items-center justify-center"
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          <span>{slot}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={bookAppointment}
                disabled={!selectedDoctor || !selectedDate || !selectedSlot}
              >
                Book Appointment
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="predict" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disease Prediction</CardTitle>
              <CardDescription>Input your symptoms for an initial assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Your Symptoms</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                  {allSymptoms.map((symptom) => (
                    <Button
                      key={symptom}
                      type="button"
                      variant={selectedSymptoms.includes(symptom) ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() => toggleSymptom(symptom)}
                    >
                      {selectedSymptoms.includes(symptom) ? (
                        <span className="mr-2">✓</span>
                      ) : null}
                      {symptom}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Input
                  placeholder="Add other symptom"
                  value={symptomsInput}
                  onChange={handleSymptomInput}
                />
                <Button type="button" onClick={addCustomSymptom}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {selectedSymptoms.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Symptoms</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSymptoms.map((symptom) => (
                      <div 
                        key={symptom}
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center"
                      >
                        {symptom}
                        <button 
                          className="ml-2 text-secondary-foreground/70 hover:text-secondary-foreground"
                          onClick={() => toggleSymptom(symptom)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={predictDisease}
                disabled={selectedSymptoms.length === 0}
              >
                Predict Disease
              </Button>
            </CardFooter>
          </Card>
          
          {predictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Prediction Results</CardTitle>
                <CardDescription>Based on your symptoms, these are the possible conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictions.map((result, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{result.disease}</h3>
                        <span className="text-sm">
                          {Math.round(result.probability * 100)}% match
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full"
                          style={{ width: `${result.probability * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Important Note:</p>
                  <p className="text-sm text-muted-foreground">
                    This prediction is based on machine learning algorithms and is not a definitive diagnosis. 
                    Please consult a healthcare professional for proper medical advice.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setPredictions([])}>
                  Clear Results
                </Button>
                <Button onClick={() => setActiveTab("book")}>
                  Book Doctor Appointment
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {showChatbot && (
        <div className="fixed bottom-4 right-4 w-80 md:w-96 bg-background border rounded-lg shadow-lg flex flex-col z-50">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-medium">Health Assistant</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowChatbot(false)}>
              ✕
            </Button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto h-80 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Ask me anything about your health!</p>
              </div>
            ) : (
              chatHistory.map((chat, index) => (
                <div key={index} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      chat.sender === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    {chat.message}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 border-t flex items-center space-x-2">
            <Input 
              placeholder="Type your message..." 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button size="sm" onClick={sendMessage}>
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 