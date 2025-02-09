import { createSlice } from '@reduxjs/toolkit';
import { LOGIN, LOGOUT, LOGIN_REQUEST, LOGIN_FAILURE } from './authActions';

const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {}, // Actions are handled externally
    extraReducers: (builder) => {
        builder
            .addCase(LOGIN_REQUEST, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(LOGIN, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.token = action.payload.token;
                state.error = null;
            })
            .addCase(LOGIN_FAILURE, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(LOGOUT, (state) => {
                state.user = null;
                state.token = null;
                state.isLoading = false;
                state.error = null;
            });
    },
});

export default authSlice.reducer;
