import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import netlifyIdentity from "netlify-identity-widget";

export function IdentityControls() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    netlifyIdentity.init();

    setUser(netlifyIdentity.currentUser());

    netlifyIdentity.on("login", (user) => setUser(user));
    netlifyIdentity.on("logout", () => setUser(null));

    return () => {
      netlifyIdentity.off("login");
      netlifyIdentity.off("logout");
    };
  }, []);

  const handleLogout = () => {
    netlifyIdentity.logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="identity-controls">
      <span className="identity-email">{user.email}</span>
      <button
        type="button"
        className="collapse-area-btn"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
}
