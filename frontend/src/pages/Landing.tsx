import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Activity, Heart, Users, Calendar, Shield, Stethoscope, Star, ArrowRight, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { heroImage, doctorImage, mobileAppImage, avatars } from '../assets/images';
import { useRef, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.5 } }
};

function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`bg-muted flex items-center justify-center ${className}`}>
      <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
    </div>
  );
}

function AvatarPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`bg-muted rounded-full flex items-center justify-center ${className}`}>
      <Users className="w-6 h-6 text-muted-foreground/50" />
    </div>
  );
}

export default function Landing() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div ref={containerRef} className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <motion.div
          style={{ y, opacity }}
          className="absolute inset-0 -z-10 after:content-[''] after:absolute after:inset-0 after:bg-background/30"
        >
          <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
        </motion.div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="container mx-auto max-w-6xl relative z-10"
        >
          <motion.h1
            variants={fadeIn}
            className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
          >
            Your Health, Our Priority
          </motion.h1>
          <motion.p
            variants={fadeIn}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto"
          >
            Experience modern healthcare management with real-time tracking, instant doctor consultations, and personalized health insights.
          </motion.p>
          <motion.div
            variants={fadeIn}
            className="flex gap-4 justify-center"
          >
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 group">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </motion.div>
          <motion.div variants={fadeIn} className="mt-12 rounded-xl shadow-2xl max-w-4xl mx-auto overflow-hidden bg-background/80 backdrop-blur-sm">
            <img 
              src="https://images.unsplash.com/photo-1581056771107-24ca5f033842?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=675&q=80" 
              alt="Healthcare Dashboard Preview" 
              className="w-full aspect-[16/9] object-cover" 
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section with Counter Animation */}
      <section className="py-16 bg-primary/5">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="container mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { number: 10000, label: "Active Users", prefix: "+" },
            { number: 500, label: "Expert Doctors", prefix: "+" },
            { number: 98, label: "Success Rate", suffix: "%" },
            { number: 24, label: "Support", suffix: "/7" }
          ].map((stat, index) => (
            <CounterCard key={index} {...stat} />
          ))}
        </motion.div>
      </section>

      {/* Features Section with Hover Effects */}
      <section className="py-20 px-4 bg-background">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="container mx-auto max-w-6xl"
        >
          <motion.h2
            variants={fadeIn}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            Why Choose EquiHealth?
          </motion.h2>
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                {...feature}
                isHovered={hoveredCard === index}
                onHover={() => setHoveredCard(index)}
                onLeave={() => setHoveredCard(null)}
              />
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Mobile App Section with Interactive Demo */}
      <section className="py-20 px-4 bg-muted/30">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="container mx-auto max-w-6xl"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeIn} className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Take Control of Your Health
              </h2>
              <p className="text-xl text-muted-foreground">
                Access your health records, schedule appointments, and track your progress anywhere, anytime with our mobile app.
              </p>
              <motion.ul className="space-y-4">
                {[
                  "Real-time health monitoring",
                  "Instant doctor consultations",
                  "Medication reminders",
                  "Progress tracking"
                ].map((feature, index) => (
                  <motion.li
                    key={index}
                    variants={scaleIn}
                    className="flex items-center gap-2"
                    whileHover={{ x: 10 }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
            <motion.div
              variants={fadeIn}
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={mobileAppImage}
                alt="Mobile app interface"
                className="rounded-xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent rounded-xl" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section with Carousel */}
      <section className="py-20 px-4 bg-background">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="container mx-auto max-w-6xl"
        >
          <motion.div variants={fadeIn} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of satisfied users who have transformed their healthcare journey
            </p>
          </motion.div>
          <TestimonialCarousel testimonials={testimonials} />
        </motion.div>
      </section>

      {/* Doctor Section with Parallax */}
      <section className="py-20 px-4 bg-muted relative overflow-hidden">
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", "30%"]) }}
          className="absolute inset-0 -z-10 after:content-[''] after:absolute after:inset-0 after:bg-background/40"
        >
          <img src={doctorImage} alt="" className="w-full h-full object-cover opacity-20" />
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="container mx-auto max-w-6xl relative z-10"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeIn} className="overflow-hidden rounded-xl shadow-2xl bg-background/90 backdrop-blur-sm">
              <img 
                src={doctorImage} 
                alt="Professional Doctor" 
                className="w-full h-auto object-cover" 
              />
            </motion.div>
            <motion.div variants={fadeIn} className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Connect with Expert Doctors
              </h2>
              <p className="text-xl text-muted-foreground">
                Get access to qualified medical professionals across various specialties. Secure and confidential consultations tailored to your needs.
              </p>
              <Button size="lg" asChild className="group">
                <Link to="/register">
                  Find a Doctor
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section with Floating Elements */}
      <section className="py-20 px-4 bg-primary/5 relative overflow-hidden">
        <FloatingElements />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="container mx-auto max-w-4xl text-center relative z-10"
        >
          <motion.h2
            variants={fadeIn}
            className="text-3xl md:text-4xl font-bold mb-6"
          >
            Start Your Health Journey Today
          </motion.h2>
          <motion.p
            variants={fadeIn}
            className="text-xl text-muted-foreground mb-8"
          >
            Join thousands of users who trust EquiHealth for their healthcare needs.
          </motion.p>
          <motion.div variants={fadeIn}>
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 group">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}

// New Components
interface CounterCardProps {
  number: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

function CounterCard({ number, label, prefix = "", suffix = "" }: CounterCardProps) {
  const [count, setCount] = useState(0);
  const counterRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const end = number;
          const duration = 2000;
          const increment = Math.ceil(end / (duration / 16));

          const timer = setInterval(() => {
            start += increment;
            if (start > end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, 16);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [number]);

  return (
    <motion.div
      ref={counterRef}
      variants={fadeIn}
      className="space-y-2"
    >
      <h3 className="text-3xl md:text-4xl font-bold text-primary">
        {prefix}{count.toLocaleString()}{suffix}
      </h3>
      <p className="text-muted-foreground">{label}</p>
    </motion.div>
  );
}

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrent((current + newDirection + testimonials.length) % testimonials.length);
  };

  return (
    <div className="relative h-[400px] w-full">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="absolute w-full"
        >
          <TestimonialCard testimonial={testimonials[current]} />
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-4">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > current ? 1 : -1);
              setCurrent(index);
            }}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === current ? "bg-primary" : "bg-primary/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 bg-primary/10 rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// Constants
const features = [
  {
    icon: <Activity className="w-12 h-12 text-primary" />,
    title: "Health Tracking",
    description: "Monitor your vital signs, BMI, and daily activities in real-time with our advanced tracking system."
  },
  {
    icon: <Users className="w-12 h-12 text-primary" />,
    title: "Expert Doctors",
    description: "Connect with qualified healthcare professionals specializing in various medical fields."
  },
  {
    icon: <Calendar className="w-12 h-12 text-primary" />,
    title: "Easy Scheduling",
    description: "Book appointments with your preferred doctors at your convenience."
  },
  {
    icon: <Shield className="w-12 h-12 text-primary" />,
    title: "Secure Platform",
    description: "Your health data is protected with state-of-the-art security measures."
  },
  {
    icon: <Heart className="w-12 h-12 text-primary" />,
    title: "Personalized Care",
    description: "Receive tailored health recommendations based on your unique profile."
  },
  {
    icon: <Stethoscope className="w-12 h-12 text-primary" />,
    title: "24/7 Support",
    description: "Access medical support and emergency services around the clock."
  }
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Patient",
    avatar: avatars[0],
    quote: "EquiHealth has revolutionized how I manage my health. The ability to track my progress and connect with doctors instantly is incredible."
  },
  {
    name: "Dr. Michael Chen",
    role: "Cardiologist",
    avatar: avatars[1],
    quote: "As a healthcare provider, EquiHealth helps me deliver better care to my patients with its comprehensive health tracking features."
  },
  {
    name: "Emma Davis",
    role: "Fitness Trainer",
    avatar: avatars[2],
    quote: "I recommend EquiHealth to all my clients. It's the perfect platform for monitoring health metrics and staying connected with healthcare providers."
  }
];

function FeatureCard({ icon, title, description, isHovered, onHover, onLeave }: { icon: React.ReactNode; title: string; description: string; isHovered: boolean; onHover: () => void; onLeave: () => void }) {
  return (
    <motion.div
      variants={fadeIn}
      className="bg-muted/30 p-6 rounded-xl"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={onHover}
      onHoverEnd={onLeave}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex gap-1 mt-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${isHovered ? "fill-primary" : "text-muted-foreground"}`} />
        ))}
      </div>
    </motion.div>
  );
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center gap-4">
        <img 
          src={testimonial.avatar} 
          alt={testimonial.name} 
          className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/50" 
        />
        <div>
          <CardTitle className="text-lg">{testimonial.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground italic">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
      </CardContent>
    </Card>
  );
} 