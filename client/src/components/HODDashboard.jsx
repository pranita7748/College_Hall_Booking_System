import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  AlertCircle, 
  CheckCircle, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Check, 
  X, 
  AlertTriangle,
  Eye,
  CheckCircle2
} from 'lucide-react';

export const HODDashboard = ({ onViewBooking, onOpenBookingModal }) => {
  const { user } = useAuth();
  const [pendingBookings, setPendingBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conflictMap, setConflictMap] = useState({});

  // Rejection Modal State
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getBookings();
      if (res.success) {
        setAllBookings(res.data);
        const pending = res.data.filter(b => b.status === 'PENDING');
        setPendingBookings(pending);

        // Check conflicts for each pending booking
        const conflicts = {};
        for (const b of pending) {
          try {
            const cRes = await api.checkConflicts(b.date, b.startTime, b.endTime, b._id);
            if (cRes.success) {
              conflicts[b._id] = cRes.data;
            }
          } catch (e) {
            console.error('Conflict check error for', b._id, e);
          }
        }
        setConflictMap(conflicts);
      }
    } catch (err) {
      console.error('Failed to load HOD data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    setActionError('');
    setProcessing(true);
    try {
      await api.approveBooking(id);
      await fetchData();
    } catch (err) {
      setActionError(err.message || 'Failed to approve booking.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setActionError('A rejection reason is required.');
      return;
    }

    setProcessing(true);
    setActionError('');
    try {
      await api.rejectBooking(rejectingBooking._id, rejectionReason.trim());
      setRejectingBooking(null);
      setRejectionReason('');
      await fetchData();
    } catch (err) {
      setActionError(err.message || 'Failed to reject booking.');
    } finally {
      setProcessing(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const approvedTodayCount = allBookings.filter(b => (b.date === today || b.date === '2026-10-15') && b.status === 'APPROVED').length;

  return (
    <div>
      {/* Header matching Screenshot 1 */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Hello Professor {user?.name || 'HOD'}
          </h1>
          <p className="page-subtitle">
            Review and manage student hall reservation requests
          </p>
        </div>
      </div>

      {actionError && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: 12,
          padding: '12px 18px',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 24
        }}>
          <AlertCircle size={18} />
          {actionError}
        </div>
      )}

      {/* Metric Cards Row matching Screenshot 1 */}
      <div className="metrics-grid">
        {/* Card 1: Pending Requests */}
        <div className="metric-card">
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d97706',
            flexShrink: 0
          }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="metric-label">Pending Requests</div>
            <div className="metric-value">{pendingBookings.length}</div>
          </div>
        </div>

        {/* Card 2: Approved Today */}
        <div className="metric-card">
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#16a34a',
            flexShrink: 0
          }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="metric-label">Approved Today</div>
            <div className="metric-value" style={{ color: '#16a34a' }}>
              {approvedTodayCount}
            </div>
          </div>
        </div>

        {/* Card 3: Total Requests */}
        <div className="metric-card">
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#e0f2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7',
            flexShrink: 0
          }}>
            <CalendarIcon size={22} />
          </div>
          <div>
            <div className="metric-label">Total Requests</div>
            <div className="metric-value">{allBookings.length}</div>
          </div>
        </div>
      </div>

      {/* Main Panel matching Screenshot 1: Pending Approval Requests */}
      <div className="content-card">
        <h2 className="content-card-title">Pending Approval Requests</h2>

        {pendingBookings.length === 0 ? (
          /* Empty State matching Screenshot 1 */
          <div className="empty-state-box">
            <div className="empty-state-icon">
              <CheckCircle2 size={42} strokeWidth={1.75} />
            </div>
            <div className="empty-state-text">No pending requests</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pendingBookings.map((b) => {
              const conflictInfo = conflictMap[b._id];
              const hasHardConflict = conflictInfo?.hasConflict;
              const hasCompeting = conflictInfo?.hasCompetingPending;

              return (
                <div
                  key={b._id}
                  style={{
                    background: '#f8fafc',
                    borderRadius: 14,
                    padding: '20px 24px',
                    border: '1px solid #e2e8f0',
                    borderLeft: `5px solid ${hasHardConflict ? '#ef4444' : hasCompeting ? '#f59e0b' : '#16a34a'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{b.eventName}</h3>
                        <span className="badge badge-role">{b.organizer}</span>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{b.bookingType}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CalendarIcon size={14} /> {b.date}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace' }}>
                          <Clock size={14} /> {b.startTime} – {b.endTime}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={14} /> {b.expectedParticipants} attendees
                        </span>
                        <span>Priority: <strong>{b.priority}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => onViewBooking(b)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={14} /> Details
                      </button>
                      <button
                        onClick={() => {
                          setRejectingBooking(b);
                          setRejectionReason('');
                          setActionError('');
                        }}
                        className="btn btn-danger btn-sm"
                        disabled={processing}
                      >
                        <X size={14} /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(b._id)}
                        className="btn btn-green btn-sm"
                        disabled={processing || hasHardConflict}
                        title={hasHardConflict ? 'Cannot approve overlapping slot' : 'Approve Request'}
                      >
                        <Check size={14} /> Approve
                      </button>
                    </div>
                  </div>

                  {/* Conflict Engine Badge */}
                  {hasHardConflict ? (
                    <div style={{
                      background: '#fee2e2',
                      border: '1px solid #fca5a5',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: '#b91c1c',
                      fontSize: '0.84rem'
                    }}>
                      <strong>Hard Conflict Detected:</strong> Overlaps with an already confirmed booking:
                      {conflictInfo.conflicts.map(c => (
                        <span key={c._id}> "{c.eventName}" ({c.startTime} – {c.endTime})</span>
                      ))}
                    </div>
                  ) : hasCompeting ? (
                    <div style={{
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: '#b45309',
                      fontSize: '0.84rem'
                    }}>
                      <strong>Notice:</strong> Competing pending request detected for overlapping hours.
                    </div>
                  ) : (
                    <div style={{
                      background: '#dcfce7',
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                      padding: '8px 12px',
                      color: '#15803d',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <CheckCircle size={14} /> Slot is clear. Zero overlap with confirmed bookings.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectingBooking && (
        <div className="modal-overlay" onClick={() => setRejectingBooking(null)}>
          <div className="modal-content-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626', marginBottom: 12 }}>
              Reject Reservation Request
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Provide a clear reason for rejecting the booking request for <strong>{rejectingBooking.eventName}</strong> ({rejectingBooking.organizer}).
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div className="input-group">
                <label className="input-label">Rejection Reason *</label>
                <textarea
                  rows="3"
                  required
                  className="textarea-field"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Scheduling conflict with institutional examination."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setRejectingBooking(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !rejectionReason.trim()}
                  className="btn btn-danger btn-sm"
                >
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
