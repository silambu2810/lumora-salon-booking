import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// =========================================================
// HELPERS
// =========================================================

function getToken() {
  return (
    localStorage.getItem("lumora_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

function getStoredUser() {
  try {
    const stored =
      localStorage.getItem("user") ||
      localStorage.getItem("User") ||
      localStorage.getItem("lumora_user");

    return stored
      ? JSON.parse(stored)
      : null;
  } catch {
    return null;
  }
}

// =========================================================
// ADMIN DASHBOARD
// =========================================================

function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  // General statistics
  const [stats, setStats] = useState(null);

  // Booking status statistics
  const [bookingStats, setBookingStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    if (storedUser.role !== "admin") {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    setUser(storedUser);

    loadStats(token);
  }, [navigate]);

  // =======================================================
  // LOAD ADMIN STATISTICS + BOOKINGS
  // =======================================================

  async function loadStats(token = getToken()) {
    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // =====================================================
      // 1. GENERAL ADMIN STATISTICS
      // =====================================================

      const statsResponse = await axios.get(
        `${API_URL}/admin/stats/`,
        {
          headers,
        }
      );

      console.log(
        "ADMIN STATS RESPONSE:",
        statsResponse.data
      );

      setStats(statsResponse.data);

      // =====================================================
      // 2. GET ALL BOOKINGS
      // =====================================================

      const bookingsResponse = await axios.get(
        `${API_URL}/admin/bookings/`,
        {
          headers,
        }
      );

      const bookings = Array.isArray(
        bookingsResponse.data
      )
        ? bookingsResponse.data
        : [];

      console.log(
        "ADMIN BOOKINGS RESPONSE:",
        bookings
      );

      // =====================================================
      // 3. COUNT BOOKING STATUSES
      // =====================================================

      const counts = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      };

      bookings.forEach((booking) => {
        const status = String(
          booking?.status || ""
        ).trim().toLowerCase();

        switch (status) {
          case "pending":
            counts.pending += 1;
            break;

          case "confirmed":
            counts.confirmed += 1;
            break;

          case "completed":
            counts.completed += 1;
            break;

          case "cancelled":
            counts.cancelled += 1;
            break;

          default:
            console.warn(
              "Unknown booking status:",
              booking?.status,
              booking
            );
            break;
        }
      });

      console.log(
        "BOOKING STATUS COUNTS:",
        counts
      );

      setBookingStats(counts);

    } catch (err) {
      console.error(
        "ADMIN DASHBOARD ERROR:",
        err
      );

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      if (err.response?.status === 403) {
        setError(
          "You do not have permission to access administrator data."
        );

        return;
      }

      setError(
        err.response?.data?.detail ||
          "Unable to load admin dashboard data."
      );

    } finally {
      setLoading(false);
    }
  }

  // =======================================================
  // LOGOUT
  // =======================================================

  function handleLogout() {
    localStorage.removeItem(
      "lumora_token"
    );

    localStorage.removeItem(
      "token"
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
      "lumora_user"
    );

    localStorage.removeItem(
      "role"
    );

    navigate("/login", {
      replace: true,
    });
  }

  // =======================================================
  // STATISTIC HELPER
  // =======================================================

  function getStat(...keys) {
    if (!stats) {
      return "—";
    }

    for (const key of keys) {
      if (
        stats[key] !== undefined &&
        stats[key] !== null
      ) {
        return stats[key];
      }
    }

    return "—";
  }

  // =======================================================
  // NAVIGATION HELPERS
  // =======================================================

  function goToSalons() {
    navigate("/admin/salons");
  }

  function goToCustomers() {
    navigate("/admin/customers");
  }

  function goToStaff() {
    navigate("/admin/staff");
  }

  function goToServices() {
    navigate("/admin/services");
  }

  function goToBookings() {
    navigate("/admin/bookings");
  }

  function goToReviews() {
    navigate("/admin/reviews");
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="admin-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="admin-header">

        <div className="admin-brand">

          <div className="admin-brand-mark">
            L
          </div>

          <div className="admin-brand-copy">

            <strong>
              Lumora
            </strong>

            <span>
              ADMIN PORTAL
            </span>

          </div>

        </div>

        <div className="admin-header-actions">

          <div className="admin-user">

            <span>
              {user?.name ||
                "Administrator"}
            </span>

            <small>
              Administrator
            </small>

          </div>

          <button
            type="button"
            className="admin-logout"
            onClick={handleLogout}
          >
            Sign out
          </button>

        </div>

      </header>

      {/* =================================================
          MAIN
          ================================================= */}

      <main className="admin-main">

        {/* =================================================
            HERO
            ================================================= */}

        <section className="admin-hero">

          <div className="eyebrow">
            PLATFORM MANAGEMENT
          </div>

          <h1>
            Welcome back,
            <br />
            {user?.name ||
              "Administrator"}.
          </h1>

          <p>
            Manage salons, customers, staff,
            appointments and platform activity
            from one place.
          </p>

        </section>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="admin-error">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                loadStats()
              }
            >
              Retry
            </button>

          </div>
        )}

        {/* =================================================
            OVERVIEW
            ================================================= */}

        <section className="admin-section">

          <div className="admin-section-heading">

            <div>

              <div className="eyebrow">
                OVERVIEW
              </div>

              <h2>
                Platform at a glance
              </h2>

            </div>

            <button
              type="button"
              className="admin-refresh-button"
              onClick={() =>
                loadStats()
              }
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>

          <div className="admin-stats-grid">

            {/* CUSTOMERS */}

            <div className="admin-stat-card">

              <span className="admin-stat-number">
                {loading
                  ? "..."
                  : getStat(
                      "total_customers",
                      "customers",
                      "customer_count"
                    )}
              </span>

              <span className="admin-stat-label">
                Total customers
              </span>

            </div>

            {/* OWNERS */}

            <div className="admin-stat-card">

              <span className="admin-stat-number">
                {loading
                  ? "..."
                  : getStat(
                      "total_owners",
                      "total_salon_owners",
                      "salon_owners",
                      "owners",
                      "owner_count"
                    )}
              </span>

              <span className="admin-stat-label">
                Salon owners
              </span>

            </div>

            {/* STAFF */}

            <div className="admin-stat-card">

              <span className="admin-stat-number">
                {loading
                  ? "..."
                  : getStat(
                      "total_staff",
                      "staff",
                      "staff_count"
                    )}
              </span>

              <span className="admin-stat-label">
                Staff members
              </span>

            </div>

            {/* SALONS */}

            <div className="admin-stat-card">

              <span className="admin-stat-number">
                {loading
                  ? "..."
                  : getStat(
                      "total_salons",
                      "salons",
                      "salon_count"
                    )}
              </span>

              <span className="admin-stat-label">
                Total salons
              </span>

            </div>

            {/* SERVICES */}

            <div className="admin-stat-card">

              <span className="admin-stat-number">
                {loading
                  ? "..."
                  : getStat(
                      "total_services",
                      "services",
                      "service_count"
                    )}
              </span>

              <span className="admin-stat-label">
                Services
              </span>

            </div>

            {/* TOTAL BOOKINGS */}

            <div className="admin-stat-card">

              <span className="admin-stat-number">
                {loading
                  ? "..."
                  : getStat(
                      "total_bookings",
                      "bookings",
                      "booking_count"
                    )}
              </span>

              <span className="admin-stat-label">
                Total bookings
              </span>

            </div>

            {/* REVIEWS */}

            <div className="admin-stat-card">

              <span className="admin-stat-number">
                {loading
                  ? "..."
                  : getStat(
                      "total_reviews",
                      "reviews",
                      "review_count"
                    )}
              </span>

              <span className="admin-stat-label">
                Reviews
              </span>

            </div>

            {/* RATING */}

            <div className="admin-stat-card">

              <span className="admin-stat-number">
                {loading
                  ? "..."
                  : getStat(
                      "average_rating",
                      "avg_rating"
                    )}
              </span>

              <span className="admin-stat-label">
                Average rating
              </span>

            </div>

          </div>

        </section>

        {/* =================================================
            BOOKING STATUS
            ================================================= */}

        <section className="admin-section">

          <div className="admin-section-heading">

            <div>

              <div className="eyebrow">
                APPOINTMENTS
              </div>

              <h2>
                Booking activity
              </h2>

            </div>

          </div>

          <div className="admin-booking-status">

            {/* =================================================
                PENDING
                ================================================= */}

            <div className="admin-status-card">

              <span className="admin-status-number">

                {loading
                  ? "..."
                  : bookingStats.pending}

              </span>

              <span>
                Pending
              </span>

            </div>

            {/* =================================================
                CONFIRMED
                ================================================= */}

            <div className="admin-status-card">

              <span className="admin-status-number">

                {loading
                  ? "..."
                  : bookingStats.confirmed}

              </span>

              <span>
                Confirmed
              </span>

            </div>

            {/* =================================================
                COMPLETED
                ================================================= */}

            <div className="admin-status-card">

              <span className="admin-status-number">

                {loading
                  ? "..."
                  : bookingStats.completed}

              </span>

              <span>
                Completed
              </span>

            </div>

            {/* =================================================
                CANCELLED
                ================================================= */}

            <div className="admin-status-card">

              <span className="admin-status-number">

                {loading
                  ? "..."
                  : bookingStats.cancelled}

              </span>

              <span>
                Cancelled
              </span>

            </div>

          </div>

        </section>

        {/* =================================================
            MANAGEMENT
            ================================================= */}

        <section className="admin-section">

          <div className="admin-section-heading">

            <div>

              <div className="eyebrow">
                MANAGEMENT
              </div>

              <h2>
                Manage Lumora
              </h2>

              <p>
                Platform administration tools.
              </p>

            </div>

          </div>

          <div className="admin-management-grid">

            {/* =================================================
                SALONS
                ================================================= */}

            <article className="admin-management-card">

              <div className="admin-card-icon">
                ✦
              </div>

              <div className="admin-card-content">

                <span>
                  SALONS
                </span>

                <h3>
                  Salon management
                </h3>

                <p>
                  Add salons and assign salon
                  owners.
                </p>

              </div>

              <button
                type="button"
                className="admin-card-button"
                onClick={goToSalons}
              >
                Manage salons
              </button>

            </article>

            {/* =================================================
                CUSTOMERS
                ================================================= */}

            <article className="admin-management-card">

              <div className="admin-card-icon">
                A
              </div>

              <div className="admin-card-content">

                <span>
                  CUSTOMERS
                </span>

                <h3>
                  Customer management
                </h3>

                <p>
                  View customers and manage
                  their platform access.
                </p>

              </div>

              <button
                type="button"
                className="admin-card-button"
                onClick={goToCustomers}
              >
                Manage customers
              </button>

            </article>

            {/* =================================================
                OWNERS
                ================================================= */}

            <article className="admin-management-card">

              <div className="admin-card-icon">
                L
              </div>

              <div className="admin-card-content">

                <span>
                  OWNERS
                </span>

                <h3>
                  Salon owners
                </h3>

                <p>
                  Create salon owners and assign
                  them to salons.
                </p>

              </div>

              <button
                type="button"
                className="admin-card-button"
                onClick={goToSalons}
              >
                Manage owners
              </button>

            </article>

            {/* =================================================
                STAFF
                ================================================= */}

            <article className="admin-management-card">

              <div className="admin-card-icon">
                ◇
              </div>

              <div className="admin-card-content">

                <span>
                  STAFF
                </span>

                <h3>
                  Staff management
                </h3>

                <p>
                  Review salon staff and their
                  assignments.
                </p>

              </div>

              <button
                type="button"
                className="admin-card-button"
                onClick={goToStaff}
              >
                Manage staff
              </button>

            </article>

            {/* =================================================
                SERVICES
                ================================================= */}

            <article className="admin-management-card">

              <div className="admin-card-icon">
                ✧
              </div>

              <div className="admin-card-content">

                <span>
                  SERVICES
                </span>

                <h3>
                  Services & categories
                </h3>

                <p>
                  Review services, prices,
                  durations and categories.
                </p>

              </div>

              <button
                type="button"
                className="admin-card-button"
                onClick={goToServices}
              >
                Manage services
              </button>

            </article>

            {/* =================================================
                BOOKINGS
                ================================================= */}

            <article className="admin-management-card">

              <div className="admin-card-icon">
                ◷
              </div>

              <div className="admin-card-content">

                <span>
                  APPOINTMENTS
                </span>

                <h3>
                  Booking management
                </h3>

                <p>
                  Review and manage all salon
                  appointments.
                </p>

              </div>

              <button
                type="button"
                className="admin-card-button"
                onClick={goToBookings}
              >
                Manage bookings
              </button>

            </article>

            {/* =================================================
                REVIEWS
                ================================================= */}

            <article className="admin-management-card">

              <div className="admin-card-icon">
                ☆
              </div>

              <div className="admin-card-content">

                <span>
                  REVIEWS
                </span>

                <h3>
                  Reviews & ratings
                </h3>

                <p>
                  Monitor customer reviews and
                  salon ratings.
                </p>

              </div>

              <button
                type="button"
                className="admin-card-button"
                onClick={goToReviews}
              >
                View reviews
              </button>

            </article>

            {/* =================================================
                PLATFORM
                ================================================= */}

            <article className="admin-management-card">

              <div className="admin-card-icon">
                ✓
              </div>

              <div className="admin-card-content">

                <span>
                  PLATFORM
                </span>

                <h3>
                  System overview
                </h3>

                <p>
                  Keep track of the overall Lumora
                  platform activity.
                </p>

              </div>

              <button
                type="button"
                className="admin-card-button"
                onClick={() =>
                  loadStats()
                }
              >
                Refresh statistics
              </button>

            </article>

          </div>

        </section>

        {/* =================================================
            SECURITY NOTE
            ================================================= */}

        <section className="admin-note">

          <div className="admin-note-icon">
            ✓
          </div>

          <div>

            <strong>
              Protected administrator access
            </strong>

            <p>
              Administrative actions are protected
              by the backend role-based access control
              layer. Customer, staff and salon-owner
              accounts cannot access these resources.
            </p>

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminDashboard;
