import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar as CalendarIcon, 
  AlertCircle, 
  Users, 
  CheckCircle2, 
  Info, 
  Building, 
  Send, 
  Filter, 
  Eye, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';

export const EventsDashboard = ({ onViewBooking, clubs = [], hallInfo }) => {
  const { user } = useAuth();
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClubFilter, setSelectedClubFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Form Fields State
  const [eventName, setEventName] = useState('');
  const [organizer, setOrganizer] = useState(clubs[0]?.name || 'Phoenix');
  const [bookingType, setBookingType] = useState('Club Event');
  const [priority, setPriority] = useState('Medium');
  const [date, setDate] = useState('2026-10-15');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [expectedParticipants, setExpectedParticipants] = useState(80);
  const [guestName, setGuestName] = useState('');
  const [description, setDescription] = useState('');

  // Live Conflict State
  const [conflictState, setConflictState] = useState({
    checking: false,
    hasConflict: false,
    conflicts: [],
    hasCompetingPending: false,
    competingRequests: []
  });

  const [submitting, setSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState({ type: '', message: '' });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.getBookings();
      if (res.success) {
        setAllBookings(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (clubs.length > 0 && !organizer) {
      setOrganizer(clubs[0].name);
    }
  }, [clubs]);

  // Live conflict checking
  useEffect(() => {
    if (!date || !startTime || !endTime) return;

    if (startTime >= endTime) {
      setConflictState({
        checking: false,
        hasConflict: false,
        conflicts: [],
        hasCompetingPending: false,
        competingRequests: []
      });
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setConflictState(prev => ({ ...prev, checking: true }));
      try {
        const res = await api.checkConflicts(date, startTime, endTime);
        if (!isCancelled && res.success) {
          setConflictState({
            checking: false,
            hasConflict: res.data.hasConflict,
            conflicts: res.data.conflicts || [],
            hasCompetingPending: res.data.hasCompetingPending,
            competingRequests: res.data.competingRequests || []
          });
        }
      } catch (err) {
        if (!isCancelled) setConflictState(prev => ({ ...prev, checking: false }));
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [date, startTime, endTime]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormFeedback({ type: '', message: '' });

    if (startTime >= endTime) {
      setFormFeedback({ type: 'error', message: 'End time must be after start time.' });
      return;
    }

    if (conflictState.hasConflict) {
      setFormFeedback({
        type: 'error',
        message: 'Cannot submit: This time slot overlaps with an already confirmed booking.'
      });
      return;
    }

    const maxCapacity = hallInfo?.capacity || 250;
    if (Number(expectedParticipants) > maxCapacity) {
      setFormFeedback({
        type: 'error',
        message: `Expected participants cannot exceed hall capacity (${maxCapacity}).`
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        eventName,
        organizer,
        bookingType,
        priority,
        date,
        startTime,
        endTime,
        expectedParticipants: Number(expectedParticipants),
        guestName,
        description
      };

      const res = await api.createBooking(payload);
      if (res.success) {
        setFormFeedback({
          type: 'success',
          message: `Booking request for '${eventName}' submitted successfully for HOD review!`
        });
        setEventName('');
        setGuestName('');
        setDescription('');
        setExpectedParticipants(80);
        fetchBookings();
      }
    } catch (err) {
      setFormFeedback({
        type: 'error',
        message: err.message || 'Failed to submit booking request.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    try {
      await api.cancelBooking(id);
      fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-approved"><CheckCircle size={12} /> Confirmed</span>;
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

  const filteredBookings = allBookings.filter(b => {
    const matchesClub = !selectedClubFilter || b.organizer === selectedClubFilter;
    const matchesStatus = !selectedStatusFilter || b.status === selectedStatusFilter;
    return matchesClub && matchesStatus;
  });

  const pendingCount = allBookings.filter(b => b.status === 'PENDING').length;
  const approvedCount = allBookings.filter(b => b.status === 'APPROVED').length;

  return (
    <div>
      {/* Header matching HallBook Style */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Hello {user?.name || 'Coordinator'}
          </h1>
          <p className="page-subtitle">
            Submit and manage student hall reservation requests
          </p>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="metrics-grid">
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
            <div className="metric-value">{pendingCount}</div>
          </div>
        </div>

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
              {approvedCount}
            </div>
          </div>
        </div>

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

      {/* Prominent Event Booking Form Structure */}
      <div className="content-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-light)' }}>
          <h2 className="content-card-title" style={{ marginBottom: 0 }}>
            Hall Reservation Request Form
          </h2>
          <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            JVN Hall • Capacity: {hallInfo?.capacity || 250} Seats
          </span>
        </div>

        {formFeedback.message && (
          <div style={{
            background: formFeedback.type === 'error' ? '#fee2e2' : '#dcfce7',
            border: `1px solid ${formFeedback.type === 'error' ? '#fca5a5' : '#bbf7d0'}`,
            borderRadius: 10,
            padding: '12px 16px',
            color: formFeedback.type === 'error' ? '#b91c1c' : '#15803d',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.88rem'
          }}>
            {formFeedback.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            {formFeedback.message}
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Event Title / Name *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. AI & Web Development Summit"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Department / Club *</label>
              <select
                className="select-field"
                value={organizer}
                onChange={e => setOrganizer(e.target.value)}
              >
                {clubs.map(c => (
                  <option key={c._id || c.name} value={c.name}>{c.name} Club</option>
                ))}
                <option value="Department of Computer Science">Department of Computer Science</option>
                <option value="Dean Academic Affairs">Dean Academic Affairs</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Event Type *</label>
              <select
                className="select-field"
                value={bookingType}
                onChange={e => setBookingType(e.target.value)}
              >
                <option value="Club Event">Club Event</option>
                <option value="Workshop">Workshop</option>
                <option value="Guest Lecture">Guest Lecture</option>
                <option value="Department Event">Department Event</option>
                <option value="Meeting">Meeting</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Priority</label>
              <select
                className="select-field"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginTop: 6,
            padding: '16px 20px',
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px solid #eef2f6'
          }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Reservation Date *</label>
              <input
                type="date"
                required
                className="input-field"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Start Time *</label>
              <input
                type="time"
                required
                className="input-field"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">End Time *</label>
              <input
                type="time"
                required
                className="input-field"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Expected Attendees (Max {hallInfo?.capacity || 250})</label>
              <input
                type="number"
                min="1"
                max={hallInfo?.capacity || 250}
                required
                className="input-field"
                value={expectedParticipants}
                onChange={e => setExpectedParticipants(e.target.value)}
              />
            </div>
          </div>

          {/* Embedded Real-Time Conflict Box */}
          <div style={{ marginTop: 14, marginBottom: 18 }}>
            {conflictState.checking ? (
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={15} /> Checking hall schedule for conflicts...
              </div>
            ) : conflictState.hasConflict ? (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: 10,
                padding: '12px 16px',
                color: '#b91c1c',
                fontSize: '0.86rem'
              }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={18} color="#dc2626" />
                  Hard Scheduling Conflict Detected!
                </div>
                <div style={{ marginTop: 4 }}>
                  This time slot overlaps with an already confirmed booking on JVN Hall:
                  {conflictState.conflicts.map(c => (
                    <span key={c._id}> <strong>"{c.eventName}"</strong> ({c.startTime} – {c.endTime})</span>
                  ))}
                </div>
              </div>
            ) : conflictState.hasCompetingPending ? (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: 10,
                padding: '12px 16px',
                color: '#b45309',
                fontSize: '0.86rem'
              }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Info size={18} />
                  Notice: Competing Pending Request Detected
                </div>
                <div style={{ marginTop: 2 }}>
                  Another club ({conflictState.competingRequests[0]?.organizer}) requested overlapping hours. Final decision rests with HOD.
                </div>
              </div>
            ) : (
              <div style={{
                background: '#dcfce7',
                border: '1px solid #bbf7d0',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#15803d',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <CheckCircle2 size={16} color="#16a34a" />
                Slot is completely available! Zero overlap with confirmed reservations.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
            <div className="input-group">
              <label className="input-label">Chief Guest / Speaker (Optional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Dr. A. P. Raman, IIT Madras"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description & Equipment Requirements</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Podium mic, sound system, dual projectors"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              type="submit"
              disabled={submitting || conflictState.hasConflict}
              className="btn btn-primary"
              style={{ padding: '12px 30px' }}
            >
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Scheduled & Submitted Events Table */}
      <div className="content-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
          <h2 className="content-card-title" style={{ marginBottom: 0 }}>
            Reservation Requests & Records
          </h2>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              className="select-field"
              style={{ width: 160, padding: '7px 12px', fontSize: '0.84rem' }}
              value={selectedClubFilter}
              onChange={e => setSelectedClubFilter(e.target.value)}
            >
              <option value="">All Clubs</option>
              {clubs.map(c => (
                <option key={c._id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>

            <select
              className="select-field"
              style={{ width: 140, padding: '7px 12px', fontSize: '0.84rem' }}
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Confirmed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-state-icon">
              <CalendarIcon size={38} strokeWidth={1.75} />
            </div>
            <div className="empty-state-text">No reservations found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Details</th>
                  <th>Club</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(b => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.eventName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.bookingType}</div>
                    </td>
                    <td>
                      <span className="badge badge-role">{b.organizer}</span>
                    </td>
                    <td>{b.date}</td>
                    <td style={{ fontFamily: 'monospace' }}>{b.startTime} – {b.endTime}</td>
                    <td>{b.expectedParticipants}</td>
                    <td>
                      {getStatusBadge(b.status)}
                      {b.status === 'REJECTED' && b.rejectionReason && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 4 }}>
                          "{b.rejectionReason}"
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => onViewBooking(b)}
                          className="btn btn-secondary btn-sm"
                          title="Details"
                        >
                          <Eye size={14} />
                        </button>
                        {b.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelBooking(b._id)}
                            className="btn btn-danger btn-sm"
                            title="Cancel"
                          >
                            <Trash2 size={14} />
                          </button>
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
