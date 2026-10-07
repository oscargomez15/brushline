import React, { useEffect, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import { useLocation, useNavigate } from "react-router-dom";
import "../Styling/Login.css";

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from || "/crm/dashboard";

  const [mode, setMode] = useState("login"); // "login" | "signup" | "recovery"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // If already logged in, go straight to estimator
    const user = netlifyIdentity.currentUser();
    if (user) navigate(destination, { replace: true });

    const onLogin = () => navigate(destination, { replace: true });

    // If you want to handle signup/login events globally
    netlifyIdentity.on("login", onLogin);

    return () => {
      netlifyIdentity.off("login", onLogin);
    };
  }, [destination, navigate]);

const handleLogin = async (e) => {
  e.preventDefault();
  setError("");
  setMessage("");
  setLoading(true);

  try {
    // IMPORTANT: use gotrue for custom login
    await netlifyIdentity.gotrue.login(email, password, true);

    // optional: you can navigate here OR rely on the "login" event listener
    navigate(destination, { replace: true });
  } catch (err) {
    setError(err?.message || "Login failed. Check your email/password.");
  } finally {
    setLoading(false);
  }
};

    const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
        await netlifyIdentity.gotrue.signup(email, password, {});
        setMessage("Account created. Check your email to confirm, then log in.");
        setMode("login");
    } catch (err) {
        setError(err?.message || "Signup failed.");
    } finally {
        setLoading(false);
    }
    };

  const handleRecovery = async (e) => {
  e.preventDefault();
  setError("");
  setMessage("");
  setLoading(true);

  try {
    await netlifyIdentity.gotrue.requestPasswordRecovery(email);
    setMessage("Recovery email sent. Check your inbox.");
  } catch (err) {
    setError(err?.message || "Recovery failed.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>
          {mode === "login" && "Log in"}
          {mode === "signup" && "Create account"}
          {mode === "recovery" && "Reset password"}
        </h2>

        {error && <p className="login-error">{error}</p>}
        {message && <p className="login-message">{message}</p>}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="password-row">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="show-hide-btn"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>

            <div className="login-links">
              <button type="button" onClick={() => setMode("recovery")}>
                Forgot password?
              </button>
              <button type="button" onClick={() => setMode("signup")}>
                Create account
              </button>
            </div>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup} className="login-form">
            <input
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="password-row">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="show-hide-btn"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </button>

            <div className="login-links">
              <button type="button" onClick={() => setMode("login")}>
                Back to login
              </button>
            </div>
          </form>
        )}

        {mode === "recovery" && (
          <form onSubmit={handleRecovery} className="login-form">
            <input
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send recovery email"}
            </button>

            <div className="login-links">
              <button type="button" onClick={() => setMode("login")}>
                Back to login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
