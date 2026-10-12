import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { CalendarView } from './components/CalendarView';
import { EventsDashboard } from './components/EventsDashboard';
import { HODDashboard } from './components/HODDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { CreateBookingModal } from './components/CreateBookingModal';
import { BookingDetailsModal } from './components/BookingDetailsModal';

const MainApp = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hallInfo, setHallInfo] = useState(null);
  const [clubs, setClubs] = useState([]);

  // Modal States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [inspectingBooking, setInspectingBooking] = useState(null);

  // Key to force refresh of calendar / dashboards
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Default tab is 'dashboard'
  useEffect(() => {
    if (user) {
      setActiveTab('dashboard');
    }
  }, [user]);

  // Load Hall & Clubs Info
  const loadSystemData = async () => {
    try {
      const [hRes, cRes] = await Promise.all([api.getHall(), api.getClubs()]);
      if (hRes.success) setHallInfo(hRes.data);
      if (cRes.success) setClubs(cRes.data);
    } catch (err) {
      console.error('Error loading hall or clubs metadata:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadSystemData();
    }
  }, [user, refreshTrigger]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        background: '#f4f7fb'
      }}>
        Loading HallBook Reservations...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleOpenBookingModal = () => {
    setEditingBooking(null);
    setIsBookingModalOpen(true);
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancelBooking = async (id) => {
    try {
      await api.cancelBooking(id);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    }
  };

  // Determine what dashboard view to render
  const renderMainContent = () => {
    if (activeTab === 'calendar') {
      return (
        <CalendarView
          key={refreshTrigger}
          clubs={clubs}
          onSelectBooking={(b) => setInspectingBooking(b)}
        />
      );
    }

    if (activeTab === 'approvals') {
      return (
        <HODDashboard
          key={refreshTrigger}
          onViewBooking={(b) => setInspectingBooking(b)}
          onOpenBookingModal={handleOpenBookingModal}
        />
      );
    }

    if (activeTab === 'admin_halls' || activeTab === 'admin_stats') {
      return (
        <AdminDashboard
          key={refreshTrigger}
          hallInfo={hallInfo}
          onUpdateHall={(updated) => setHallInfo(updated)}
          clubs={clubs}
          onRefreshClubs={loadSystemData}
        />
      );
    }

    // Default 'dashboard' tab renders the role's primary view:
    if (user.role === 'HOD') {
      // Screenshot 1: HOD Dashboard
      return (
        <HODDashboard
          key={refreshTrigger}
          onViewBooking={(b) => setInspectingBooking(b)}
          onOpenBookingModal={handleOpenBookingModal}
        />
      );
    }

    if (user.role === 'ADMIN') {
      // Screenshot 5: Admin Dashboard
      return (
        <AdminDashboard
          key={refreshTrigger}
          hallInfo={hallInfo}
          onUpdateHall={(updated) => setHallInfo(updated)}
          clubs={clubs}
          onRefreshClubs={loadSystemData}
        />
      );
    }

    // Default: Events Coordinator (Screenshot style with Form & Records)
    return (
      <EventsDashboard
        key={refreshTrigger}
        clubs={clubs}
        hallInfo={hallInfo}
        onViewBooking={(b) => setInspectingBooking(b)}
      />
    );
  };

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBookingModal={handleOpenBookingModal}
        hallInfo={hallInfo}
      />

      <main className="main-wrapper">
        {renderMainContent()}
      </main>

      {/* Booking Form Modal */}
      <CreateBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
        initialBooking={editingBooking}
        clubs={clubs}
      />

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={inspectingBooking}
        onClose={() => setInspectingBooking(null)}
        onEdit={handleEditBooking}
        onCancel={handleCancelBooking}
        canManage={
          user?.role === 'ADMIN' ||
          user?.role === 'HOD' ||
          inspectingBooking?.requestedBy?._id === user?.id
        }
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
