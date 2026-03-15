import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import netlifyIdentity from "netlify-identity-widget";
import "../../Styling/CustomersList.css";

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function CustomersList() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
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

  const loadCustomers = async (search = "") => {
    try {
      if (search) setSearching(true);
      else setLoading(true);

      setErr("");

      const user = netlifyIdentity.currentUser();
      const jwt = user ? await user.jwt() : null;

      if (!jwt) {
        throw new Error("You must be logged in.");
      }

      const url = new URL("/.netlify/functions/list-customers", window.location.origin);
      if (search.trim()) {
        url.searchParams.set("q", search.trim());
      }
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
      setSearching(false);
    }
  };

  useEffect(() => {
    loadCustomers("");
  }, []);

    useEffect(() => {
    document.title = "Customers | Brushline CRM";
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadCustomers(q);
    }, 250);

    return () => clearTimeout(t);
  }, [q]);

  const rows = useMemo(() => items, [items]);

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
        body: JSON.stringify(editForm),
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
    return <div className="customers-page">Loading customers…</div>;
  }

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div>
          <h1 className="customers-title">Customers</h1>
          <p className="customers-subtitle">
            View and search saved customers for faster quote creation.
          </p>
        </div>

        <button
          type="button"
          className="customers-primary-btn"
          onClick={() => navigate("crm/estimates/create")}
        >
          New Estimate
        </button>
      </div>

      <div className="customers-toolbar">
        <input
          type="text"
          className="customers-search"
          placeholder="Search by name, email, phone, or address..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
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
                    {searching ? "Searching..." : "No customers found."}
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
                            <div className="customers-id">{customer.id}</div>
                          </div>
                        </div>
                      </td>

                      <td>{fullAddress}</td>
                      <td>{customer.email || "—"}</td>
                      <td>{customer.phone || "—"}</td>
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
                value={editForm.firstName}
                onChange={(e) => handleEditField("firstName", e.target.value)}
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