import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Calendar, 
  PlusCircle, 
  CheckSquare, 
  ShieldAlert, 
  LogOut, 
  User, 
  Clock, 
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, openBookingModal, hallInfo }) => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }}>Admin</span>;
      case 'HOD':
        return <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.4)' }}>HOD Approver</span>;
      case 'EVENT_COORDINATOR':
      case 'CLUB_COORDINATOR':
        return <span className="badge badge-role">Events Incharge (All Clubs)</span>;
      default:
        return <span className="badge badge-role">{role}</span>;
    }
  };

  return (
    <header className="header-bar">
      <div className="brand-wrapper">
        <div className="brand-logo-icon">
          <Building2 size={24} color="#fff" />
        </div>
        <div>
          <div className="brand-title">JVN Hall Booking & Scheduling</div>
          <div className="brand-subtitle">
            Capacity: {hallInfo?.capacity || 250} seats • {hallInfo?.location || 'Main Campus Block'}
          </div>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={16} />
          Event Booking & Records
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar size={16} />
          Calendar & Schedule
        </button>

        {user?.role === 'HOD' && (
          <button
            className={`nav-tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            <CheckSquare size={16} />
            HOD Approvals
          </button>
        )}

        {user?.role === 'ADMIN' && (
          <button
            className={`nav-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <ShieldCheck size={16} />
            Admin Console
          </button>
        )}

        <button
          className="btn btn-primary btn-sm"
          style={{ marginLeft: 8 }}
          onClick={openBookingModal}
        >
          <PlusCircle size={15} />
          Book Hall
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.name}
            </div>
            <div>{getRoleBadge(user?.role)}</div>
          </div>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)'
          }}>
            <User size={18} color="var(--accent-primary)" />
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Sign Out"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
};
