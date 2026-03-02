import React, { useEffect, useRef, useState } from "react";

export const StartEstimate = ({ initialCustomer, onNext }) => {
  const [firstName, setFirstName] = useState(initialCustomer?.firstName || "");
  const [lastName, setLastName] = useState(initialCustomer?.lastName || "");
  const [address, setAddress] = useState(initialCustomer?.address || "");

  // ✅ our own autocomplete UI
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [unit, setUnit] = useState(initialCustomer?.unit || "");

  const autoServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const fn = initialCustomer?.firstName || "";
    const ln = initialCustomer?.lastName || "";
    const addr = initialCustomer?.address || "";
    setFirstName(fn);
    setLastName(ln);
    setAddress(addr);
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

      // PlacesService needs a DOM node; this can be a hidden div
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

    // ✅ debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 200);
  };

  const selectPrediction = (p) => {
    // Option A (fast): use description
    setAddress(p.description);
    setPredictions([]);
    setShowPredictions(false);

    // Option B (best): fetch formatted_address from details
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

      <div className="start-estimate-form">
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

        {/* ✅ Address with our dropdown */}
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
              // let click register before closing
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
                  onMouseDown={(e) => e.preventDefault()} // prevents blur before click
                  onClick={() => selectPrediction(p)}
                >
                  {p.description}
                </button>
              ))}
            </div>
          )}
        </label>

        <label>
          <span>Unit / Apt / Suite </span>
          <input
            className="dim-input"
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Apt 3B"
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
};