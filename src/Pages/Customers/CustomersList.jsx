import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import netlifyIdentity from "netlify-identity-widget";
import "../../Styling/CustomersList.css";
import FindPageSkeleton from "../../Components/FindPageSkeleton";

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function normalizePhone(value) {
  return (value || "").toString().replace(/\D/g, "");
}

function formatPhone(value) {
  const cleaned = normalizePhone(value);

  if (!cleaned) return "—";

  // US +1 support
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    const n = cleaned.slice(1);
    return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6, 10)}`;
  }

  // Standard 10-digit US number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }

  // Fallback for partial / non-standard lengths
  return value;
}

function formatPhoneInput(value) {
  const cleaned = normalizePhone(value).slice(0, 10);

  if (!cleaned) return "";
  if (cleaned.length < 4) return `(${cleaned}`;
  if (cleaned.length < 7) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

const mapsUrl = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export default function CustomersList() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState("");

  const [editForm, setEditForm] = useState({
    id: "",
    firstName: "",
    lastName: "",
    address: "",
    unit: "",
    email: "",
    phone: "",
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);

      setErr("");

      const user = netlifyIdentity.currentUser();
      const jwt = user ? await user.jwt() : null;

      if (!jwt) {
        throw new Error("You must be logged in.");
      }

      const url = new URL("/.netlify/functions/list-customers", window.location.origin);
      url.searchParams.set("limit", "100");

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load customers");

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setErr(e.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

    useEffect(() => {
    document.title = "Customers | Brushline CRM";
  }, []);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    const phoneNeedle = normalizePhone(needle);

    return items.filter((customer) => {
      const text = [
        customer.fullName,
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.phone,
        customer.address,
        customer.unit,
      ].filter(Boolean).join(" ").toLowerCase();

      return text.includes(needle) ||
        (phoneNeedle && normalizePhone(customer.phone).includes(phoneNeedle));
    });
  }, [items, q]);

  const handleUseCustomer = (customer) => {
    localStorage.setItem(
      "estimateCustomer",
      JSON.stringify({
        customerId: customer.id || "",
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        address: customer.address || "",
        unit: customer.unit || "",
        email: customer.email || "",
        phone: customer.phone || "",
      })
    );

    localStorage.setItem("estimateStep", "jobType");
    navigate("/crm/estimator");
  };

    const openEditModal = (customer) => {
    setEditErr("");
    setEditForm({
      id: customer.id || "",
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      address: customer.address || "",
      unit: customer.unit || "",
      email: customer.email || "",
      phone: customer.phone || "",
    });
    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setEditErr("");
    setEditForm({
      id: "",
      firstName: "",
      lastName: "",
      address: "",
      unit: "",
      email: "",
      phone: "",
    });
  };

  const handleEditField = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveCustomer = async () => {
    try {
      setSavingEdit(true);
      setEditErr("");

      const user = netlifyIdentity.currentUser();
      const jwt = user ? await user.jwt() : null;

      if (!jwt) {
        throw new Error("You must be logged in.");
      }

      const res = await fetch("/.netlify/functions/update-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          ...editForm,
          phone: normalizePhone(editForm.phone),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update customer");

      setItems((prev) =>
        prev.map((item) =>
          item.id === editForm.id
            ? {
                ...item,
                ...data.customer,
              }
            : item
        )
      );

      closeEditModal();
    } catch (e) {
      setEditErr(e.message || "Failed to update customer");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return <FindPageSkeleton title="Customers" />;
  }

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div>
          <span className="customers-eyebrow">Customers</span>
          <h1 className="customers-title">Find a customer</h1>
          <p className="customers-subtitle">
            Search saved contacts and start a new estimate in a few taps.
          </p>
        </div>

        <button
          type="button"
          className="customers-primary-btn"
          onClick={() => navigate("/crm/estimates/create")}
        >
          New Estimate
        </button>
      </div>

      <div className="customers-toolbar">
        <div className="customers-search-wrap">
          <span className="customers-search-icon" aria-hidden="true">⌕</span>
          <label className="sr-only" htmlFor="customer-search">Search customers</label>
          <input
            id="customer-search"
            type="search"
            className="customers-search"
            placeholder="Search name, email, phone, or address"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q ? <button type="button" className="customers-clear-search" onClick={() => setQ("")}>Clear</button> : null}
        </div>
        <div className="customers-results-count" aria-live="polite">
          <strong>{rows.length}</strong> {rows.length === 1 ? "customer" : "customers"}
        </div>
      </div>

      {err ? <div className="customers-error">Error: {err}</div> : null}

      <div className="customers-card">
        <div className="customers-table-wrap">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Address</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Last Updated</th>
                <th className="right">Edit</th>
                <th className="right">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="customers-empty">
                    No customers found.
                  </td>
                </tr>
              ) : (
                rows.map((customer) => {
                  const initial =
                    customer?.fullName?.trim()?.[0]?.toUpperCase() ||
                    customer?.firstName?.trim()?.[0]?.toUpperCase() ||
                    "?";

                  const fullName =
                    customer.fullName ||
                    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                    "Unnamed Customer";

                  const fullAddress = customer.unit
                    ? `${customer.address || "—"}, ${customer.unit}`
                    : customer.address || "—";

                  return (
                    <tr key={customer.id}>
                      <td>
                        <div className="customers-person">
                          <div className="customers-avatar">{initial}</div>
                          <div className="customers-person-meta">
                            <div className="customers-name">{fullName}</div>
                            {/* <div className="customers-id">{customer.id}</div> */}
                          </div>
                        </div>
                      </td>

                      <td>{fullAddress}</td>
                      <td>{customer.email || "—"}</td>
                      <td>{formatPhone(customer.phone)}</td>
                      <td>{fmtDate(customer.updatedAt || customer.createdAt)}</td>

                      
                      <td className="right">
                        <button
                          type="button"
                          className="customers-edit-btn"
                          onClick={() => openEditModal(customer)}
                        >
                          Edit
                        </button>
                      </td>

                      <td className="right">
                        <button
                          type="button"
                          className="customers-use-btn"
                          onClick={() => handleUseCustomer(customer)}
                        >
                          Use for Quote
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="customers-mobile-list">
        {rows.map((customer) => {
          const fullName = customer.fullName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Unnamed Customer";
          const initial = fullName.trim()[0]?.toUpperCase() || "?";
          const fullAddress = customer.unit ? `${customer.address || ""}, ${customer.unit}` : customer.address || "";

          return (
            <article className="customers-mobile-card" key={`mobile-${customer.id}`}>
              <div className="customers-mobile-head">
                <div className="customers-avatar" aria-hidden="true">{initial}</div>
                <div className="customers-mobile-name-wrap">
                  <strong>{fullName}</strong>
                  <span>Updated {fmtDate(customer.updatedAt || customer.createdAt)}</span>
                </div>
              </div>
              <div className="customers-mobile-details">
                {fullAddress ? <a href={mapsUrl(fullAddress)} target="_blank" rel="noreferrer">{fullAddress}</a> : <span>No address saved</span>}
                {customer.phone ? <a href={`tel:${normalizePhone(customer.phone)}`}>{formatPhone(customer.phone)}</a> : null}
                {customer.email ? <a href={`mailto:${customer.email}`}>{customer.email}</a> : null}
              </div>
              <div className="customers-mobile-actions">
                <button type="button" className="customers-edit-btn" onClick={() => openEditModal(customer)}>Edit</button>
                <button type="button" className="customers-use-btn" onClick={() => handleUseCustomer(customer)}>Start Estimate</button>
              </div>
            </article>
          );
        })}
        {rows.length === 0 ? <div className="customers-empty">No customers found.</div> : null}
      </div>

      {editOpen && (
      <div className="customers-modal-backdrop" onClick={closeEditModal}>
        <div
          className="customers-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="customers-modal-head">
            <div>
              <div className="customers-modal-title">Edit Customer</div>
              <div className="customers-modal-subtitle">
                Update customer details for future quotes and invoices.
              </div>
            </div>

            <button
              type="button"
              className="customers-modal-close"
              onClick={closeEditModal}
            >
              ✕
            </button>
          </div>

          {editErr ? <div className="customers-error">{editErr}</div> : null}

          <div className="customers-modal-grid">
            <div className="customers-field">
              <label className="customers-label">First Name</label>
              <input
                className="customers-input"
                value={formatPhoneInput(editForm.phone)}
                onChange={(e) => handleEditField("phone", normalizePhone(e.target.value))}
                inputMode="tel"
                placeholder="(555) 555-5555"
              />
            </div>

            <div className="customers-field">
              <label className="customers-label">Last Name</label>
              <input
                className="customers-input"
                value={editForm.lastName}
                onChange={(e) => handleEditField("lastName", e.target.value)}
              />
            </div>

            <div className="customers-field customers-field-full">
              <label className="customers-label">Address</label>
              <input
                className="customers-input"
                value={editForm.address}
                onChange={(e) => handleEditField("address", e.target.value)}
              />
            </div>

            <div className="customers-field">
              <label className="customers-label">Unit / Apt</label>
              <input
                className="customers-input"
                value={editForm.unit}
                onChange={(e) => handleEditField("unit", e.target.value)}
              />
            </div>

            <div className="customers-field">
              <label className="customers-label">Email</label>
              <input
                className="customers-input"
                type="email"
                value={editForm.email}
                onChange={(e) => handleEditField("email", e.target.value)}
              />
            </div>

            <div className="customers-field customers-field-full">
              <label className="customers-label">Phone</label>
              <input
                className="customers-input"
                value={editForm.phone}
                onChange={(e) => handleEditField("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="customers-modal-actions">
            <button
              type="button"
              className="customers-secondary-btn"
              onClick={closeEditModal}
            >
              Cancel
            </button>

            <button
              type="button"
              className="customers-primary-btn"
              onClick={handleSaveCustomer}
              disabled={savingEdit}
            >
              {savingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
