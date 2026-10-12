import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Filter, 
  CheckCircle, 
  Users 
} from 'lucide-react';

export const CalendarView = ({ onSelectBooking, clubs = [] }) => {
  const [selectedDate, setSelectedDate] = useState('2026-10-15');
  const [selectedClub, setSelectedClub] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('day');

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const res = await api.getCalendar({ organizer: selectedClub });
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [selectedClub]);

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', 
    '18:00', '19:00'
  ];

  const dayBookings = bookings.filter(b => b.date === selectedDate);

  const getClubColor = (organizer) => {
    switch (organizer) {
      case 'Phoenix':
        return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' };
      case 'DEsoc':
        return { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1' };
      case 'Debuggers':
        return { bg: '#dcfce7', border: '#16a34a', text: '#15803d' };
      case 'CSI':
        return { bg: '#fef3c7', border: '#d97706', text: '#92400e' };
      default:
        return { bg: '#f3e8ff', border: '#7c3aed', text: '#6b21a8' };
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hall Reservation Calendar</h1>
          <p className="page-subtitle">Official verified schedule of confirmed JVN Hall reservations</p>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', padding: '6px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}>
            <CalendarIcon size={16} color="#64748b" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} color="#64748b" />
            <select
              value={selectedClub}
              onChange={e => setSelectedClub(e.target.value)}
              className="select-field"
              style={{ width: 170, padding: '7px 12px', fontSize: '0.84rem' }}
            >
              <option value="">All Clubs & Depts</option>
              {clubs.map(c => (
                <option key={c._id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 3, borderRadius: 10 }}>
            <button
              onClick={() => setViewMode('day')}
              className={`btn btn-sm ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Day Timeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'day' ? (
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 14, borderBottom: '1px solid #eef2f6' }}>
            <div>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0284c7', fontWeight: 800 }}>
                DAILY SCHEDULE TIMELINE
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
            </div>
            <span className="badge badge-approved">
              <CheckCircle size={12} /> {dayBookings.length} Confirmed
            </span>
          </div>

          {/* Timeline Layout */}
          <div style={{ marginTop: 10 }}>
            {timeSlots.map(time => {
              const activeBooking = dayBookings.find(b => b.startTime <= time && b.endTime > time);
              const isStartOfBooking = dayBookings.find(b => b.startTime === time);

              return (
                <div
                  key={time}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr',
                    minHeight: 64,
                    borderTop: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ paddingTop: 8, fontSize: '0.85rem', fontWeight: 700, color: '#64748b', fontFamily: 'monospace' }}>
                    {time}
                  </div>

                  <div style={{ paddingLeft: 16 }}>
                    {isStartOfBooking ? (
                      (() => {
                        const colors = getClubColor(isStartOfBooking.organizer);
                        return (
                          <div
                            onClick={() => onSelectBooking(isStartOfBooking)}
                            style={{
                              background: colors.bg,
                              borderLeft: `4px solid ${colors.border}`,
                              border: `1px solid ${colors.border}`,
                              borderRadius: 10,
                              padding: '12px 16px',
                              cursor: 'pointer',
                              marginBottom: 8,
                              transition: 'transform 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                                {isStartOfBooking.eventName}
                              </strong>
                              <span className="badge" style={{ background: '#ffffff', color: colors.text, fontSize: '0.75rem' }}>
                                {isStartOfBooking.startTime} – {isStartOfBooking.endTime}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.82rem', color: colors.text }}>
                              <span>Organized by <strong>{isStartOfBooking.organizer}</strong></span>
                              <span>•</span>
                              <span>{isStartOfBooking.bookingType}</span>
                              <span>•</span>
                              <span>{isStartOfBooking.expectedParticipants} attendees</span>
                            </div>
                          </div>
                        );
                      })()
                    ) : !activeBooking ? (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', color: '#cbd5e1', fontSize: '0.8rem' }}>
                        — Available —
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="content-card">
          <h2 className="content-card-title">All Confirmed Reservations</h2>
          {bookings.length === 0 ? (
            <div className="empty-state-box">
              <div className="empty-state-icon"><CalendarIcon size={38} strokeWidth={1.75} /></div>
              <div className="empty-state-text">No confirmed reservations found</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {bookings.map(b => {
                const colors = getClubColor(b.organizer);
                return (
                  <div
                    key={b._id}
                    onClick={() => onSelectBooking(b)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${colors.border}`,
                      borderRadius: 12,
                      padding: '16px 18px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge" style={{ background: colors.bg, color: colors.text }}>{b.organizer}</span>
                      <span className="badge badge-approved">Confirmed</span>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 10, color: '#0f172a' }}>{b.eventName}</h4>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>
                      {b.date} • {b.startTime} - {b.endTime}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
