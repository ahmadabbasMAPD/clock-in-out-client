// src/App.js
import './App.css';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './redux/authActions';
import ClockInOut from './ClockInOut';
import UserProfile from './UserProfile';
import AdminDashboard from './AdminDashboard';
import Login from './Login';
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

function App() {
  const { user, isLoading, error } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('clock');
  const [workHours, setWorkHours] = useState({ dailyHours: {}, weekTotal: 0, biweekTotal: 0 });

  useEffect(() => {
    if (user) {
      const fetchWorkHours = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await api.get('/api/users/current-user/work-hours', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setWorkHours(response.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchWorkHours();
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderChart = () => {
    const data = Object.keys(workHours.dailyHours || {})
      .map((day) => ({ name: day, hours: workHours.dailyHours[day] }))
      .sort((a, b) => new Date(a.name) - new Date(b.name));

    return (
      <ResponsiveContainer width="80%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          {/* Formatter converts the value to a number and fixes it to 2 decimals */}
          <Tooltip formatter={(value) => Number(value).toFixed(2)} />
          <Legend />
          <Bar dataKey="hours" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (!user) {
    return <Login />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Clock In and Out App</h1>
        <div className="user-info">
          <p>Welcome, {user.username}!</p>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
        {isLoading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </header>
      <main className="app-main">
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'clock' ? 'active' : ''}`}
            onClick={() => handleTabChange('clock')}
          >
            Clock In/Out
          </button>
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            User Profile
          </button>
          {isAdmin && (
            <button
              className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleTabChange('admin')}
            >
              Admin Dashboard
            </button>
          )}
          <button
            className={`tab ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => handleTabChange('chart')}
          >
            Work Hours Chart
          </button>
        </nav>
        {activeTab === 'clock' ? (
          <ClockInOut />
        ) : activeTab === 'profile' ? (
          <UserProfile user={user} />
        ) : activeTab === 'admin' ? (
          <AdminDashboard />
        ) : (
          <div className="work-hours-chart">
            <h2>Work Hours Biweekly Chart</h2>
            {renderChart()}
            <p>
              Total hours worked this week:{" "}
              {workHours.weekTotal != null ? workHours.weekTotal.toFixed(2) : "0.00"}
            </p>
            <p>
              Total hours worked this biweek:{" "}
              {workHours.biweekTotal != null ? workHours.biweekTotal.toFixed(2) : "0.00"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
