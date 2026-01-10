import { useEffect, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";

export function IdentityControls() {
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

  const handleLogout = async() => {
    await netlifyIdentity.logout();
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
