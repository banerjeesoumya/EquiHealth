import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  MessageCircle, 
  Activity, 
  Headphones, 
  Trophy, 
  BookOpen, 
  Users, 
  ClipboardList, 
  AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const MentalHealth: React.FC = () => {
  const navigate = useNavigate();
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  const features: FeatureCard[] = [
    {
      title: "AI Chat Support",
      description: "Talk to our empathetic AI assistant for immediate support and guidance",
      icon: <MessageCircle className="w-8 h-8" />,
      path: "/mental-health/chat"
    },
    {
      title: "Mood Tracker",
      description: "Track your daily mood, sleep, and stress levels with beautiful visualizations",
      icon: <Activity className="w-8 h-8" />,
      path: "/mental-health/mood-tracker"
    },
    {
      title: "Guided Exercises",
      description: "Access mindfulness and meditation sessions for stress relief",
      icon: <Headphones className="w-8 h-8" />,
      path: "/mental-health/exercises"
    },
    {
      title: "Wellness Challenges",
      description: "Join fun challenges to build healthy habits and earn rewards",
      icon: <Trophy className="w-8 h-8" />,
      path: "/mental-health/challenges"
    },
    {
      title: "Smart Journal",
      description: "Express yourself with our AI-powered journaling experience",
      icon: <BookOpen className="w-8 h-8" />,
      path: "/mental-health/journal"
    },
    {
      title: "Community Support",
      description: "Connect with others in a safe, moderated space",
      icon: <Users className="w-8 h-8" />,
      path: "/mental-health/community"
    },
    {
      title: "Self Assessment",
      description: "Take clinically validated assessments for anxiety and depression",
      icon: <ClipboardList className="w-8 h-8" />,
      path: "/mental-health/assessment"
    }
  ];

  const handleFeatureClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="mb-8"
      >
        <motion.div
          variants={fadeIn}
          className="flex items-center gap-4 mb-4"
        >
          <Brain className="w-12 h-12 text-primary" />
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Mental Health Hub
          </h1>
        </motion.div>
        <motion.p
          variants={fadeIn}
          className="text-xl text-muted-foreground max-w-3xl"
        >
          Your personal space for mental wellness. Explore tools, track your progress, and find support.
        </motion.p>
      </motion.div>

      {/* Crisis Support Button */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="mb-8"
      >
        <Button
          onClick={() => navigate('/mental-health/crisis-support')}
          variant="outline"
          className="w-full border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 p-4 rounded-lg flex items-center justify-center gap-3"
        >
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Need Immediate Support?</span>
        </Button>
      </motion.div>

      {/* Feature Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            variants={fadeIn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className="h-full cursor-pointer transition-all hover:shadow-lg"
              onClick={() => handleFeatureClick(feature.path)}
            >
              <CardHeader>
                <div className="text-primary mb-2">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default MentalHealth;