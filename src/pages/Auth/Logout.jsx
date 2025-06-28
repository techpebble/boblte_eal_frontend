// src/pages/Logout.js
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/userContext';

const Logout = () => {
  const navigate = useNavigate();
  const {user, updateUser, clearUser} = useContext(UserContext);

  useEffect(() => {
    // Clear local storage or cookies
    localStorage.removeItem('token');

    // Optional: call logout API here if backend has a logout endpoint

    // Redirect to login or home
    clearUser();
    navigate('/login');
  }, [navigate]);

  return null; // or a loader/spinner if you like
};

export default Logout;
