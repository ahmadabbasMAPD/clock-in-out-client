// src/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import api from './api';


const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(''); // Format "YYYY-MM"
  const [error, setError] = useState('');

  // Fetch all users from the server
  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users.');
    }
  };
  

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Find the selected user
  const selectedUser = users.find(u => u._id === selectedUserId);

  // Filter clock entries by the selected month (if selected).
  const filteredEntries = selectedUser && selectedUser.clockEntries
    ? selectedUser.clockEntries.filter(entry => {
        if (!selectedMonth) return true;
        // Extract year and month from the timestamp (YYYY-MM)
        const entryYearMonth = new Date(entry.timestamp).toISOString().slice(0, 7);
        return entryYearMonth === selectedMonth;
      })
    : [];

  // Group entries by day using the timestamp field.
  const groupEntriesByDay = (entries) => {
    const grouped = {};
    entries.forEach(entry => {
      const dateKey = new Date(entry.timestamp).toLocaleDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });
    return grouped;
  };

  const groupedEntries = groupEntriesByDay(filteredEntries);

  // Compute daily hours from a day's entries by pairing clockIn with clockOut.
  const computeDailyHours = (dayEntries) => {
    if (!dayEntries) return 0;
    const sorted = dayEntries.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const clockIn = sorted.find(e => e.type === 'clockIn');
    const clockOut = sorted.find(e => e.type === 'clockOut');
    if (clockIn && clockOut) {
      return (new Date(clockOut.timestamp) - new Date(clockIn.timestamp)) / (1000 * 60 * 60);
    }
    return 0;
  };

  // Helper: Format time into a readable string (time only)
  const formatTime = (dateInput) => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleTimeString(); // Only displays the time portion
  };

  // For the month dropdown, determine the available months (in "YYYY-MM") for the selected user.
  const availableMonths = selectedUser && selectedUser.clockEntries
    ? Array.from(
        new Set(
          selectedUser.clockEntries.map(entry =>
            new Date(entry.timestamp).toISOString().slice(0, 7)
          )
        )
      ).sort()
    : [];

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="filters">
        <label htmlFor="userSelect">Select User: </label>
        <select
          id="userSelect"
          value={selectedUserId}
          onChange={(e) => {
            setSelectedUserId(e.target.value);
            // Reset month selection when user changes
            setSelectedMonth('');
          }}
        >
          <option value="">--Select User--</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.username}
            </option>
          ))}
        </select>

        {selectedUser && (
          <>
            <label htmlFor="monthSelect">Select Month: </label>
            <select
              id="monthSelect"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">--All Months--</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {selectedUser ? (
        <>
          <h2>{selectedUser.username}'s Time Entries</h2>
          {Object.keys(groupedEntries).length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedEntries)
                  .sort((a, b) => new Date(a) - new Date(b))
                  .map(date => {
                    const dayEntries = groupedEntries[date];
                    const dailyHours = computeDailyHours(dayEntries);
                    const clockInTime = dayEntries.find(e => e.type === 'clockIn')
                      ? formatTime(dayEntries.find(e => e.type === 'clockIn').timestamp)
                      : 'N/A';
                    const clockOutTime = dayEntries.find(e => e.type === 'clockOut')
                      ? formatTime(dayEntries.find(e => e.type === 'clockOut').timestamp)
                      : 'N/A';
                    return (
                      <tr key={date}>
                        <td>{date}</td>
                        <td>{clockInTime}</td>
                        <td>{clockOutTime}</td>
                        <td>{dailyHours.toFixed(2)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          ) : (
            <p>No time entries available for the selected month.</p>
          )}
        </>
      ) : (
        <p>Please select a user from the dropdown.</p>
      )}
    </div>
  );
};

export default AdminDashboard;
