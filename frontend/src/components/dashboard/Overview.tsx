import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Activity, Calendar, Heart, Scale, Plus, Clock, MessageSquare, Stethoscope } from 'lucide-react';
import { Button } from '../ui/button';

export default function Overview() {
  const { user } = useAuth();

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BMI</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.bmi?.toFixed(1) ?? 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {user.bmi ? (user.bmi < 18.5 ? 'Underweight' : user.bmi < 25 ? 'Normal' : 'Overweight') : 'Not calculated'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.nextAppointment ? new Date(user.nextAppointment).toLocaleDateString() : 'No upcoming'}
            </div>
            <p className="text-xs text-muted-foreground">
              {user.nextAppointment ? 'Scheduled' : 'No appointments scheduled'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.medicalHistory?.length ? 'Active' : 'Good'}
            </div>
            <p className="text-xs text-muted-foreground">
              {user.medicalHistory?.length ? `${user.medicalHistory.length} conditions` : 'No medical conditions'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Visit</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user.lastVisit ? new Date(user.lastVisit).toLocaleDateString() : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {user.lastVisit ? 'Last checkup' : 'No previous visits'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your health quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button className="h-20 flex flex-col items-center justify-center text-base font-semibold" variant="default">
                <Calendar className="mb-2 h-6 w-6" />
                Book Appointment
              </Button>
              <Button className="h-20 flex flex-col items-center justify-center text-base font-semibold" variant="outline">
                <Stethoscope className="mb-2 h-6 w-6" />
                Check Symptoms
              </Button>
              <Button className="h-20 flex flex-col items-center justify-center text-base font-semibold" variant="outline">
                <MessageSquare className="mb-2 h-6 w-6" />
                Ask Health Assistant
              </Button>
              <Button className="h-20 flex flex-col items-center justify-center text-base font-semibold" variant="outline">
                <Activity className="mb-2 h-6 w-6" />
                Track Vitals
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {user.nextAppointment ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Next Appointment</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.nextAppointment).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {user.lastVisit && (
                  <div className="flex items-center space-x-4">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium">Last Checkup</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.lastVisit).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No upcoming appointments</p>
                <Button className="mt-2" variant="outline">
                  Book Appointment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 