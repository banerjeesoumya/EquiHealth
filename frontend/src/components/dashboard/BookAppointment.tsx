import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { DatePicker } from '../ui/date-picker';
import { Clock } from 'lucide-react';
import { addDays } from 'date-fns';
import { toast } from 'sonner';
import axios from '../../lib/axios';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  availableSlots?: Record<string, string[]>;
}

// Helper type guard for slot objects
function isSlotObject(slot: any): slot is { start: string; end?: string } {
  return slot && typeof slot === 'object' && 'start' in slot;
}

export default function BookAppointment() {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<(string | { start: string; end?: string })[]>([]);
  const [loading, setLoading] = useState(false);

  const departments = [
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Gastroenterology",
    "Endocrinology"
  ];

  const fetchDoctorsBySpecialization = async (specialization: string) => {
    try {
      const res = await axios.post('/user/getDoctorsBySpecialization', { specialization });
      setDoctors(res.data.doctors || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch doctors');
      setDoctors([]);
    }
  };

  const fetchDoctorSlots = async (doctorId: string, date: Date) => {
    try {
      const res = await axios.get('/user/getDoctorSlots', {
        params: { doctorId, date: date.toISOString().split('T')[0] }
      });
      setSlots(res.data.slots || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch slots');
      setSlots([]);
    }
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setSelectedDoctor('');
    setSelectedSlot('');
    setSlots([]);
    fetchDoctorsBySpecialization(value);
  };

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      const doctorObj = doctors.find(d => d.name === selectedDoctor || d.id === selectedDoctor);
      if (doctorObj) {
        fetchDoctorSlots(doctorObj.id, selectedDate);
      }
    }
  }, [selectedDoctor, selectedDate]);

  // Helper to extract start time from slot label
  const getSlotStart = (slotLabel: string) => {
    if (slotLabel.includes(' - ')) {
      return slotLabel.split(' - ')[0].trim();
    }
    return slotLabel.trim();
  };

  const bookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error('Please select a doctor, date, and time slot');
      return;
    }

    setLoading(true);
    try {
      const doctorObj = doctors.find(d => d.name === selectedDoctor || d.id === selectedDoctor);
      if (!doctorObj) throw new Error('Doctor not found');

      const formattedDate = selectedDate.toISOString().split('T')[0];
      await axios.post('/user/bookAppointment', {
        doctorId: doctorObj.id,
        date: formattedDate,
        slot: getSlotStart(selectedSlot),
      });

      toast.success('Appointment booked successfully');
      setSelectedDepartment('');
      setSelectedDoctor('');
      setSelectedSlot('');
      setSlots([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
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
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedDepartment && (
          <div className="space-y-2">
            <Label>Doctor</Label>
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.name}>
                    {doctor.name}
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
                {slots
                  .filter((slot, idx, arr) => {
                    if (typeof slot === 'string') {
                      return arr.findIndex(s => s === slot) === idx;
                    } else if (isSlotObject(slot)) {
                      return arr.findIndex(s => isSlotObject(s) && s.start === slot.start) === idx;
                    }
                    return true;
                  })
                  .length === 0 ? (
                    <div className="col-span-3 text-center text-muted-foreground py-4 w-full">No available slots left</div>
                  ) : (
                    slots
                      .filter((slot, idx, arr) => {
                        if (typeof slot === 'string') {
                          return arr.findIndex(s => s === slot) === idx;
                        } else if (isSlotObject(slot)) {
                          return arr.findIndex(s => isSlotObject(s) && s.start === slot.start) === idx;
                        }
                        return true;
                      })
                      .map((slot) => {
                        let slotLabel = '';
                        let slotValue = '';
                        let isDisabled = false;
                        if (typeof slot === 'string') {
                          slotLabel = slot;
                          slotValue = slot;
                          isDisabled = slot.toLowerCase().includes('booked');
                        } else if (isSlotObject(slot)) {
                          slotLabel = slot.start + (slot.end ? ` - ${slot.end}` : '');
                          slotValue = slot.start;
                        }
                        return (
                          <Button
                            key={slotValue}
                            type="button"
                            variant={selectedSlot === slotValue ? "default" : "outline"}
                            className="flex items-center justify-center"
                            onClick={() => setSelectedSlot(slotValue)}
                            disabled={isDisabled}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            <span>{slotLabel}</span>
                          </Button>
                        );
                      })
                  )}
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={bookAppointment}
          disabled={!selectedDoctor || !selectedDate || !selectedSlot || loading}
        >
          {loading ? 'Booking...' : 'Book Appointment'}
        </Button>
      </CardFooter>
    </Card>
  );
}