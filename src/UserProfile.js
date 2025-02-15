// src/UserProfile.js
import React, { useState, useEffect } from 'react';
import api from './api';


const UserProfile = ({ user: initialUser }) => {
  // Local state for the user data and form fields.
  const [user, setUser] = useState(initialUser);
  const [username, setUsername] = useState(initialUser?.username || '');
  const [role, setRole] = useState(initialUser?.role || 'user');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Update local state if the passed-in user prop changes.
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setUsername(initialUser.username || '');
      setRole(initialUser.role || 'user');
    }
  }, [initialUser]);

  // If user is not loaded or doesn't have an _id, display a loading indicator.
  if (!user || !user._id) {
    return <div>Loading user profile...</div>;
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      // Only update username and role. (Phone number is not editable.)
      const response = await api.put(
        `/api/users/${user._id}`,
        { username, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
          <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
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
