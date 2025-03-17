import { useState } from 'react';
import { Activity, Calendar, ClipboardList, Users, Search, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';

// Temporary data
const patients = [
  { id: 1, name: 'John Doe', age: 45, lastVisit: '2024-03-15', nextAppointment: '2024-03-22', bmi: 24.5, condition: 'Hypertension' },
  { id: 2, name: 'Jane Smith', age: 32, lastVisit: '2024-03-14', nextAppointment: '2024-03-25', bmi: 22.1, condition: 'Diabetes' },
];

const appointments = [
  { id: 1, patient: 'John Doe', time: '10:00 AM', type: 'Follow-up', status: 'upcoming' },
  { id: 2, patient: 'Jane Smith', time: '11:30 AM', type: 'New Patient', status: 'upcoming' },
  { id: 3, patient: 'Mike Johnson', time: '2:00 PM', type: 'Follow-up', status: 'completed' },
];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState('');
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome, Dr. {user?.name}</h1>
          <p className="text-muted-foreground">Manage your patients and appointments</p>
        </div>
        <Button onClick={() => setShowPrescriptionForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Prescription
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">248</div>
            <p className="text-xs text-muted-foreground">12 new this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">2 consultations left</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Consultations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.3</div>
            <p className="text-xs text-muted-foreground">Per day this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">36</div>
            <p className="text-xs text-muted-foreground">Issued this week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Patient Management</CardTitle>
            <CardDescription>View and manage your patients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search patients..." className="flex-1" />
            </div>
            <div className="space-y-4">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Age: {patient.age} | BMI: {patient.bmi}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Condition: {patient.condition}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-1 h-4 w-4" />
                      Next appointment: {patient.nextAppointment}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setSelectedPatient(patient.name)}>
                      View History
                    </Button>
                    <Button>Add Prescription</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {showPrescriptionForm && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>New Prescription</CardTitle>
              <CardDescription>Create a prescription for your patient</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.name}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Diagnosis</Label>
                <Input placeholder="Enter diagnosis" />
              </div>
              <div className="space-y-2">
                <Label>Prescription Details</Label>
                <Textarea
                  placeholder="Enter medication details, dosage, and instructions"
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  placeholder="Any additional notes or recommendations"
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowPrescriptionForm(false)}>
                Cancel
              </Button>
              <Button>Save Prescription</Button>
            </CardFooter>
          </Card>
        )}

        {selectedPatient && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Patient History - {selectedPatient}</CardTitle>
              <CardDescription>View patient's medical history and previous prescriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-2">Previous Visits</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>March 15, 2024</span>
                      <span>Regular Checkup</span>
                      <span>Dr. Smith</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>February 28, 2024</span>
                      <span>Follow-up</span>
                      <span>Dr. Smith</span>
                    </div>
                  </div>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-2">Current Medications</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Metformin 500mg - Twice daily</li>
                    <li>Lisinopril 10mg - Once daily</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Recent Test Results</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Blood Pressure</span>
                      <span>120/80 mmHg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Blood Sugar</span>
                      <span>98 mg/dL</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setSelectedPatient('')}>
                Close
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
} 