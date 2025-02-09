// src/UserProfile.js
import React from 'react';
//import './UserProfile.css'; // Optional: your custom user profile styles

const UserProfile = ({ user }) => {
  return (
    <div className="user-profile">
      <h2>User Profile</h2>
      <p>Username: {user.username}</p>
      <p>Role: {user.role}</p>
      {user.phone && <p>Phone: {user.phone}</p>}
      {user.lastClockIn && <p>Last Clock In: {new Date(user.lastClockIn).toLocaleString()}</p>}
      {user.lastClockOut && <p>Last Clock Out: {new Date(user.lastClockOut).toLocaleString()}</p>}
    </div>
  );
};

export default UserProfile;
