import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import axios from '../../lib/axios';

interface Prediction {
  disease: string;
  probability: number;
}

export default function DiseasePrediction() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomsInput, setSymptomsInput] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);

  const symptoms = [
    "Fever",
    "Cough",
    "Headache",
    "Fatigue",
    "Nausea",
    "Dizziness",
    "Chest Pain",
    "Shortness of Breath",
    "Muscle Pain",
    "Loss of Taste",
    "Loss of Smell",
    "Sore Throat",
    "Runny Nose",
    "Diarrhea",
    "Vomiting"
  ];

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

    setLoading(true);
    try {
      const response = await axios.post('/user/predict', { symptoms: selectedSymptoms });
      setPredictions(response.data.predictions || []);
      toast.success('Disease prediction completed');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get disease prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Disease Prediction</CardTitle>
          <CardDescription>Input your symptoms for an initial assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Your Symptoms</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
              {symptoms.map((symptom) => (
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
            disabled={selectedSymptoms.length === 0 || loading}
          >
            {loading ? 'Predicting...' : 'Predict Disease'}
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
            <Button>
              Book Doctor Appointment
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 