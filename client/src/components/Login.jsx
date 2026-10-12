import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, GraduationCap, Settings, AlertCircle, LogIn } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRoleType, setActiveRoleType] = useState('events'); // 'events', 'hod', 'admin'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectRolePreset = (roleType, userEmail, userPass) => {
    setActiveRoleType(roleType);
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
  };

  const getRoleHeader = () => {
    switch (activeRoleType) {
      case 'hod':
        return {
          iconClass: 'green',
          icon: <Users size={32} />,
          title: 'Complete Your Teacher Profile',
          subtitle: 'Sign in to review and manage hall reservations',
          btnClass: 'btn-green',
          btnText: 'Get Started'
        };
      case 'admin':
        return {
          iconClass: 'purple',
          icon: <Settings size={32} />,
          title: 'Complete Your Administrator Profile',
          subtitle: 'Sign in to oversee hall management and administration',
          btnClass: 'btn-purple',
          btnText: 'Get Started'
        };
      default:
        return {
          iconClass: 'blue',
          icon: <GraduationCap size={32} />,
          title: 'Complete Your Student Profile',
          subtitle: 'Sign in to submit and track hall booking requests',
          btnClass: 'btn-primary',
          btnText: 'Get Started'
        };
    }
  };

  const roleHeader = getRoleHeader();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f4f7fb',
      padding: 24
    }}>
      <div className="modal-content-card">
        {/* Top Floating Squircle Icon (Screenshots 2, 3, 4) */}
        <div className={`modal-icon-badge ${roleHeader.iconClass}`}>
          {roleHeader.icon}
        </div>

        <h2 className="modal-title">{roleHeader.title}</h2>
        <p className="modal-subtitle">{roleHeader.subtitle}</p>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: 10,
            padding: '12px 14px',
            color: '#b91c1c',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Role Switcher Pill Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          marginBottom: 24,
          padding: 4,
          background: '#f1f5f9',
          borderRadius: 12
        }}>
          <button
            type="button"
            onClick={() => selectRolePreset('events', 'events@college.edu', 'Events@123')}
            style={{
              padding: '8px 10px',
              borderRadius: 10,
              border: 'none',
              background: activeRoleType === 'events' ? '#ffffff' : 'transparent',
              color: activeRoleType === 'events' ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: activeRoleType === 'events' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Events / Club
          </button>
          <button
            type="button"
            onClick={() => selectRolePreset('hod', 'hod@college.edu', 'Hod@123')}
            style={{
              padding: '8px 10px',
              borderRadius: 10,
              border: 'none',
              background: activeRoleType === 'hod' ? '#ffffff' : 'transparent',
              color: activeRoleType === 'hod' ? '#16a34a' : '#64748b',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: activeRoleType === 'hod' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Professor / HOD
          </button>
          <button
            type="button"
            onClick={() => selectRolePreset('admin', 'admin@college.edu', 'Admin@123')}
            style={{
              padding: '8px 10px',
              borderRadius: 10,
              border: 'none',
              background: activeRoleType === 'admin' ? '#ffffff' : 'transparent',
              color: activeRoleType === 'admin' ? '#7c3aed' : '#64748b',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: activeRoleType === 'admin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Administrator
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">College Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@college.edu"
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          {/* Action Buttons matching Screenshots 2, 3, 4 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14, marginTop: 24 }}>
            <button
              type="button"
              onClick={() => {
                setEmail('');
                setPassword('');
                setError('');
              }}
              className="btn btn-secondary"
            >
              BACK
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`btn ${roleHeader.btnClass}`}
            >
              {loading ? 'Signing In...' : roleHeader.btnText}
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
          HallBook • College Reservations Platform
        </div>
      </div>
    </div>
  );
};
