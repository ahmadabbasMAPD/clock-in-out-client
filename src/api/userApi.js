import axiosInstance from '../axiosInstance';

export const getUserDetails = async () => {
    try {
        const response = await axiosInstance.get('/users/me');
        return response.data; // Returns user details
    } catch (error) {
        console.error('Error fetching user details:', error.response?.data || error.message);
        throw error;
    }
};
