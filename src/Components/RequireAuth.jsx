// RequireAuth.jsx
import React from "react";
import netlifyIdentity from "netlify-identity-widget";
import { Navigate, Outlet } from "react-router-dom";

export default function RequireAuth() {
  const user = netlifyIdentity.currentUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}