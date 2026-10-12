import React from 'react';
import { X, Calendar, Clock, Users, User, Shield, Info, AlertOctagon } from 'lucide-react';

export const BookingDetailsModal = ({ booking, onClose, onEdit, onCancel, canManage }) => {
  if (!booking) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-approved">Confirmed / Approved</span>;
      case 'PENDING':
        return <span className="badge badge-pending">Pending HOD Review</span>;
      case 'REJECTED':
        return <span className="badge badge-rejected">Rejected</span>;
      case 'CANCELLED':
        return <span className="badge badge-cancelled">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{booking.eventName}</h2>
              {getStatusBadge(booking.status)}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Organized by <strong style={{ color: '#0f172a' }}>{booking.organizer}</strong> • {booking.bookingType}
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 8px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {booking.status === 'REJECTED' && booking.rejectionReason && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: 12,
            padding: '14px',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b91c1c', fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>
              <AlertOctagon size={16} /> Rejection Reason from Approver:
            </div>
            <div style={{ color: '#dc2626', fontSize: '0.88rem' }}>
              "{booking.rejectionReason}"
            </div>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 22
        }}>
          <div style={{ background: '#f8fafc', border: '1px solid #eef2f6', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} /> Date
            </div>
            <div style={{ fontWeight: 700, marginTop: 4, fontSize: '0.98rem', color: '#0f172a' }}>{booking.date}</div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #eef2f6', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> Time Interval
            </div>
            <div style={{ fontWeight: 700, marginTop: 4, fontSize: '0.98rem', color: '#0f172a' }}>
              {booking.startTime} – {booking.endTime}
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #eef2f6', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} /> Expected Crowd
            </div>
            <div style={{ fontWeight: 700, marginTop: 4, fontSize: '0.98rem', color: '#0f172a' }}>
              {booking.expectedParticipants} Participants
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #eef2f6', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} /> Priority Level
            </div>
            <div style={{ fontWeight: 700, marginTop: 4, fontSize: '0.98rem', color: '#0f172a' }}>
              {booking.priority} Priority
            </div>
          </div>
        </div>

        {booking.guestName && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Speaker / Chief Guest:</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
              {booking.guestName}
            </div>
          </div>
        )}

        {booking.description && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Event Description:</div>
            <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: 4, whiteSpace: 'pre-line' }}>
              {booking.description}
            </div>
          </div>
        )}

        <div style={{
          padding: '14px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 10,
          border: '1px solid var(--border-subtle)',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          marginBottom: 20
        }}>
          <div>Requested by: <strong>{booking.requestedBy?.name || 'Club Representative'}</strong> ({booking.requestedBy?.email})</div>
          {booking.approvedBy && (
            <div style={{ marginTop: 4 }}>
              Approved / Handled by: <strong>{booking.approvedBy?.name}</strong>
            </div>
          )}
          <div style={{ marginTop: 4 }}>Submitted on: {new Date(booking.createdAt).toLocaleString()}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          {canManage && booking.status === 'PENDING' && (
            <>
              <button
                onClick={() => {
                  onClose();
                  onEdit(booking);
                }}
                className="btn btn-secondary btn-sm"
              >
                Modify Request
              </button>
              <button
                onClick={() => {
                  onCancel(booking._id);
                  onClose();
                }}
                className="btn btn-danger btn-sm"
              >
                Cancel Request
              </button>
            </>
          )}
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
