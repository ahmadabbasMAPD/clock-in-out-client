import React from 'react';
import ClockInOut from './ClockInOut';
import UserProfile from './UserProfile';

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <ClockInOut />
      <UserProfile />
    </div>
  );
}

export default Dashboard;