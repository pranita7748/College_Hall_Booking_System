const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('jvn_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'API request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },
  getMe: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },
  updateProfile: async (profileData) => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },
  changePassword: async (passwordData) => {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordData)
    });
    return handleResponse(res);
  },

  // Bookings
  getBookings: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/bookings${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },
  getBookingById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },
  createBooking: async (bookingData) => {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData)
    });
    return handleResponse(res);
  },
  updateBooking: async (id, bookingData) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData)
    });
    return handleResponse(res);
  },
  cancelBooking: async (id) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },
  approveBooking: async (id) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },
  rejectBooking: async (id, rejectionReason) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rejectionReason })
    });
    return handleResponse(res);
  },
  checkConflicts: async (date, startTime, endTime, excludeBookingId = '') => {
    const query = new URLSearchParams({
      date,
      startTime,
      endTime,
      ...(excludeBookingId ? { excludeBookingId } : {})
    }).toString();
    const res = await fetch(`${API_BASE_URL}/bookings/conflicts?${query}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },
  getCalendar: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/bookings/calendar${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Users
  getUsers: async () => {
    const res = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },
  createUser: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },
  updateUser: async (id, userData) => {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },
  toggleUserActive: async (id) => {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Clubs
  getClubs: async () => {
    const res = await fetch(`${API_BASE_URL}/clubs`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },
  createClub: async (clubData) => {
    const res = await fetch(`${API_BASE_URL}/clubs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(clubData)
    });
    return handleResponse(res);
  },
  updateClub: async (id, clubData) => {
    const res = await fetch(`${API_BASE_URL}/clubs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(clubData)
    });
    return handleResponse(res);
  },
  deleteClub: async (id) => {
    const res = await fetch(`${API_BASE_URL}/clubs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Hall Config
  getHall: async () => {
    const res = await fetch(`${API_BASE_URL}/hall`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },
  updateHall: async (hallData) => {
    const res = await fetch(`${API_BASE_URL}/hall`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(hallData)
    });
    return handleResponse(res);
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/audit-logs${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};
