import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { ModeToggle } from './ModeToggle';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();

  const renderNavLinks = () => {
    if (isLoading) {
      return null;
    }

    if (!user) {
      return (
        <>
          <Button variant="ghost" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Register</Link>
          </Button>
        </>
      );
    }

    switch (user.role) {
      case 'admin':
        return (
          <>
            <Button variant="ghost" asChild>
              <Link to="/admin/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/admin/users">Users</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/admin/doctors">Doctors</Link>
            </Button>
          </>
        );
      case 'doctor':
        return (
          <>
            <Button variant="ghost" asChild>
              <Link to="/doctor/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/doctor/patients">Patients</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/doctor/appointments">Appointments</Link>
            </Button>
          </>
        );
      default:
        return (
          <>
            <Button variant="ghost" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/mental-health">Mental Health</Link>
            </Button>
            <Button variant="ghost" asChild>
            <Link to="/food-info">Food Info</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/community-forum">Community Forum</Link>
            </Button>
          </>
        );
    }
  };

  React.useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only absolute top-2 left-2 bg-primary text-white px-4 py-2 rounded z-50">Skip to main content</a>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">EquiHealth</span>
          </Link>
          <nav className="flex flex-1 items-center space-x-2" aria-label="Main navigation">
            {renderNavLinks()}
          </nav>
          <div className="flex items-center space-x-2">
            <ModeToggle />
            {!isLoading && user && (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.name}
                </span>
                <Button variant="ghost" onClick={logout} aria-label="Logout">
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main id="main-content" className="min-h-[calc(100vh-3.5rem)]">{children}</main>
    </div>
  );
} 