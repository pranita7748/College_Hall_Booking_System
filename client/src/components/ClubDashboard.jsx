import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  AlertCircle,
  FileEdit,
  Trash2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const ClubDashboard = ({ openBookingModal, onEditBooking, onViewBooking }) => {
  const { user } = useAuth();
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const res = await api.getBookings({ myOnly: 'true' });
      if (res.success) {
        setMyBookings(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch my bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    try {
      await api.cancelBooking(id);
      fetchMyBookings();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    }
  };

  const pendingCount = myBookings.filter(b => b.status === 'PENDING').length;
  const approvedCount = myBookings.filter(b => b.status === 'APPROVED').length;
  const rejectedCount = myBookings.filter(b => b.status === 'REJECTED').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-approved"><CheckCircle size={12} /> Approved</span>;
      case 'PENDING':
        return <span className="badge badge-pending"><Clock size={12} /> Pending Review</span>;
      case 'REJECTED':
        return <span className="badge badge-rejected"><XCircle size={12} /> Rejected</span>;
      case 'CANCELLED':
        return <span className="badge badge-cancelled">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
        border: '1px solid rgba(99, 102, 241, 0.2)'
      }}>
        <div>
          <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)', fontWeight: 700 }}>
            {user?.club || 'Club'} Coordinator Portal
          </div>
          <h2 style={{ fontSize: '1.65rem', marginTop: 4 }}>
            Welcome back, {user?.name}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Manage hall booking requests, check live slot availability, and track HOD approvals.
          </p>
        </div>

        <button onClick={openBookingModal} className="btn btn-primary">
          <PlusCircle size={18} />
          Create Booking Request
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={16} color="var(--accent-amber)" /> Pending Review
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 8, color: '#fbbf24' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Awaiting HOD approval</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={16} color="var(--accent-emerald)" /> Confirmed Bookings
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 8, color: '#34d399' }}>
            {approvedCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Added to official calendar</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <XCircle size={16} color="var(--accent-rose)" /> Rejected Requests
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 8, color: '#f87171' }}>
            {rejectedCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>View rejection feedback</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} color="var(--accent-cyan)" /> Total Submissions
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 8, color: '#67e8f9' }}>
            {myBookings.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Lifetime requests</div>
        </div>
      </div>

      {/* My Bookings Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.25rem' }}>My Booking Requests & History</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {myBookings.length} requests
          </span>
        </div>

        {myBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <p>You haven't submitted any booking requests yet.</p>
            <button
              onClick={openBookingModal}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 14 }}
            >
              <PlusCircle size={16} /> Request JVN Hall Now
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Event Name</th>
                  <th style={{ padding: '12px 14px' }}>Date</th>
                  <th style={{ padding: '12px 14px' }}>Time Slot</th>
                  <th style={{ padding: '12px 14px' }}>Type</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b) => (
                  <tr
                    key={b._id}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {b.eventName}
                      </div>
                      {b.guestName && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Guest: {b.guestName}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{b.date}</td>
                    <td style={{ padding: '14px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {b.startTime} – {b.endTime}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{b.bookingType}</td>
                    <td style={{ padding: '14px' }}>{getStatusBadge(b.status)}</td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => onViewBooking(b)}
                          className="btn btn-secondary btn-sm"
                          title="View Details"
                        >
                          <ExternalLink size={14} />
                        </button>
                        {b.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => onEditBooking(b)}
                              className="btn btn-secondary btn-sm"
                              title="Modify Request"
                            >
                              <FileEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleCancel(b._id)}
                              className="btn btn-danger btn-sm"
                              title="Cancel Request"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
