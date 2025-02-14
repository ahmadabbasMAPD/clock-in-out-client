// src/ClockInOut.js
import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './ClockInOut.css';
import api from './api';

const ClockInOut = () => {
  // Initialize user state as null so that the login screen shows if not logged in.
  const [user, setUser] = useState(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [error, setError] = useState('');
  
  // Modal state for editing time entries
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [editDate, setEditDate] = useState(null);
  const [editClockIn, setEditClockIn] = useState(new Date());
  const [editClockOut, setEditClockOut] = useState(new Date());

  // Fetch the current user (with clockEntries) from the server.
  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found');
        return;
      }
      const response = await api.get('/api/users/current-user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
      setIsClockedIn(response.data?.clockedIn || false);
      setError('');
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to fetch user status.');
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Handler for clock in using the server endpoint.
  const handleClockIn = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentTime = new Date();
      await api.put(
        `/api/users/current-user/clock-in`,
        { time: currentTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Re-fetch user data to update the UI
      await fetchUser();
      setIsClockedIn(true);
      setError('');
    } catch (err) {
      console.error('Clock In error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to clock in.';
      setError(errorMsg);
    }
  };

  // Handler for clock out using the server endpoint.
  const handleClockOut = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentTime = new Date();
      await api.put(
        `/api/users/current-user/clock-out`,
        { time: currentTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Re-fetch user data to update the UI
      await fetchUser();
      setIsClockedIn(false);
      setError('');
    } catch (err) {
      console.error('Clock Out error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to clock out.';
      setError(errorMsg);
    }
  };

  // Group clock entries by day using the timestamp field.
  const groupEntriesByDay = () => {
    if (!user?.clockEntries) return {};
    const grouped = {};
    user.clockEntries.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      const dateKey = entryDate.toLocaleDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });
    return grouped;
  };

  // Open the edit modal for a given day.
  const handleEdit = (day) => {
    setEditDate(day);
    setModalError('');
    const grouped = groupEntriesByDay();
    const dayKey = day.toLocaleDateString();
    const entries = grouped[dayKey] || [];
    const clockInEntry = entries.find(e => e.type === 'clockIn');
    const clockOutEntry = entries.find(e => e.type === 'clockOut');

    if (!clockInEntry && !clockOutEntry) {
      setModalError('No existing time entries for this day to edit.');
      return;
    }

    const defaultClockIn = new Date(day);
    defaultClockIn.setHours(9, 0, 0, 0);
    const defaultClockOut = new Date(day);
    defaultClockOut.setHours(17, 0, 0, 0);

    setEditClockIn(clockInEntry ? new Date(clockInEntry.timestamp) : defaultClockIn);
    setEditClockOut(clockOutEntry ? new Date(clockOutEntry.timestamp) : defaultClockOut);
    setShowModal(true);
  };

  // Save the edited time entries by calling the server endpoint.
  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !editDate) return;
    try {
      const token = localStorage.getItem('token');
      const payload = {
        date: editDate.toISOString().split('T')[0],
        clockIn: editClockIn ? editClockIn.toISOString() : undefined,
        clockOut: editClockOut ? editClockOut.toISOString() : undefined,
      };

      const response = await api.put(
        '/api/users/current-user/time-entries',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // After saving, re-fetch the user data so that updated clockEntries are reflected
      await fetchUser();
      setShowModal(false);
      setModalError('');
    } catch (err) {
      console.error('Error updating time entries:', err);
      const errorMsg = err.response?.data?.error || 'Failed to update time entries.';
      setModalError(errorMsg);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalError('');
  };

  // Format a date into a full readable string.
  const formatDate = (dateInput) => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short',
    }).format(date);
  };

  const grouped = groupEntriesByDay();
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

  // Render a loading state if user is null.
  if (!user) return <div>Loading...</div>;

  return (
    <div className="clock-in-out-container">
      <h1 className="status">{user?.clockedIn ? 'Clocked In' : 'Clocked Out'}</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="button-container">
        <button className="clock-button" onClick={handleClockIn} disabled={user?.clockedIn}>
          Clock In
        </button>
        <button className="clock-button" onClick={handleClockOut} disabled={!user?.clockedIn}>
          Clock Out
        </button>
      </div>

      {/* Grouped view of time entries */}
      <div className="entries-grid">
        {sortedDates.map(date => (
          <div className="day-entries" key={date}>
            <h3>{date}</h3>
            <div className="entry-item">
              <div className="entry-type">Clock In:</div>
              <div className="entry-time">{formatDate(grouped[date].find(e => e.type === 'clockIn')?.timestamp)}</div>
            </div>
            <div className="entry-item">
              <div className="entry-type">Clock Out:</div>
              <div className="entry-time">{formatDate(grouped[date].find(e => e.type === 'clockOut')?.timestamp)}</div>
            </div>
            <button className="edit-button" onClick={() => handleEdit(new Date(date))}>
              <span role="img" aria-label="edit">✏️</span>
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>Edit Time Entries for {editDate.toLocaleDateString()}</h2>
      {modalError && <p className="modal-error" style={{ color: 'red' }}>{modalError}</p>}
      <form onSubmit={handleSave}>
        <div>
          <label>Clock In:</label>
          <DatePicker
            selected={editClockIn}
            onChange={(date) => setEditClockIn(date)}
            showTimeSelect
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="MMMM d, yyyy h:mm aa"
            name="clockIn"
          />
        </div>
        <div>
          <label>Clock Out:</label>
          <DatePicker
            selected={editClockOut}
            onChange={(date) => setEditClockOut(date)}
            showTimeSelect
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="MMMM d, yyyy h:mm aa"
            name="clockOut"
          />
        </div>
        <div className="modal-buttons">
          <button type="submit">Save Changes</button>
          <button type="button" onClick={handleCloseModal}>Cancel</button>
        </div>
      </form>
    </div>
  </div>
)}

    </div>
  );
};

export default ClockInOut;
