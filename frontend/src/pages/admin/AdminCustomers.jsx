import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("lumora_token");
}

function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    return {};
  }
}

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(", ");
  }

  return detail || fallback;
}

function AdminCustomers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionLoading, setActionLoading] =
    useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const user = getStoredUser();

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadCustomers();
  }, []);

  // =========================================================
  // LOGOUT
  // =========================================================

  function handleLogout() {
    localStorage.removeItem("lumora_token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    localStorage.removeItem("User");
    localStorage.removeItem("role");

    navigate("/login", { replace: true });
  }

  // =========================================================
  // LOAD CUSTOMERS
  // =========================================================

  async function loadCustomers() {
    const token = getToken();

    if (!token) {
      handleLogout();
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/admin/customers/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            skip: 0,
            limit: 100,
          },
        }
      );

      setCustomers(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        "LOAD CUSTOMERS ERROR:",
        err
      );

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to load customers."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // =========================================================
  // REFRESH
  // =========================================================

  async function handleRefresh() {
    setRefreshing(true);
    setMessage("");
    setError("");

    await loadCustomers();
  }

  // =========================================================
  // DEACTIVATE CUSTOMER
  // =========================================================

  async function handleDeactivate(customerId) {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this customer?"
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      handleLogout();
      return;
    }

    try {
      setActionLoading(customerId);
      setMessage("");
      setError("");

      const response = await axios.put(
        `${API_URL}/admin/customers/${customerId}/deactivate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the customer directly in the list
      // using the response from the backend.
      setCustomers((currentCustomers) =>
        currentCustomers.map((customer) =>
          Number(customer.id) ===
          Number(customerId)
            ? response.data
            : customer
        )
      );

      setMessage(
        "Customer deactivated successfully."
      );
    } catch (err) {
      console.error(
        "DEACTIVATE CUSTOMER ERROR:",
        err
      );

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to deactivate customer."
        )
      );
    } finally {
      setActionLoading(null);
    }
  }

  // =========================================================
  // DELETE CUSTOMER
  // =========================================================

  async function handleDelete(customerId) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this customer? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      handleLogout();
      return;
    }

    try {
      setActionLoading(customerId);
      setMessage("");
      setError("");

      await axios.delete(
        `${API_URL}/admin/customers/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Remove the deleted customer from the UI.
      setCustomers((currentCustomers) =>
        currentCustomers.filter(
          (customer) =>
            Number(customer.id) !==
            Number(customerId)
        )
      );

      setMessage(
        "Customer deleted permanently."
      );
    } catch (err) {
      console.error(
        "DELETE CUSTOMER ERROR:",
        err
      );

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to delete customer."
        )
      );
    } finally {
      setActionLoading(null);
    }
  }

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="page">
        <div className="dashboard-loading">

          <div className="eyebrow">
            ADMIN PORTAL
          </div>

          <h1>
            Loading customers...
          </h1>

          <p>
            Please wait while we load the
            customer directory.
          </p>

        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="page admin-management-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="dashboard-header">

        <div className="brand-block">

          <div className="brand-mark">
            L
          </div>

          <div>

            <div className="brand-name">
              Lumora
            </div>

            <div className="brand-role">
              ADMIN PORTAL
            </div>

          </div>

        </div>


        <div className="dashboard-user">

          <div>

            <strong>
              {user?.name || "Administrator"}
            </strong>

            <span>
              ADMINISTRATOR
            </span>

          </div>


          <button
            type="button"
            className="text-button"
            onClick={handleLogout}
          >
            Sign out
          </button>

        </div>

      </header>


      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="management-hero">

        <Link
          to="/admin"
          className="back-link"
        >
          ← Back to admin dashboard
        </Link>


        <div className="eyebrow">
          CUSTOMER MANAGEMENT
        </div>


        <h1>
          Manage
          <br />
          Lumora customers.
        </h1>


        <p>
          Review registered customers and manage
          their account status.
        </p>

      </section>


      {/* =====================================================
          MESSAGES
          ===================================================== */}

      {message && (
        <div className="success-message">

          <span className="message-icon">
            ✓
          </span>

          {message}

        </div>
      )}


      {error && (
        <div className="error-message">

          <span className="message-icon">
            !
          </span>

          {error}

        </div>
      )}


      {/* =====================================================
          ACTIONS
          ===================================================== */}

      <section className="management-actions">

        <button
          type="button"
          className="secondary-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </section>


      {/* =====================================================
          CUSTOMER LIST
          ===================================================== */}

      <section className="management-section">

        <div className="section-heading-row">

          <div>

            <div className="eyebrow">
              REGISTERED USERS
            </div>

            <h2>
              Customers
            </h2>

            <p>
              {customers.length} customer
              {customers.length === 1
                ? ""
                : "s"} registered on Lumora.
            </p>

          </div>


          <div className="count-pill">
            {customers.length}
          </div>

        </div>


        {customers.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              ✦
            </div>

            <h3>
              No customers yet
            </h3>

            <p>
              Registered customers will appear
              here.
            </p>

          </div>

        ) : (

          <div className="customer-management-grid">

            {customers.map((customer) => {

              const isActive =
                customer.is_active !== false;

              return (
                <article
                  key={customer.id}
                  className="customer-management-card"
                >

                  {/* =========================================
                      CARD TOP
                      ========================================= */}

                  <div className="customer-card-top">

                    <div className="customer-avatar">
                      {customer.name
                        ? customer.name
                            .charAt(0)
                            .toUpperCase()
                        : "C"}
                    </div>


                    <span
                      className={
                        isActive
                          ? "status-badge status-active"
                          : "status-badge status-inactive"
                      }
                    >
                      {isActive
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>

                  </div>


                  {/* =========================================
                      CUSTOMER ID
                      ========================================= */}

                  <div className="eyebrow">
                    CUSTOMER #{customer.id}
                  </div>


                  {/* =========================================
                      NAME
                      ========================================= */}

                  <h3>
                    {customer.name ||
                      "Unnamed customer"}
                  </h3>


                  {/* =========================================
                      CUSTOMER DETAILS
                      ========================================= */}

                  <div className="customer-meta">

                    <div>

                      <span>
                        EMAIL
                      </span>

                      <strong>
                        {customer.email || "—"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        PHONE
                      </span>

                      <strong>
                        {customer.phone || "—"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        EMAIL VERIFICATION
                      </span>

                      <strong>
                        {customer.is_email_verified
                          ? "Verified"
                          : "Not verified"}
                      </strong>

                    </div>

                  </div>


                  {/* =========================================
                      ACTIVE CUSTOMER ACTION
                      ========================================= */}

                  {isActive && (
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() =>
                        handleDeactivate(
                          customer.id
                        )
                      }
                      disabled={
                        actionLoading ===
                        customer.id
                      }
                    >
                      {actionLoading ===
                      customer.id
                        ? "Deactivating..."
                        : "Deactivate customer"}
                    </button>
                  )}


                  {/* =========================================
                      INACTIVE CUSTOMER ACTIONS
                      ========================================= */}

                  {!isActive && (
                    <div className="customer-delete-area">

                      <div className="inactive-note">
                        This customer account is
                        currently inactive.
                      </div>

                      {!customer.is_email_verified && (
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() =>
                            handleDelete(
                              customer.id
                            )
                          }
                          disabled={
                            actionLoading ===
                            customer.id
                          }
                        >
                          {actionLoading ===
                          customer.id
                            ? "Deleting..."
                            : "Delete customer"}
                        </button>
                      )}

                    </div>
                  )}

                </article>
              );
            })}

          </div>
        )}

      </section>


      {/* =====================================================
          SECURITY NOTICE
          ===================================================== */}

      <section className="security-notice">

        <div className="security-icon">
          ✓
        </div>


        <div>

          <strong>
            Protected administrator access
          </strong>

          <p>
            Customer management is protected by
            backend role-based access control.
          </p>

        </div>

      </section>

    </div>
  );
}

export default AdminCustomers;