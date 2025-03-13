// src/ClockInOut.js
import React, { useState, useEffect, useCallback } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import './ClockInOut.css';
import api from './api';

const ClockInOut = () => {
  const [user, setUser] = useState(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [error, setError] = useState('');

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

  const grouped = groupEntriesByDay();
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

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

      {/* Display clock entries grouped by day */}
      <div className="entries-grid">
        {sortedDates.map(date => {
          const dayEntries = grouped[date];

          // Safely process clockIn entry
          const clockInEntry = dayEntries.find(e => e.type === 'clockIn');
          const clockInTime = clockInEntry ? new Date(clockInEntry.timestamp) : null;
          const formattedClockIn =
            clockInTime && !isNaN(clockInTime.getTime())
              ? new Intl.DateTimeFormat('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                  timeZoneName: 'short',
                }).format(clockInTime)
              : 'N/A';

          // Safely process clockOut entry
          const clockOutEntry = dayEntries.find(e => e.type === 'clockOut');
          const clockOutTime = clockOutEntry ? new Date(clockOutEntry.timestamp) : null;
          const formattedClockOut =
            clockOutTime && !isNaN(clockOutTime.getTime())
              ? new Intl.DateTimeFormat('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                  timeZoneName: 'short',
                }).format(clockOutTime)
              : 'N/A';

          return (
            <div className="day-entries" key={date}>
              <h3>{date}</h3>
              <div className="entry-item">
                <div className="entry-type">Clock In:</div>
                <div className="entry-time">{formattedClockIn}</div>
              </div>
              <div className="entry-item">
                <div className="entry-type">Clock Out:</div>
                <div className="entry-time">{formattedClockOut}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClockInOut;
