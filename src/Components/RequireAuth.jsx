import netlifyIdentity from "netlify-identity-widget";
import { Navigate, Outlet } from "react-router-dom";

export default function RequireAuth() {
const isDev = process.env.NODE_ENV && window.location.hostname === "localhost";  const user = netlifyIdentity.currentUser();

  if (!user && !isDev) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
