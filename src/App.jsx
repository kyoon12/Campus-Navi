import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Signup from './components/Signup';
import CampusMap from './components/CampusMap';
import Info from './components/Info';
import Navigate from './components/Navigate';
import Announcements from './components/Announcements';
import Schedule from './components/Schedule';
import Loading from './components/Loading';
import AdminPanel from './componentsAdmin/AdminPanel';
import AdminLogin from './componentsAdmin/AdminLogin';
import { registerSW } from 'virtual:pwa-register

export default function App() {
  const [currentView, setCurrentView] = useState('loading');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const initComplete = useRef(false);

  // Buildings data
  const [buildings, setBuildings] = useState([
    {
      name: 'College of Computer Studies',
      code: 'CCS',
      desc: 'Home to computer science and IT programs with state-of-the-art computer labs and research facilities.',
      hours: '7:00 AM - 9:00 PM',
      floors: 5,
      facilities: ['Computer Labs', 'Research Center', 'Faculty Offices', 'Student Lounge', 'Conference Rooms']
    },
    {
      name: 'Main Library',
      code: 'LIB',
      desc: 'Central library with extensive collections, study areas, and digital resources for academic research.',
      hours: '6:00 AM - 10:00 PM',
      floors: 4,
      facilities: ['Reading Areas', 'Group Study Rooms', 'Computer Station', 'Printing Services', 'Quiet Zones']
    },
    {
      name: 'Student Center',
      code: 'STUD',
      desc: 'Hub for student activities, organizations, and campus events with various amenities and services.',
      hours: '8:00 AM - 11:00 PM',
      floors: 3,
      facilities: ['Food Court', 'Game Room', 'Meeting Rooms', 'Student Org Offices', 'Lounges']
    },
    {
      name: 'Science Labs',
      code: 'SCI',
      desc: 'Advanced laboratory facilities for chemistry, biology, physics, and environmental science research.',
      hours: '7:00 AM - 8:00 PM',
      floors: 4,
      facilities: ['Research Labs', 'Equipment Rooms', 'Faculty Offices', 'Student Workspaces', 'Safety Stations']
    },
    {
      name: 'Cafeteria',
      code: 'CAF',
      desc: 'Main dining facility offering diverse food options for students, faculty, and staff.',
      hours: '6:30 AM - 8:00 PM',
      floors: 2,
      facilities: ['Food Stations', 'Seating Areas', 'Vending Machines', 'Microwave Stations', 'Outdoor Terrace']
    },
    {
      name: 'College of Business Administration',
      code: 'CBA',
      desc: 'Modern business education facility with trading rooms, case study rooms, and executive education spaces.',
      hours: '7:00 AM - 9:00 PM',
      floors: 6,
      facilities: ['Trading Room', 'Case Rooms', 'Faculty Offices', 'Student Lounge', 'Career Center']
    },
    {
      name: 'College of Education',
      code: 'CED',
      desc: 'Dedicated to teacher education and educational research with specialized classrooms and observation areas.',
      hours: '7:00 AM - 8:00 PM',
      floors: 4,
      facilities: ['Smart Classrooms', 'Observation Rooms', 'Curriculum Library', 'Faculty Offices', 'Seminar Hall']
    },
    {
      name: 'Gymnasium',
      code: 'GYM',
      desc: 'Comprehensive athletic facility for sports, fitness, and recreational activities for the campus community.',
      hours: '5:00 AM - 11:00 PM',
      floors: 2,
      facilities: ['Basketball Courts', 'Fitness Center', 'Locker Rooms', 'Climbing Wall', 'Swimming Pool']
    },
    {
      name: 'Sports Field',
      code: 'FIELD',
      desc: 'Outdoor athletic complex for various sports including football, track, and intramural activities.',
      hours: '5:00 AM - 10:00 PM',
      floors: 1,
      facilities: ['Football Field', 'Track', 'Bleachers', 'Equipment Rental', 'Lighting System']
    },
    {
      name: 'Administration',
      code: 'ADM',
      desc: 'Central administrative offices handling university operations, student services, and administrative functions.',
      hours: '8:00 AM - 5:00 PM',
      floors: 5,
      facilities: ['Registrar Office', 'Bursar', 'Student Affairs', 'HR Department', 'Meeting Rooms']
    },
    {
      name: 'Medical Clinic',
      code: 'MED',
      desc: 'Campus health center providing medical services, wellness programs, and emergency care for students and staff.',
      hours: '24/7 Emergency, 8AM-6PM Regular',
      floors: 3,
      facilities: ['Emergency Room', 'Consultation Rooms', 'Pharmacy', 'Laboratory', 'Wellness Center']
    }
  ]);
  
   const updateSW = registerSW({
    onNeedRefresh() {},
    onOfflineReady() {},
  })

  // Simple session check without complex database queries
  const checkSession = async () => {
    try {
      console.log('🔍 Checking session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session error:', error);
        // Fall back to login immediately
        setIsLoading(false);
        setCurrentView('login');
        return;
      }

      if (!session?.user) {
        console.log('👤 No active session');
        setIsLoading(false);
        setCurrentView('login');
        return;
      }

      console.log('✅ Session found for:', session.user.email);
      
      // Create basic user object - skip database queries for now
      const basicUser = {
        ...session.user,
        username: session.user.email?.split('@')[0] || 'user',
        full_name: session.user.user_metadata?.full_name || '',
        role: session.user.user_metadata?.role || 'student'
      };

      setUser(basicUser);
      
      // Navigate based on role from metadata
      if (basicUser.role === 'admin') {
        console.log('🚀 Redirecting to admin panel');
        setCurrentView('admin');
      } else {
        console.log('🗺️ Redirecting to campus map');
        setCurrentView('map');
      }
      
      setIsLoading(false);
      initComplete.current = true;

    } catch (error) {
      console.error('💥 Session check failed:', error);
      // Always fall back to login on error
      setIsLoading(false);
      setCurrentView('login');
    }
  };

  useEffect(() => {
    let mounted = true;

    // Quick timeout - if session check takes too long, go to login
    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        console.log('⏰ Session check timeout - going to login');
        setIsLoading(false);
        setCurrentView('login');
      }
    }, 2000);

    // Initial session check
    checkSession();

    // Simple auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN') {
        console.log('👤 User signed in');
        checkSession();
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setCurrentView('login');
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
  };

  const handleSignupSuccess = () => {
    alert('Account created successfully! You can now log in.');
    setCurrentView('login');
  };

  // Enhanced login success handler
  const handleLoginSuccess = async () => {
    console.log('🔄 Manual login success trigger');
    await checkSession();
  };

  // RENDER
  const renderView = () => {
    if (isLoading) return <Loading />;

    switch (currentView) {
      case 'login': 
        return <Login onNavigate={setCurrentView} onLoginSuccess={handleLoginSuccess} />;
      case 'signup': 
        return <Signup onNavigate={setCurrentView} onSignupSuccess={handleSignupSuccess} />;
      case 'admin-login': 
        return <AdminLogin onNavigate={setCurrentView} onAdminLoginSuccess={handleLoginSuccess} />;
      case 'map': 
        return <CampusMap onNavigate={setCurrentView} user={user} buildings={buildings} onLogout={handleLogout} />;
      case 'info': 
        return <Info onNavigate={setCurrentView} buildings={buildings} />;
      case 'navigate': 
        return <Navigate onNavigate={setCurrentView} buildings={buildings} />;
      case 'announcements': 
        return <Announcements onNavigate={setCurrentView} user={user} />;
      case 'schedule': 
        return <Schedule onNavigate={setCurrentView} user={user} />;
      case 'admin': 
        return <AdminPanel onNavigate={setCurrentView} user={user} />;
      default: 
        return <Login onNavigate={setCurrentView} onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {renderView()}
    </div>
  );
}