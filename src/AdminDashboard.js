// src/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import api from './api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(''); // Format "YYYY-MM"
  const [error, setError] = useState('');

  // States for "Add User" modal and messaging
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newPhone, setNewPhone] = useState('');
  const [addUserError, setAddUserError] = useState('');
  const [addUserSuccess, setAddUserSuccess] = useState('');

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

  // Find the selected user (if any)
  const selectedUser = users.find((u) => u._id === selectedUserId);

  // For the selected user, filter clock entries by the selected month.
  const filteredEntries =
    selectedUser && selectedUser.clockEntries
      ? selectedUser.clockEntries.filter((entry) => {
          if (!selectedMonth) return true;
          const entryYearMonth = new Date(entry.timestamp)
            .toISOString()
            .slice(0, 7);
          return entryYearMonth === selectedMonth;
        })
      : [];

  // Group entries by day using the timestamp field.
  const groupEntriesByDay = (entries) => {
    const grouped = {};
    entries.forEach((entry) => {
      const dateKey = new Date(entry.timestamp).toLocaleDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });
    return grouped;
  };

  const groupedEntries = groupEntriesByDay(filteredEntries);

  // Compute daily hours by pairing the earliest clockIn with the latest clockOut.
  const computeDailyHours = (dayEntries) => {
    if (!dayEntries || dayEntries.length === 0) return 0;
    const clockIns = dayEntries.filter((e) => e.type === 'clockIn');
    const clockOuts = dayEntries.filter((e) => e.type === 'clockOut');
    if (clockIns.length === 0 || clockOuts.length === 0) return 0;
    const earliestClockIn = new Date(
      Math.min(...clockIns.map((e) => new Date(e.timestamp).getTime()))
    );
    const latestClockOut = new Date(
      Math.max(...clockOuts.map((e) => new Date(e.timestamp).getTime()))
    );
    return (latestClockOut - earliestClockIn) / (1000 * 60 * 60);
  };

  // Compute weekly total hours for a user.
  const computeUserWeeklyHours = (user) => {
    if (!user.clockEntries) return 0;
    const grouped = groupEntriesByDay(user.clockEntries);
    let total = 0;
    Object.keys(grouped).forEach((day) => {
      total += computeDailyHours(grouped[day]);
    });
    return total;
  };

  // Prepare data for overall chart: each user's weekly total hours.
  const overallData = users.map((user) => ({
    username: user.username,
    weeklyHours: computeUserWeeklyHours(user),
  }));

  // Prepare data for detailed chart: selected user's daily hours for the selected month.
  const detailedData = Object.keys(groupedEntries)
    .map((date) => ({
      date,
      hours: computeDailyHours(groupedEntries[date]),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // For the month dropdown, determine the available months for the selected user.
  const availableMonths =
    selectedUser && selectedUser.clockEntries
      ? Array.from(
          new Set(
            selectedUser.clockEntries.map((entry) =>
              new Date(entry.timestamp).toISOString().slice(0, 7)
            )
          )
        ).sort()
      : [];

  // --- Add User Functionality ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Pass phone as an empty string if not provided.
      const response = await api.post(
        '/api/auth/register',
        {
          username: newUsername,
          password: newPassword,
          role: newRole,
          phone: newPhone || '',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchAllUsers();
      setShowAddUserModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      setNewPhone('');
      setAddUserError('');
      setAddUserSuccess('User added successfully!');
      // Clear the success message after 3 seconds.
      setTimeout(() => setAddUserSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding user:', err);
      const errorMsg =
        err.response?.data?.error || 'Failed to add user.';
      setAddUserError(errorMsg);
    }
  };

  const handleCloseAddUserModal = () => {
    setShowAddUserModal(false);
    setAddUserError('');
  };

  // Format a date into a readable string.
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

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {addUserSuccess && <p style={{ color: 'green' }}>{addUserSuccess}</p>}

      {/* Add User Section */}
      <div className="add-user-section">
        <button
          onClick={() => setShowAddUserModal(true)}
          className="add-user-button"
        >
          Add User
        </button>
      </div>

      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New User</h2>
            {addUserError && (
              <p style={{ color: 'red' }}>{addUserError}</p>
            )}
            <form onSubmit={handleAddUser}>
              <div>
                <label>Username:</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Role:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label>Phone:</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  // Removed the required attribute so phone is optional.
                />
              </div>
              <div className="modal-buttons">
                <button type="submit">Add User</button>
                <button type="button" onClick={handleCloseAddUserModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters for detailed charts */}
      <div className="filters">
  <div className="filter-group">
    <label htmlFor="userSelect">Select User: </label>
    <select
      id="userSelect"
      value={selectedUserId}
      onChange={(e) => {
        setSelectedUserId(e.target.value);
        setSelectedMonth('');
      }}
    >
      <option value="">--Select User--</option>
      {users.map((user) => (
        <option key={user._id} value={user._id}>
          {user.username}
        </option>
      ))}
    </select>
  </div>

  {selectedUser && (
    <div className="filter-group">
      <label htmlFor="monthSelect">Select Month: </label>
      <select
        id="monthSelect"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
      >
        <option value="">--All Months--</option>
        {availableMonths.map((month) => (
          <option key={month} value={month}>
            {month}
          </option>
        ))}
      </select>
    </div>
  )}
</div>


      {selectedUser ? (
        <>
          <h2>{selectedUser.username}'s Detailed Time Entries</h2>
          {detailedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={detailedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                <Legend />
                <Bar dataKey="hours" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No detailed time entries available for the selected month.</p>
          )}

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
                  .map((date) => {
                    const dayEntries = groupedEntries[date];
                    const dailyHours = computeDailyHours(dayEntries);
                    const clockInTime = dayEntries.find(
                      (e) => e.type === 'clockIn'
                    )
                      ? new Date(
                          dayEntries.find((e) => e.type === 'clockIn').timestamp
                        ).toLocaleTimeString()
                      : 'N/A';
                    const clockOutTime = dayEntries.find(
                      (e) => e.type === 'clockOut'
                    )
                      ? new Date(
                          dayEntries.find((e) => e.type === 'clockOut').timestamp
                        ).toLocaleTimeString()
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

      <h2>Weekly Total Hours for All Users</h2>
      {overallData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={overallData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="username" />
            <YAxis />
            <Tooltip formatter={(value) => Number(value).toFixed(2)} />
            <Legend />
            <Bar dataKey="weeklyHours" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p>No user data available.</p>
      )}
    </div>
  );
};

export default AdminDashboard;
