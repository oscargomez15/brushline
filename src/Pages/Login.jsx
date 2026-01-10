import React, { useEffect } from 'react'
import netlifyIdentity from "netlify-identity-widget";
import { useNavigate } from "react-router-dom";
import '../Styling/Login.css'

export const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    netlifyIdentity.init();

    // If already logged in, go straight to estimator
    const user = netlifyIdentity.currentUser();
    if (user) navigate("/estimator");

    const onLogin = () => {
      netlifyIdentity.close();
      navigate("/estimator");
    };

    netlifyIdentity.on("login", onLogin);

    return () => {
      netlifyIdentity.off("login", onLogin);
    };
  }, [navigate]);

  return (
    <div className="login-page">
      <h1>Login</h1>
      <button
        type="button"
        className="collapse-area-btn"
        onClick={() => netlifyIdentity.open("login")}
      >
        Open Login
      </button>
    </div>
  );
}

