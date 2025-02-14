// src/UserProfile.js
import React, { useState, useEffect } from 'react';
import api from './api';
import './UserProfile.css';

const UserProfile = ({ user: initialUser }) => {
  // Local state for the user data and form fields.
  const [user, setUser] = useState(initialUser);
  const [username, setUsername] = useState(initialUser.username || '');
  const [phone, setPhone] = useState(initialUser.phone || '');
  const [role, setRole] = useState(initialUser.role || 'user');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Update local state if the passed-in user prop changes.
  useEffect(() => {
    setUser(initialUser);
    setUsername(initialUser.username || '');
    setPhone(initialUser.phone || '');
    setRole(initialUser.role || 'user');
  }, [initialUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      // Send a PUT request to update the user's details.
      const response = await api.put(`/api/users/${user._id}`, { username, phone, role }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      const errMsg = err.response?.data?.error || 'Failed to update profile.';
      setError(errMsg);
    }
  };

  return (
    <div className="user-profile">
      <h2>User Profile</h2>
      {message && <p className="success-message" style={{ color: 'green' }}>{message}</p>}
      {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
      
      {!isEditing ? (
        <div className="profile-display">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="profile-form">
          <div>
            <label>Username:</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Phone:</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Role:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-buttons">
            <button type="submit">Save Changes</button>
            <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserProfile;
