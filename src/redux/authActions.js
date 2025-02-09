// src/redux/authActions.js
import axios from 'axios';

export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const LOGOUT_REQUEST = 'LOGOUT_REQUEST';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';
export const LOGOUT_FAILURE = 'LOGOUT_FAILURE';

export const loginRequest = () => ({
  type: LOGIN_REQUEST,
});

export const login = (user) => {
  if (user.token) {
    localStorage.setItem('token', user.token);
  }
  localStorage.setItem('user', JSON.stringify(user));
  return { type: LOGIN, payload: user };
};

export const loginFailure = (error) => ({
  type: LOGIN_FAILURE,
  payload: error,
});

export const logoutRequest = () => ({
  type: LOGOUT_REQUEST,
});

export const logoutSuccess = () => ({
  type: LOGOUT_SUCCESS,
});

export const logoutFailure = (error) => ({
  type: LOGOUT_FAILURE,
  payload: error,
});

// Async action to perform login
export const performLogin = (credentials) => async (dispatch) => {
  dispatch(loginRequest());
  try {
    // The proxy setting in package.json forwards this request to your server (http://localhost:3001)
    const response = await axios.post('/api/auth/login', credentials);
    dispatch(login(response.data));
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    dispatch(loginFailure(errorMsg));
  }
};

// Async action to perform logout
export const performLogout = () => async (dispatch) => {
  dispatch(logoutRequest());
  try {
    await axios.post('/api/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logoutSuccess());
    window.location.href = '/';
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    dispatch(logoutFailure(errorMsg));
  }
};

// Export an alias "logout" that points to performLogout so that App.js can import { logout }
export const logout = performLogout;
