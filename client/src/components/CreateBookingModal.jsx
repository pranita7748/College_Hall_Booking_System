import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, Clock, AlertTriangle, CheckCircle2, Users, FileText, Info } from 'lucide-react';

export const CreateBookingModal = ({ isOpen, onClose, onSuccess, initialBooking = null, clubs = [] }) => {
  const { user } = useAuth();

  const [eventName, setEventName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [bookingType, setBookingType] = useState('Club Event');
  const [priority, setPriority] = useState('Medium');
  const [date, setDate] = useState('2026-10-15');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [expectedParticipants, setExpectedParticipants] = useState(100);
  const [guestName, setGuestName] = useState('');
  const [description, setDescription] = useState('');

  const [conflictState, setConflictState] = useState({
    checking: false,
    hasConflict: false,
    conflicts: [],
    hasCompetingPending: false,
    competingRequests: []
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Prefill when editing
  useEffect(() => {
    if (initialBooking) {
      setEventName(initialBooking.eventName || '');
      setOrganizer(initialBooking.organizer || '');
      setBookingType(initialBooking.bookingType || 'Club Event');
      setPriority(initialBooking.priority || 'Medium');
      setDate(initialBooking.date || '');
      setStartTime(initialBooking.startTime || '');
      setEndTime(initialBooking.endTime || '');
      setExpectedParticipants(initialBooking.expectedParticipants || 50);
      setGuestName(initialBooking.guestName || '');
      setDescription(initialBooking.description || '');
    } else {
      setEventName('');
      setOrganizer(user?.club || (clubs[0]?.name || 'DEsoc'));
      setBookingType('Club Event');
      setPriority('Medium');
      // Default to 2026-10-15 for the project demonstration
      setDate('2026-10-15');
      setStartTime('10:00');
      setEndTime('12:00');
      setExpectedParticipants(80);
      setGuestName('');
      setDescription('');
    }
  }, [initialBooking, user, clubs, isOpen]);

  // Live conflict checking trigger
  useEffect(() => {
    if (!isOpen || !date || !startTime || !endTime) return;

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
    const checkTimer = setTimeout(async () => {
      setConflictState(prev => ({ ...prev, checking: true }));
      try {
        const res = await api.checkConflicts(date, startTime, endTime, initialBooking?._id);
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
        if (!isCancelled) {
          setConflictState(prev => ({ ...prev, checking: false }));
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(checkTimer);
    };
  }, [date, startTime, endTime, isOpen, initialBooking]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (startTime >= endTime) {
      setError('End time must be later than start time.');
      return;
    }

    if (conflictState.hasConflict) {
      setError('Cannot submit booking: This time slot conflicts with an already confirmed booking.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        eventName,
        organizer: user?.role === 'CLUB_COORDINATOR' ? (user?.club || organizer) : organizer,
        bookingType,
        priority,
        date,
        startTime,
        endTime,
        expectedParticipants: Number(expectedParticipants),
        guestName,
        description
      };

      if (initialBooking) {
        await api.updateBooking(initialBooking._id, payload);
      } else {
        await api.createBooking(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
            {initialBooking ? 'Modify Reservation Request' : 'Book JVN Hall'}
          </h2>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 8px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: 10,
            padding: '12px 14px',
            color: '#b91c1c',
            fontSize: '0.86rem',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Event Name *</label>
            <input
              type="text"
              required
              className="input-field"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. AI & Robotics Symposium"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="input-group">
              <label className="input-label">Organizer / Club</label>
              {user?.role === 'CLUB_COORDINATOR' ? (
                <input
                  type="text"
                  disabled
                  className="input-field"
                  value={user?.club || 'My Club'}
                />
              ) : (
                <select
                  className="select-field"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                >
                  {clubs.map(c => (
                    <option key={c._id || c.name} value={c.name}>{c.name}</option>
                  ))}
                  <option value="Department of CSE">Department of CSE</option>
                  <option value="Dean Academic Affairs">Dean Academic Affairs</option>
                </select>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Event Type</label>
              <select
                className="select-field"
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value)}
              >
                <option value="Club Event">Club Event</option>
                <option value="Guest Lecture">Guest Lecture</option>
                <option value="Department Event">Department Event</option>
                <option value="Workshop">Workshop</option>
                <option value="Meeting">Meeting</option>
                <option value="Examination">Examination</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Date *</label>
              <input
                type="date"
                required
                className="input-field"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Start Time *</label>
              <input
                type="time"
                required
                className="input-field"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">End Time *</label>
              <input
                type="time"
                required
                className="input-field"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Real-time Conflict Engine Feedback Banner */}
          <div style={{ marginBottom: 18 }}>
            {conflictState.checking ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} className="spin" /> Checking hall availability...
              </div>
            ) : conflictState.hasConflict ? (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: 10,
                padding: '12px 14px',
                color: '#b91c1c',
                fontSize: '0.84rem'
              }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <AlertTriangle size={16} color="#dc2626" />
                  Hard Scheduling Conflict Detected!
                </div>
                <div>
                  This slot overlaps with an approved booking:
                  {conflictState.conflicts.map(c => (
                    <div key={c._id} style={{ marginTop: 4, paddingLeft: 8, borderLeft: '2px solid #ef4444' }}>
                      <strong>{c.eventName}</strong> ({c.organizer}) • {c.startTime} – {c.endTime}
                    </div>
                  ))}
                </div>
              </div>
            ) : conflictState.hasCompetingPending ? (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#92400e',
                fontSize: '0.84rem'
              }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Info size={16} color="#b45309" /> Notice: Competing Pending Request Exists
                </div>
                <div>
                  Another club has requested overlapping hours ({conflictState.competingRequests[0]?.organizer}: {conflictState.competingRequests[0]?.startTime}-{conflictState.competingRequests[0]?.endTime}). Final decision will be made by HOD.
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
                Slot is currently available! No conflicts detected with confirmed bookings.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="input-group">
              <label className="input-label">Expected Participants (Max 250)</label>
              <input
                type="number"
                min="1"
                max="250"
                className="input-field"
                value={expectedParticipants}
                onChange={(e) => setExpectedParticipants(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Priority</label>
              <select
                className="select-field"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Chief Guest / Speaker (Optional)</label>
            <input
              type="text"
              className="input-field"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. Dr. A. P. Raman (IIT Madras)"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Event Description & Requirements</label>
            <textarea
              rows="3"
              className="textarea-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Projector, podium mic, seating layout, etc."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || conflictState.hasConflict}
              className="btn btn-primary"
            >
              {submitting ? 'Submitting...' : initialBooking ? 'Save Changes' : 'Submit Booking Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
