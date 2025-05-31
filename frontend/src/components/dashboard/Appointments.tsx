import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar } from 'lucide-react';
import axios from '../../lib/axios';

interface Appointment {
  id: string;
  doctor: string;
  department: string;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/user/getAppointments');
      setAppointments(response.data.appointments || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  if (loading) return <div>Loading appointments...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>All Appointments</CardTitle>
          <CardDescription>View your appointment history</CardDescription>
        </div>
        <Button variant="outline" onClick={fetchAppointments}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
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
            <Button className="mt-4">
              Book Your First Appointment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 