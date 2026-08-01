import React, { useEffect, useRef, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import { FiArrowRight, FiSearch, FiUserPlus, FiUsers } from "react-icons/fi";
import "../../../Styling/StartEstimate.css";
import { getJobTypeLabel } from "../../../utils/jobTypeLabel";

export const StartEstimate = ({
  initialCustomer,
  onNext,
  savedDraft = null,
  onResumeDraft,
  onDiscardDraft,
}) => {
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
  const customerSearchRequestRef = useRef(null);

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
    document.title = "Create an Estimate | Brushline CRM";
  }, []);

  useEffect(() => {
    if (mode !== "existing") return;

    const q = customerSearch.trim();

    if (!q) {
      customerSearchRequestRef.current?.abort();
      setCustomerResults([]);
      setSearchingCustomers(false);
      setSearchErr("");
      return;
    }

    if (customerSearchDebounceRef.current) {
      clearTimeout(customerSearchDebounceRef.current);
    }

    customerSearchDebounceRef.current = setTimeout(async () => {
      customerSearchRequestRef.current?.abort();
      const controller = new AbortController();
      customerSearchRequestRef.current = controller;

      try {
        setSearchingCustomers(true);
        setSearchErr("");

        const user = netlifyIdentity.currentUser();
        const jwt = user ? await user.jwt() : null;
        if (!jwt) throw new Error("You must be logged in.");

        const res = await fetch(
          `/.netlify/functions/list-customers?q=${encodeURIComponent(q)}&limit=8`,
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to search customers");

        setCustomerResults(data.items || []);
      } catch (e) {
        if (e.name === "AbortError") return;
        setSearchErr(e.message);
      } finally {
        if (customerSearchRequestRef.current === controller) {
          setSearchingCustomers(false);
        }
      }
    }, 120);

    return () => {
      if (customerSearchDebounceRef.current) {
        clearTimeout(customerSearchDebounceRef.current);
      }
      customerSearchRequestRef.current?.abort();
    };
  }, [customerSearch, mode]);

  const handlePickCustomer = (customer) => {
    if (typeof onNext !== "function") return;

    onNext({
      customerId: customer.id || "",
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      address: customer.address || "",
      unit: customer.unit || "",
      email: customer.email || "",
      phone: customer.phone || "",
    });
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
        {!mode && (
          <>
          <div className="start-estimate-heading">
            <span className="start-estimate-kicker">Create a proposal</span>
            <h1>Start an Estimate</h1>
            <p>Choose how you would like to add the customer for this project.</p>
          </div>
          <div className="customer-mode-grid">
            <button
              type="button"
              className="customer-mode-card"
              onClick={handleChooseNew}
            >
              <span className="customer-mode-icon new"><FiUserPlus aria-hidden="true" /></span>
              <span className="customer-mode-copy"><strong>New Customer</strong><small>Create a new customer and project address.</small></span>
              <FiArrowRight className="customer-mode-arrow" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="customer-mode-card"
              onClick={handleChooseExisting}
            >
              <span className="customer-mode-icon existing"><FiUsers aria-hidden="true" /></span>
              <span className="customer-mode-copy"><strong>Existing Customer</strong><small>Search your saved customer records.</small></span>
              <FiArrowRight className="customer-mode-arrow" aria-hidden="true" />
            </button>
          </div>

          {savedDraft?.customer && (
            <div className="estimate-draft-card">
              <div className="estimate-draft-copy">
                <span className="estimate-draft-kicker">Pick up where you left off</span>
                <strong>
                  {savedDraft.customer.firstName} {savedDraft.customer.lastName}
                </strong>
                <span>
                  {savedDraft.jobType
                    ? `${getJobTypeLabel(savedDraft.jobType)} estimate`
                    : "Estimate in progress"}
                  {savedDraft.updatedAt
                    ? ` · Updated ${new Date(savedDraft.updatedAt).toLocaleString()}`
                    : ""}
                </span>
              </div>
              <div className="estimate-draft-actions">
                <button
                  type="button"
                  className="estimate-draft-resume"
                  onClick={() => onResumeDraft?.(savedDraft)}
                >
                  Continue Draft
                </button>
                <button
                  type="button"
                  className="estimate-draft-discard"
                  onClick={() => {
                    if (window.confirm("Discard this saved estimate draft?")) {
                      onDiscardDraft?.();
                    }
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}
          </>
        )}

        {mode === "existing" && (
          <div className="start-estimate-form existing-customer-card">
            <div className="start-estimate-topbar">
              <button
                type="button"
                className="back-link-btn"
                onClick={() => setMode(null)}
              >
                ← Back
              </button>
            </div>

            <div className="existing-customer-heading">
              <span className="new-customer-icon"><FiSearch aria-hidden="true" /></span>
              <div><span className="new-customer-kicker">Customer search</span><h2>Find an existing customer</h2><p>Search by name, email, phone number, or project address.</p></div>
            </div>

            <label className="existing-customer-search">
              <span>Customer search</span>
              <input
                className="dim-input"
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by name, email, phone, or address"
              />

              {searchingCustomers && (
                <div className="existing-customer-results">
                  <div className="existing-customer-status">
                    Searching...
                  </div>
                </div>
              )}

              {!searchingCustomers && customerResults.length > 0 && (
                <div className="existing-customer-results">
                  {customerResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="existing-customer-result"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handlePickCustomer(customer)}
                    >
                      <span className="existing-result-avatar" aria-hidden="true">{(customer.fullName || "?").trim().charAt(0).toUpperCase()}</span>
                      <span className="existing-result-copy"><strong>{customer.fullName || "Unnamed Customer"}</strong><small>{customer.address || "No address"}{customer.unit ? `, ${customer.unit}` : ""}</small></span>
                      <FiArrowRight aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}

              {!searchingCustomers && searchErr && (
                <div style={{ color: "crimson", marginTop: 6 }}>{searchErr}</div>
              )}
            </label>
          </div>
        )}

        {mode === "new" && (
          <div className="start-estimate-form new-customer-card">
            <div className="start-estimate-topbar">
              <button
                type="button"
                className="back-link-btn"
                onClick={() => setMode(null)}
              >
                ← Back
              </button>
            </div>

            <div className="new-customer-heading">
              <span className="new-customer-icon"><FiUserPlus aria-hidden="true" /></span>
              <div>
                <span className="new-customer-kicker">Customer details</span>
                <h2>Add a new customer</h2>
                <p>Enter the project contact and location to begin the estimate.</p>
              </div>
            </div>

            <label>
              <span>First name <em>Required</em></span>
              <input
                className="dim-input"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                placeholder="First name"
              />
            </label>

            <label>
              <span>Last name <em>Required</em></span>
              <input
                className="dim-input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                placeholder="Last name"
              />
            </label>

            <label className="new-customer-address">
              <span>Project address <em>Required</em></span>
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
                autoComplete="off"
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

            <label className="new-customer-unit">
              <span>Unit / Apt / Suite</span>
              <input
                className="dim-input"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Optional"
              />
            </label>

            <label>
              <span>Email address</span>
              <input
                type="email"
                className="dim-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
                autoComplete="email"
              />
            </label>

            <label>
              <span>Phone number</span>
              <input
                type="tel"
                className="dim-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(239) 555-1234"
                autoComplete="tel"
              />
            </label>

            <button
              type="button"
              className="new-customer-continue"
              onClick={handleNext}
              disabled={!canContinue}
            >
              Continue to Estimate <FiArrowRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
