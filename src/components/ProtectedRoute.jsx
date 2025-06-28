// src/components/ProtectedRoute.js
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { useUserAuth } from "../hooks/useUserAuth";
import { UserContext } from "../context/userContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(UserContext);

  useUserAuth(); // triggers the effect to fetch user info or redirect

  if (user === null) {
    return <div className="text-center mt-10">Checking authentication...</div>;
  }

  return children;
};

export default ProtectedRoute;
