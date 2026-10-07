import React from 'react';
import '../Styling/SignatureDivider.css';

export const SignatureDivider = () => {
  return (
    <div className="premium-divider" aria-hidden="true">
      <div className="premium-divider-line"></div>
      <div className="premium-divider-dot"></div>
      <div className="premium-divider-line"></div>
    </div>
  );
};