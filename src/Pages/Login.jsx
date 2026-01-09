import React from 'react'
import netlifyIdentity from "netlify-identity-widget";
import '../Styling/Login.css'
export const Login = () => {
    const handleLogin = () => {
    netlifyIdentity.open();
  };
  return (
    <div className='login-container page'>
      <h1>Employee Login</h1>
      <button onClick={handleLogin}>
        Login
      </button>
    </div>
  );
}

