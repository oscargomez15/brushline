import React, { useEffect, useRef, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import "../../../Styling/StartEstimate.css";

export const StartEstimate = ({ initialCustomer, onNext }) => {
  const [mode, setMode] = useState(null); // "new" | "existing" | null

  const [firstName, setFirstName] = useState(initialCustomer?.firstName || "");
  const [lastName, setLastName] = useState(initialCustomer?.lastName || "");
  const [address, setAddress] = useState(initialCustomer?.address || "");
  const [unit, setUnit] = useState(initialCustomer?.unit || "");
  const [email, setEmail] = useState(initialCustomer?.email || "");
  const [phone, setPhone] = useState(initialCustomer?.phone || "");
  const [customerId, setCustomerId] = useState(initialCustomer?.customerId || "");

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [searchErr, setSearchErr] = useState("");

  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);

  const autoServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const debounceRef = useRef(null);
  const customerSearchDebounceRef = useRef(null);

  useEffect(() => {
    const fn = initialCustomer?.firstName || "";
    const ln = initialCustomer?.lastName || "";
    const addr = initialCustomer?.address || "";
    const unitVal = initialCustomer?.unit || "";
    const emailVal = initialCustomer?.email || "";
    const phoneVal = initialCustomer?.phone || "";
    const customerIdVal = initialCustomer?.customerId || "";

    setFirstName(fn);
    setLastName(ln);
    setAddress(addr);
    setUnit(unitVal);
    setEmail(emailVal);
    setPhone(phoneVal);
    setCustomerId(customerIdVal);

    if (fn || ln || addr) {
      setMode(customerIdVal ? "existing" : "new");
    }
  }, [initialCustomer]);

  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Missing REACT_APP_GOOGLE_MAPS_API_KEY");
      return;
    }

    const init = () => {
      if (!window.google?.maps?.places) return;

      autoServiceRef.current = new window.google.maps.places.AutocompleteService();

      const dummy = document.createElement("div");
      placesServiceRef.current = new window.google.maps.places.PlacesService(dummy);
    };

    if (window.google?.maps?.places) {
      init();
      return;
    }

    const existing = document.querySelector('script[data-google-places="true"]');
    if (existing) {
      existing.addEventListener("load", init, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googlePlaces = "true";
    script.onload = init;
    document.head.appendChild(script);
  }, []);

  const fetchPredictions = (text) => {
    if (!autoServiceRef.current || !text.trim()) {
      setPredictions([]);
      return;
    }

    autoServiceRef.current.getPlacePredictions(
      {
        input: text,
        types: ["address"],
        componentRestrictions: { country: "us" },
      },
      (preds) => {
        setPredictions(preds || []);
      }
    );
  };

  const onAddressChange = (val) => {
    setAddress(val);
    setShowPredictions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 200);
  };

  const selectPrediction = (p) => {
    setAddress(p.description);
    setPredictions([]);
    setShowPredictions(false);

    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        {
          placeId: p.place_id,
          fields: ["formatted_address"],
        },
        (place, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place?.formatted_address
          ) {
            setAddress(place.formatted_address);
          }
        }
      );
    }
  };

  useEffect(() => {
    if (mode !== "existing") return;

    const q = customerSearch.trim();

    if (!q) {
      setCustomerResults([]);
      setSearchErr("");
      return;
    }

    if (customerSearchDebounceRef.current) {
      clearTimeout(customerSearchDebounceRef.current);
    }

    customerSearchDebounceRef.current = setTimeout(async () => {
      try {
        setSearchingCustomers(true);
        setSearchErr("");

        const user = netlifyIdentity.currentUser();
        const jwt = user ? await user.jwt() : null;
        if (!jwt) throw new Error("You must be logged in.");

        const res = await fetch(
          `/.netlify/functions/list-customers?q=${encodeURIComponent(q)}&limit=8`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to search customers");

        setCustomerResults(data.items || []);
      } catch (e) {
        setSearchErr(e.message);
      } finally {
        setSearchingCustomers(false);
      }
    }, 250);

    return () => {
      if (customerSearchDebounceRef.current) {
        clearTimeout(customerSearchDebounceRef.current);
      }
    };
  }, [customerSearch, mode]);

  const handlePickCustomer = (customer) => {
    setCustomerId(customer.id || "");
    setFirstName(customer.firstName || "");
    setLastName(customer.lastName || "");
    setAddress(customer.address || "");
    setUnit(customer.unit || "");
    setEmail(customer.email || "");
    setPhone(customer.phone || "");
    setCustomerSearch(customer.fullName || "");
    setCustomerResults([]);
    setSearchErr("");
  };

  const resetForm = () => {
    setCustomerId("");
    setFirstName("");
    setLastName("");
    setAddress("");
    setUnit("");
    setEmail("");
    setPhone("");
    setCustomerSearch("");
    setCustomerResults([]);
    setSearchErr("");
    setPredictions([]);
    setShowPredictions(false);
  };

  const handleChooseNew = () => {
    resetForm();
    setMode("new");
  };

  const handleChooseExisting = () => {
    resetForm();
    setMode("existing");
  };

  const canContinue =
    firstName.trim() && lastName.trim() && address.trim();

  const handleNext = async () => {
    if (!canContinue) return;
    if (typeof onNext !== "function") return;

    try {
      const user = netlifyIdentity.currentUser();
      const jwt = user ? await user.jwt() : null;
      if (!jwt) throw new Error("You must be logged in.");

      const res = await fetch("/.netlify/functions/save-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          id: customerId || undefined,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          address: address.trim(),
          unit: unit.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save customer");

      onNext({
        customerId: data.customer?.id || customerId || "",
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
        unit: unit.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="start-estimate-page">
      <div className="jobtype-card">
        <h1>Start an Estimate</h1>

        {!mode && (
          <div className="customer-mode-grid">
            <button
              type="button"
              className="customer-mode-card"
              onClick={handleChooseNew}
            >
              <div className="customer-mode-title">New Customer</div>
              <div className="customer-mode-text">
                Enter customer information manually.
              </div>
            </button>

            <button
              type="button"
              className="customer-mode-card"
              onClick={handleChooseExisting}
            >
              <div className="customer-mode-title">Existing Customer</div>
              <div className="customer-mode-text">
                Search and reuse a saved customer.
              </div>
            </button>
          </div>
        )}

        {mode === "existing" && (
          <div className="start-estimate-form">
            <div className="start-estimate-topbar">
              <button
                type="button"
                className="back-link-btn"
                onClick={() => setMode(null)}
              >
                ← Back
              </button>
            </div>

            <label style={{ position: "relative" }}>
              <span>Search Existing Customer</span>
              <input
                className="dim-input"
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by name, email, phone, or address"
              />

              {searchingCustomers && (
                <div className="addr-dd">
                  <div className="addr-dd-item" style={{ cursor: "default" }}>
                    Searching...
                  </div>
                </div>
              )}

              {!searchingCustomers && customerResults.length > 0 && (
                <div className="addr-dd">
                  {customerResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="addr-dd-item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handlePickCustomer(customer)}
                    >
                      <strong>{customer.fullName || "Unnamed Customer"}</strong>
                      <br />
                      <small>
                        {customer.address || "No address"}
                        {customer.unit ? `, ${customer.unit}` : ""}
                      </small>
                      <br />
                      <small>
                        {customer.email || "No email"}
                        {customer.phone ? ` • ${customer.phone}` : ""}
                      </small>
                    </button>
                  ))}
                </div>
              )}

              {!searchingCustomers && searchErr && (
                <div style={{ color: "crimson", marginTop: 6 }}>{searchErr}</div>
              )}
            </label>

            {customerId && (
              <>
                <label>
                  <span>First Name</span>
                  <input
                    className="dim-input"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </label>

                <label>
                  <span>Last Name</span>
                  <input
                    className="dim-input"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </label>

                <label>
                  <span>Address</span>
                  <input
                    className="dim-input"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </label>

                <label>
                  <span>Unit / Apt / Suite</span>
                  <input
                    className="dim-input"
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Apt 3B"
                  />
                </label>

                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    className="dim-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@email.com"
                  />
                </label>

                <label>
                  <span>Phone</span>
                  <input
                    type="text"
                    className="dim-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(239) 555-1234"
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
              </>
            )}
          </div>
        )}

        {mode === "new" && (
          <div className="start-estimate-form">
            <div className="start-estimate-topbar">
              <button
                type="button"
                className="back-link-btn"
                onClick={() => setMode(null)}
              >
                ← Back
              </button>
            </div>

            <label>
              <span>First Name</span>
              <input
                className="dim-input"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </label>

            <label>
              <span>Last Name</span>
              <input
                className="dim-input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>

            <label style={{ position: "relative" }}>
              <span>Address</span>
              <input
                className="dim-input"
                type="text"
                inputMode="text"
                spellCheck={false}
                name="new-address"
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                onFocus={() => setShowPredictions(true)}
                onBlur={() => {
                  setTimeout(() => setShowPredictions(false), 150);
                }}
                placeholder="123 Main St, Cape Coral, FL"
                autoComplete="new-password"
              />

              {showPredictions && predictions.length > 0 && (
                <div className="addr-dd">
                  {predictions.map((p) => (
                    <button
                      key={p.place_id}
                      type="button"
                      className="addr-dd-item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectPrediction(p)}
                    >
                      {p.description}
                    </button>
                  ))}
                </div>
              )}
            </label>

            <label>
              <span>Unit / Apt / Suite</span>
              <input
                className="dim-input"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Apt 3B"
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                className="dim-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
              />
            </label>

            <label>
              <span>Phone</span>
              <input
                type="text"
                className="dim-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(239) 555-1234"
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
        )}
      </div>
    </div>
  );
};