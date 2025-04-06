export const patients = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@example.com",
    password: "Patient123!",
    age: 35,
    gender: "male",
    height: 175, 
    weight: 75, 
    medicalHistory: ["Hypertension", "Type 2 Diabetes"],
    lastVisit: "2024-02-15",
    nextAppointment: "2024-04-10",
    bmi: 24.5,
  },
  {
    id: 2,
    name: "Emma Johnson",
    email: "emma.johnson@example.com",
    password: "Patient123!",
    age: 28,
    gender: "female",
    height: 165,
    weight: 65,
    medicalHistory: ["Asthma", "Seasonal Allergies"],
    lastVisit: "2024-03-01",
    nextAppointment: "2024-04-15",
    bmi: 23.8,
  },
  {
    id: 3,
    name: "David Brown",
    email: "david.brown@example.com",
    password: "Patient123!",
    age: 45,
    gender: "male",
    height: 180,
    weight: 90,
    medicalHistory: ["High Cholesterol", "Sleep Apnea"],
    lastVisit: "2024-03-10",
    nextAppointment: "2024-04-20",
    bmi: 27.8,
  },
  {
    id: 4,
    name: "Sophia Martinez",
    email: "sophia.martinez@example.com",
    password: "Patient123!",
    age: 32,
    gender: "female",
    height: 160,
    weight: 55,
    medicalHistory: ["Migraine", "Anxiety"],
    lastVisit: "2024-02-20",
    nextAppointment: "2024-04-25",
    bmi: 21.5,
  },
  {
    id: 5,
    name: "Michael Wilson",
    email: "michael.wilson@example.com",
    password: "Patient123!",
    age: 50,
    gender: "male",
    height: 178,
    weight: 88,
    medicalHistory: ["Arthritis", "GERD"],
    lastVisit: "2024-03-05",
    nextAppointment: "2024-04-12",
    bmi: 27.8,
  },
  {
    id: 6,
    name: "Olivia Taylor",
    email: "olivia.taylor@example.com",
    password: "Patient123!",
    age: 25,
    gender: "female",
    height: 168,
    weight: 62,
    medicalHistory: ["Iron Deficiency", "Eczema"],
    lastVisit: "2024-03-15",
    nextAppointment: "2024-04-30",
    bmi: 22.0,
  },
  {
    id: 7,
    name: "James Anderson",
    email: "james.anderson@example.com",
    password: "Patient123!",
    age: 40,
    gender: "male",
    height: 183,
    weight: 85,
    medicalHistory: ["Lower Back Pain", "Seasonal Allergies"],
    lastVisit: "2024-02-28",
    nextAppointment: "2024-04-18",
    bmi: 25.4,
  },
  {
    id: 8,
    name: "Ava Thomas",
    email: "ava.thomas@example.com",
    password: "Patient123!",
    age: 30,
    gender: "female",
    height: 170,
    weight: 68,
    medicalHistory: ["Hypothyroidism", "Migraines"],
    lastVisit: "2024-03-02",
    nextAppointment: "2024-04-22",
    bmi: 23.5,
  },
  {
    id: 9,
    name: "Robert Garcia",
    email: "robert.garcia@example.com",
    password: "Patient123!",
    age: 55,
    gender: "male",
    height: 175,
    weight: 80,
    medicalHistory: ["Coronary Heart Disease", "Type 2 Diabetes"],
    lastVisit: "2024-03-12",
    nextAppointment: "2024-04-08",
    bmi: 26.1,
  },
  {
    id: 10,
    name: "Isabella Lopez",
    email: "isabella.lopez@example.com",
    password: "Patient123!",
    age: 22,
    gender: "female",
    height: 165,
    weight: 58,
    medicalHistory: ["Polycystic Ovary Syndrome", "Anxiety"],
    lastVisit: "2024-03-20",
    nextAppointment: "2024-04-28",
    bmi: 21.3,
  },
];

export const doctors = [
  {
    id: 1,
    name: "Dr. Sarah Reynolds",
    email: "sarah.reynolds@example.com",
    password: "Doctor123!",
    specialization: "Cardiology",
    experience: 12, 
    availableSlots: {
      "2024-04-10": ["9:00 AM", "10:30 AM", "2:00 PM", "3:30 PM"],
      "2024-04-11": ["9:00 AM", "11:00 AM", "2:30 PM", "4:00 PM"],
      "2024-04-12": ["10:00 AM", "1:00 PM", "3:00 PM"],
    },
  },
  {
    id: 2,
    name: "Dr. William Chen",
    email: "william.chen@example.com",
    password: "Doctor123!",
    specialization: "Orthopedics",
    experience: 15,
    availableSlots: {
      "2024-04-11": ["9:30 AM", "11:30 AM", "2:00 PM"],
      "2024-04-12": ["10:00 AM", "1:30 PM", "3:30 PM"],
      "2024-04-15": ["9:00 AM", "11:00 AM", "2:30 PM"],
    },
  },
  {
    id: 3,
    name: "Dr. Emily Harris",
    email: "emily.harris@example.com",
    password: "Doctor123!",
    specialization: "Neurology",
    experience: 8,
    availableSlots: {
      "2024-04-10": ["10:00 AM", "1:00 PM", "3:00 PM"],
      "2024-04-12": ["9:30 AM", "11:30 AM", "2:30 PM"],
      "2024-04-15": ["10:30 AM", "1:30 PM", "4:00 PM"],
    },
  },
  {
    id: 4,
    name: "Dr. Daniel Morgan",
    email: "daniel.morgan@example.com",
    password: "Doctor123!",
    specialization: "Gastroenterology",
    experience: 10,
    availableSlots: {
      "2024-04-11": ["10:00 AM", "12:00 PM", "2:30 PM"],
      "2024-04-12": ["9:00 AM", "11:00 AM", "3:00 PM"],
      "2024-04-15": ["10:30 AM", "1:00 PM", "4:30 PM"],
    },
  },
  {
    id: 5,
    name: "Dr. Sophia Patel",
    email: "sophia.patel@example.com",
    password: "Doctor123!",
    specialization: "Endocrinology",
    experience: 9,
    availableSlots: {
      "2024-04-10": ["9:30 AM", "11:00 AM", "2:00 PM"],
      "2024-04-11": ["10:30 AM", "1:30 PM", "3:30 PM"],
      "2024-04-15": ["9:00 AM", "12:00 PM", "2:30 PM"],
    },
  },
];

export const admins = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin123!",
    role: "super_admin",
    department: "Administration",
    joinDate: "2020-01-10",
  },
  {
    id: 2,
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    password: "Admin123!",
    role: "system_admin",
    department: "IT",
    joinDate: "2021-06-15",
  },
  {
    id: 3,
    name: "Maya Rodriguez",
    email: "maya.rodriguez@example.com",
    password: "Admin123!",
    role: "department_admin",
    department: "Operations",
    joinDate: "2022-03-22",
  },
];

export const appointments = [
  {
    id: 1,
    patientId: 1,
    doctorId: 1,
    date: "2024-04-10",
    time: "9:00 AM",
    type: "Follow-up",
    status: "CONFIRMED",
    notes: "Blood pressure checkup and medication review",
  },
  {
    id: 2,
    patientId: 2,
    doctorId: 3,
    date: "2024-04-12",
    time: "9:30 AM",
    type: "New Patient",
    status: "PENDING",
    notes: "Initial consultation for recurring migraines",
  },
  {
    id: 3,
    patientId: 3,
    doctorId: 2,
    date: "2024-04-11",
    time: "9:30 AM",
    type: "Follow-up",
    status: "CONFIRMED",
    notes: "Post-surgery follow-up and physical therapy assessment",
  },
  {
    id: 4,
    patientId: 4,
    doctorId: 5,
    date: "2024-04-10",
    time: "11:00 AM",
    type: "New Patient",
    status: "CONFIRMED",
    notes: "Consultation for thyroid management",
  },
  {
    id: 5,
    patientId: 5,
    doctorId: 4,
    date: "2024-04-12",
    time: "9:00 AM",
    type: "Follow-up",
    status: "PENDING",
    notes: "GERD treatment review and new symptom assessment",
  },
  {
    id: 6,
    patientId: 6,
    doctorId: 1,
    date: "2024-04-11",
    time: "9:00 AM",
    type: "New Patient",
    status: "CONFIRMED",
    notes: "Initial heart screening and family history review",
  },
  {
    id: 7,
    patientId: 7,
    doctorId: 2,
    date: "2024-04-12",
    time: "10:00 AM",
    type: "Follow-up",
    status: "CONFIRMED",
    notes: "Lower back pain treatment progress review",
  },
  {
    id: 8,
    patientId: 8,
    doctorId: 5,
    date: "2024-04-10",
    time: "9:30 AM",
    type: "New Patient",
    status: "PENDING",
    notes: "Thyroid function assessment and medication consultation",
  },
  {
    id: 9,
    patientId: 9,
    doctorId: 1,
    date: "2024-04-10",
    time: "10:30 AM",
    type: "Follow-up",
    status: "CONFIRMED",
    notes: "Cardiac stress test results review",
  },
  {
    id: 10,
    patientId: 10,
    doctorId: 3,
    date: "2024-04-10",
    time: "10:00 AM",
    type: "Follow-up",
    status: "CONFIRMED",
    notes: "Neurological assessment for migraine management",
  },
];

export const symptoms = [
  'Fever', 'Cough', 'Fatigue', 'Headache', 'Sore Throat', 
  'Shortness of Breath', 'Body Aches', 'Nausea', 'Vomiting', 
  'Diarrhea', 'Rash', 'Joint Pain', 'Chest Pain', 'Abdominal Pain',
  'Dizziness', 'Chills', 'Loss of Appetite', 'Weight Loss',
  'Swollen Lymph Nodes', 'Vision Changes', 'Difficulty Swallowing',
  'Ear Pain', 'Runny Nose', 'Night Sweats', 'Heart Palpitations'
];

export const predictionResults = {
  "Fever,Cough,Fatigue,Headache": [
    { disease: "Common Cold", probability: 0.85 },
    { disease: "Flu", probability: 0.75 },
    { disease: "COVID-19", probability: 0.65 }
  ],
  "Chest Pain,Shortness of Breath,Fatigue": [
    { disease: "Coronary Artery Disease", probability: 0.8 },
    { disease: "Pulmonary Embolism", probability: 0.65 },
    { disease: "Anxiety", probability: 0.4 }
  ],
  "Headache,Vision Changes,Nausea": [
    { disease: "Migraine", probability: 0.9 },
    { disease: "Tension Headache", probability: 0.5 },
    { disease: "Hypertension", probability: 0.4 }
  ],
  "Abdominal Pain,Nausea,Vomiting": [
    { disease: "Gastroenteritis", probability: 0.75 },
    { disease: "Appendicitis", probability: 0.6 },
    { disease: "Food Poisoning", probability: 0.5 }
  ],
  "Joint Pain,Fatigue,Fever": [
    { disease: "Rheumatoid Arthritis", probability: 0.8 },
    { disease: "Lyme Disease", probability: 0.6 },
    { disease: "Flu", probability: 0.5 }
  ],
  "default": [
    { disease: "Common Cold", probability: 0.65 },
    { disease: "Seasonal Allergy", probability: 0.45 },
    { disease: "Stress-Related Condition", probability: 0.35 }
  ]
};

export const chatbotResponses = [
  {
    keywords: ["hello", "hi", "hey", "greetings"],
    responses: [
      "Hello! How can I help you with your health today?",
      "Hi there! I'm your health assistant. What can I do for you?",
      "Hello! I'm here to answer your health questions. How can I assist you?"
    ]
  },
  {
    keywords: ["appointment", "book", "schedule", "doctor", "visit"],
    responses: [
      "Would you like to book an appointment with a doctor? You can do this from the 'Book Appointment' tab.",
      "I can help you schedule a doctor's visit. Just go to the appointment booking section on your dashboard.",
      "Booking an appointment is easy! Head over to the booking section and select your preferred doctor and time slot."
    ]
  },
  {
    keywords: ["symptom", "sick", "ill", "pain", "hurt"],
    responses: [
      "I'm sorry to hear you're not feeling well. You can use our symptom checker in the 'Disease Prediction' tab to get an idea of what might be causing your symptoms.",
      "If you're experiencing symptoms, our disease prediction tool can help identify possible conditions based on your symptoms.",
      "For a better understanding of your symptoms, please use our disease prediction feature. Would you like me to guide you there?"
    ]
  },
  {
    keywords: ["medicine", "medication", "prescription", "drug"],
    responses: [
      "It's important to take medications as prescribed by your doctor. If you have questions about your medication, it's best to consult with your physician.",
      "I can't provide specific medication advice, but your doctor can address any concerns about your prescriptions during your next appointment.",
      "For medication-related questions, please consult your healthcare provider. Would you like to schedule an appointment?"
    ]
  },
  {
    keywords: ["thanks", "thank you", "appreciate", "helpful"],
    responses: [
      "You're welcome! I'm happy I could help. Is there anything else you'd like to know?",
      "It's my pleasure to assist you. Feel free to ask if you have any other questions.",
      "Glad I could be of assistance! Don't hesitate to reach out if you need anything else."
    ]
  },
  {
    keywords: ["bye", "goodbye", "see you", "talk later"],
    responses: [
      "Goodbye! Take care of your health and come back if you have more questions.",
      "Bye for now! Remember, I'm here 24/7 if you need health assistance.",
      "Take care! Wishing you good health until our next conversation."
    ]
  }
];

export const defaultCredentials = {
  patient: { email: "john.smith@example.com", password: "Patient123!" },
  doctor: { email: "sarah.reynolds@example.com", password: "Doctor123!" },
  admin: { email: "admin@example.com", password: "Admin123!" }
}; 