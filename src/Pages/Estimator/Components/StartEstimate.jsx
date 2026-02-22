import React, { useEffect, useState } from "react";

export const StartEstimate = ({ initialCustomer, onNext }) => {
  const [firstName, setFirstName] = useState(initialCustomer?.firstName || "");
  const [lastName, setLastName] = useState(initialCustomer?.lastName || "");
  const [address, setAddress] = useState(initialCustomer?.address || "");

  useEffect(() => {
    // keep in sync if initial changes (optional)
    setFirstName(initialCustomer?.firstName || "");
    setLastName(initialCustomer?.lastName || "");
    setAddress(initialCustomer?.address || "");
  }, [initialCustomer]);

  const canContinue = firstName.trim() && lastName.trim() && address.trim();

  const handleNext = () => {
    if (!canContinue) return;

    onNext({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      address: address.trim(),
    });
  };

  return (
    <div className="jobtype-card">
      <h1>Start an Estimate</h1>
      <p>Enter customer details to begin.</p>

      <div className="start-estimate-form">
        <label>
          <span>First Name</span>
          <input
            className="dim-input"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
          />
        </label>

        <label>
          <span>Last Name</span>
          <input
            className="dim-input"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Smith"
          />
        </label>

        <label>
          <span>Address</span>
          <input
            className="dim-input"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, Cape Coral, FL"
          />
        </label>

        <button
          type="button"
          className="add-area-btn add"
          onClick={handleNext}
          disabled={!canContinue}
          style={{ opacity: canContinue ? 1 : 0.6 }}
        >
          Next
        </button>
      </div>
    </div>
  );
}