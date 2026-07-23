import netlifyIdentity from "netlify-identity-widget";
import { Navigate, Outlet } from "react-router-dom";

export default function RequireAuth() {
  const isLocalDev =
    process.env.NODE_ENV === "development" &&
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const user = netlifyIdentity.currentUser();

  if (!user && !isLocalDev) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
