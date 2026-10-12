import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  LayoutDashboard, 
  CheckCircle, 
  Calendar, 
  Building2, 
  BarChart2, 
  LogOut, 
  MoreVertical,
  Users,
  Settings,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, onOpenBookingModal, hallInfo }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Avatar and role info matching screenshots
  const getUserDisplay = () => {
    if (user?.role === 'HOD') {
      return {
        colorClass: 'green',
        icon: <Users size={18} />,
        roleLabel: 'Teacher · Education',
        greetingPrefix: 'Professor'
      };
    } else if (user?.role === 'ADMIN') {
      return {
        colorClass: 'purple',
        icon: <Settings size={18} />,
        roleLabel: 'Admin · College',
        greetingPrefix: 'Administrator'
      };
    } else {
      return {
        colorClass: 'blue',
        icon: <Users size={18} />,
        roleLabel: 'Events · Clubs',
        greetingPrefix: 'Student / Coordinator'
      };
    }
  };

  const userDisplay = getUserDisplay();

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <BookOpen size={22} strokeWidth={2.4} />
        </div>
        <div>
          <div className="brand-name">HallBook</div>
          <div className="brand-tagline">College Reservations</div>
        </div>
      </div>

      {/* Nav List */}
      <div className="sidebar-nav-label">NAVIGATION</div>
      <nav className="sidebar-menu">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>

        {user?.role === 'HOD' && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`sidebar-link ${activeTab === 'approvals' ? 'active' : ''}`}
          >
            <CheckCircle size={18} />
            Approve Requests
          </button>
        )}

        <button
          onClick={() => setActiveTab('calendar')}
          className={`sidebar-link ${activeTab === 'calendar' ? 'active' : ''}`}
        >
          <Calendar size={18} />
          Calendar view
        </button>

        {user?.role === 'ADMIN' && (
          <>
            <button
              onClick={() => setActiveTab('admin_halls')}
              className={`sidebar-link ${activeTab === 'admin_halls' ? 'active' : ''}`}
            >
              <Building2 size={18} />
              Manage Halls
            </button>
            <button
              onClick={() => setActiveTab('admin_stats')}
              className={`sidebar-link ${activeTab === 'admin_stats' ? 'active' : ''}`}
            >
              <BarChart2 size={18} />
              Statistics
            </button>
          </>
        )}

        {/* Quick action to create booking */}
        <div style={{ marginTop: 14, paddingLeft: 6, paddingRight: 6 }}>
          <button
            onClick={onOpenBookingModal}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', gap: 6, fontSize: '0.84rem' }}
          >
            <PlusCircle size={15} /> Book Hall
          </button>
        </div>
      </nav>

      {/* User Footer Card matching Screenshots 1 & 5 */}
      <div className="sidebar-user" style={{ position: 'relative' }}>
        <div className="user-profile-info">
          <div className={`user-avatar-circle ${userDisplay.colorClass}`}>
            {userDisplay.icon}
          </div>
          <div>
            <div className="user-name-text">
              {user?.name || 'Authorized User'}
            </div>
            <div className="user-role-text">{userDisplay.roleLabel}</div>
          </div>
        </div>

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4
          }}
          title="Account Menu"
        >
          <MoreVertical size={16} />
        </button>

        {showUserMenu && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: 8,
            background: '#ffffff',
            borderRadius: 12,
            boxShadow: 'var(--shadow-hover)',
            border: '1px solid #e2e8f0',
            padding: 6,
            minWidth: 150,
            zIndex: 30
          }}>
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', border: 'none', justifyContent: 'flex-start', color: '#dc2626' }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
