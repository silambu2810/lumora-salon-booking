import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import axios from "axios";


const API_URL =
  "http://127.0.0.1:8000";


// =========================================================
// HELPERS
// =========================================================

function getToken() {
  return localStorage.getItem(
    "lumora_token"
  );
}


function getStoredUser() {
  try {
    const stored =
      localStorage.getItem("user") ||
      localStorage.getItem("User");

    return stored
      ? JSON.parse(stored)
      : null;

  } catch {
    return null;
  }
}


// =========================================================
// ADMIN STAFF
// =========================================================

function AdminStaff() {

  const navigate =
    useNavigate();


  const [user, setUser] =
    useState(null);

  const [staff, setStaff] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {

    const token =
      getToken();

    const storedUser =
      getStoredUser();


    if (!token || !storedUser) {

      navigate(
        "/login",
        { replace: true }
      );

      return;
    }


    if (
      storedUser.role !== "admin"
    ) {

      navigate(
        "/login",
        { replace: true }
      );

      return;
    }


    setUser(storedUser);

    loadStaff(token);

  }, [navigate]);


  // =======================================================
  // LOGOUT
  // =======================================================

  function handleLogout() {

    localStorage.removeItem(
      "lumora_token"
    );

    localStorage.removeItem(
      "isAuthenticated"
    );

    localStorage.removeItem(
      "user"
    );

    localStorage.removeItem(
      "User"
    );

    localStorage.removeItem(
      "role"
    );


    navigate(
      "/login",
      { replace: true }
    );
  }


  // =======================================================
  // LOAD STAFF
  // =======================================================

  async function loadStaff(
    token = getToken()
  ) {

    if (!token) {

      handleLogout();

      return;
    }


    try {

      setLoading(true);

      setError("");


      const response =
        await axios.get(
          `${API_URL}/admin/staff/`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            params: {
              skip: 0,
              limit: 100,
            },
          }
        );


      setStaff(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (err) {

      console.error(
        "LOAD STAFF ERROR:",
        err
      );


      if (
        err.response?.status === 401
      ) {

        handleLogout();

        return;
      }


      setError(
        err.response?.data?.detail ||
        "Unable to load staff members."
      );

    } finally {

      setLoading(false);

      setRefreshing(false);

    }
  }


  // =======================================================
  // REFRESH
  // =======================================================

  async function handleRefresh() {

    setRefreshing(true);

    setMessage("");

    setError("");

    await loadStaff();

  }


  // =======================================================
  // DEACTIVATE STAFF
  // =======================================================

  async function handleDeactivate(
    staffId
  ) {

    const confirmed =
      window.confirm(
        "Are you sure you want to deactivate this staff member?"
      );


    if (!confirmed) {
      return;
    }


    const token =
      getToken();


    if (!token) {

      handleLogout();

      return;
    }


    try {

      setActionLoading(
        staffId
      );

      setMessage("");

      setError("");


      const response =
        await axios.put(
          `${API_URL}/admin/staff/${staffId}/deactivate`,
          {},
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      setStaff(
        (currentStaff) =>
          currentStaff.map(
            (member) =>
              Number(member.id) ===
              Number(staffId)
                ? response.data
                : member
          )
      );


      setMessage(
        "Staff member deactivated successfully."
      );

    } catch (err) {

      console.error(
        "DEACTIVATE STAFF ERROR:",
        err
      );


      if (
        err.response?.status === 401
      ) {

        handleLogout();

        return;
      }


      setError(
        err.response?.data?.detail ||
        "Unable to deactivate staff member."
      );

    } finally {

      setActionLoading(null);

    }
  }


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (

      <div className="page">

        <div className="dashboard-loading">

          <div className="eyebrow">
            ADMIN PORTAL
          </div>

          <h1>
            Loading staff...
          </h1>

          <p>
            Please wait while we load the
            staff directory.
          </p>

        </div>

      </div>

    );
  }


  // =======================================================
  // PAGE
  // =======================================================

  return (

    <div className="page admin-management-page">


      {/* =================================================
          HEADER
          ================================================= */}

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
              {user?.name ||
                "Administrator"}
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


      {/* =================================================
          HERO
          ================================================= */}

      <section className="management-hero">

        <Link
          to="/admin"
          className="back-link"
        >
          ← Back to admin dashboard
        </Link>


        <div className="eyebrow">
          STAFF MANAGEMENT
        </div>


        <h1>
          Manage
          <br />
          Lumora staff.
        </h1>


        <p>
          Review staff members across all
          Lumora salons and manage account
          access.
        </p>

      </section>


      {/* =================================================
          MESSAGES
          ================================================= */}

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


      {/* =================================================
          ACTIONS
          ================================================= */}

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


      {/* =================================================
          STAFF LIST
          ================================================= */}

      <section className="management-section">

        <div className="section-heading-row">

          <div>

            <div className="eyebrow">
              REGISTERED STAFF
            </div>

            <h2>
              Staff members
            </h2>

            <p>
              {staff.length} staff member
              {staff.length === 1
                ? ""
                : "s"} on Lumora.
            </p>

          </div>


          <div className="count-pill">
            {staff.length}
          </div>

        </div>


        {staff.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              ✦
            </div>

            <h3>
              No staff yet
            </h3>

            <p>
              Staff members created by salon
              owners will appear here.
            </p>

          </div>

        ) : (

          <div className="customer-management-grid">

            {staff.map((member) => {

              const isActive =
                member.is_active !== false;


              return (

                <article
                  key={member.id}
                  className="customer-management-card"
                >


                  {/* =====================================
                      TOP
                      ===================================== */}

                  <div className="customer-card-top">

                    <div className="customer-avatar">

                      {member.name
                        ? member.name
                            .charAt(0)
                            .toUpperCase()
                        : "S"}

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


                  <div className="eyebrow">
                    STAFF #{member.id}
                  </div>


                  <h3>
                    {member.name ||
                      "Unnamed staff"}
                  </h3>


                  <div className="customer-meta">


                    <div>

                      <span>
                        EMAIL
                      </span>

                      <strong>
                        {member.email || "—"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        PHONE
                      </span>

                      <strong>
                        {member.phone || "—"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        SALON ID
                      </span>

                      <strong>
                        {member.salon_id
                          ? `Salon #${member.salon_id}`
                          : "Not assigned"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        EMAIL VERIFICATION
                      </span>

                      <strong>
                        {member.is_email_verified
                          ? "Verified"
                          : "Not verified"}
                      </strong>

                    </div>


                  </div>


                  {isActive && (

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() =>
                        handleDeactivate(
                          member.id
                        )
                      }
                      disabled={
                        actionLoading ===
                        member.id
                      }
                    >

                      {actionLoading ===
                      member.id
                        ? "Deactivating..."
                        : "Deactivate staff"}

                    </button>

                  )}


                  {!isActive && (

                    <div className="inactive-note">
                      This staff account is
                      currently inactive.
                    </div>

                  )}

                </article>

              );

            })}

          </div>

        )}

      </section>


      {/* =================================================
          SECURITY
          ================================================= */}

      <section className="security-notice">

        <div className="security-icon">
          ✓
        </div>


        <div>

          <strong>
            Protected administrator access
          </strong>

          <p>
            Staff management is protected by
            backend role-based access control.
          </p>

        </div>

      </section>


    </div>

  );
}


export default AdminStaff;