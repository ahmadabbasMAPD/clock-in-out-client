// src/UserProfile.js
import React, { useState, useEffect } from 'react';
import api from './api';
import './UserProfile.css';

const UserProfile = ({ user: initialUser }) => {
  // If no initial user is provided, initialize with an empty object.
  const [user, setUser] = useState(initialUser || {});
  const [username, setUsername] = useState(initialUser?.username || '');
  const [role, setRole] = useState(initialUser?.role || 'user');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Update local state if the passed-in user prop changes.
  useEffect(() => {
    setUser(initialUser || {});
    setUsername(initialUser?.username || '');
    setRole(initialUser?.role || 'user');
  }, [initialUser]);

  // If user._id is not present but we have a token, fetch the user from the API.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user._id && token) {
      const fetchUser = async () => {
        try {
          const response = await api.get('/api/users/current-user', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
          setUsername(response.data.username || '');
          setRole(response.data.role || 'user');
          setError('');
        } catch (err) {
          console.error('Error fetching profile:', err);
          setError('Failed to fetch user profile.');
        }
      };
      fetchUser();
    }
  }, [user, initialUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      // Update only username and role.
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

  // If no token exists, ask the user to log in.
  if (!localStorage.getItem('token')) {
    return <div>Please log in.</div>;
  }

  // If user data (i.e. _id) isn't loaded yet, show a loading indicator.
  if (!user._id) {
    return <div>Loading user profile...</div>;
  }

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
