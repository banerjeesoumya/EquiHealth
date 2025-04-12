# EquiHealth - Healthcare Disease Prediction Platform

## Overview

EquiHealth is a comprehensive healthcare platform that combines modern web technologies with machine learning to predict and manage diseases. The system serves different user roles including patients, doctors, and administrators, providing tailored experiences for each.

## Features

- **User Authentication and Role Management**: Secure login and registration system with role-based access control.
- **Disease Prediction**: Advanced machine learning models to predict diseases based on symptoms.
- **Dashboard for Patients**: View health information, track predictions, and connect with doctors.
- **Dashboard for Doctors**: Manage patients, review cases, and provide medical advice.
- **Dashboard for Administrators**: Oversee platform activities and user management.
- **Responsive Design**: Fully responsive UI that works on all devices.

## Tech Stack

### Frontend
- React with TypeScript
- Vite for fast development
- React Router for navigation
- Tailwind CSS for styling
- Context API for state management

### Backend
- Hono.js framework for API development
- Prisma ORM for database interactions
- JWT for authentication
- REST API architecture

### Prediction Module
- Python-based machine learning models
- Jupyter Notebooks for model development
- Disease prediction algorithms

## Project Structure

```
EquiHealth/
├── frontend/         
├── backend/          
└── Prediction/       
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Python 3.8+ (for prediction module)

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Prediction Module Setup
```bash
cd Prediction
# Follow instructions in the DiseasePrediction notebook
```

## API Endpoints

The API is structured around three main user roles:

- `/api/v1/user` - Endpoints for patient users
- `/api/v1/doctor` - Endpoints for medical professionals
- `/api/v1/admin` - Endpoints for administrative tasks

## Deployment

### Frontend
```bash
cd frontend
npm run build
```

### Backend
```bash
cd backend
npm run deploy
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- This project was developed to improve healthcare access and early disease detection
- Thanks to all contributors
