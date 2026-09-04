import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

const STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

function getToken() {
  return localStorage.getItem("lumora_token");
}

function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    return null;
  }
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeValue) {
  if (!timeValue) {
    return "—";
  }

  const value = String(timeValue);

  const match = value.match(
    /^(\d{2}):(\d{2})/
  );

  if (!match) {
    return value;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClass(status) {
  return `admin-booking-status status-${String(
    status || "pending"
  ).toLowerCase()}`;
}

function AdminBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [updatingId, setUpdatingId] = useState(null);

  const [selectedStatuses, setSelectedStatuses] =
    useState({});

  // =======================================================
  // ADMIN CHECK
  // =======================================================

  useEffect(() => {
    const user = getStoredUser();

    if (!user || user.role !== "admin") {
      navigate("/login", {
        replace: true,
      });
    }
  }, [navigate]);

  // =======================================================
  // LOAD BOOKINGS
  // =======================================================

  async function loadBookings(showRefresh = false) {
    const token = getToken();

    if (!token) {
      navigate("/login", {
        state: {
          from: "/admin/bookings",
        },
        replace: true,
      });

      return;
    }

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await axios.get(
        `${API_URL}/admin/bookings/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setBookings(data);

      const initialStatuses = {};

      data.forEach((booking) => {
        initialStatuses[booking.id] =
          booking.status || "pending";
      });

      setSelectedStatuses(initialStatuses);
    } catch (requestError) {
      if (
        requestError.response?.status === 401
      ) {
        localStorage.removeItem(
          "lumora_token"
        );

        localStorage.removeItem(
          "isAuthenticated"
        );

        navigate("/login", {
          state: {
            from: "/admin/bookings",
          },
          replace: true,
        });

        return;
      }

      if (
        requestError.response?.status === 403
      ) {
        setError(
          "You do not have permission to manage bookings."
        );

        return;
      }

      setError(
        requestError.response?.data?.detail ||
          "Unable to load bookings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  // =======================================================
  // CHANGE SELECTED STATUS
  // =======================================================

  function handleStatusChange(
    bookingId,
    status
  ) {
    setSelectedStatuses((current) => ({
      ...current,
      [bookingId]: status,
    }));
  }

  // =======================================================
  // UPDATE BOOKING STATUS
  // =======================================================

  async function handleStatusUpdate(
    booking
  ) {
    const token = getToken();

    if (!token) {
      navigate("/login", {
        state: {
          from: "/admin/bookings",
        },
        replace: true,
      });

      return;
    }

    const newStatus =
      selectedStatuses[booking.id] ||
      booking.status;

    if (!newStatus) {
      return;
    }

    if (newStatus === booking.status) {
      setSuccess(
        `Booking #${booking.id} is already ${newStatus}.`
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 2500);

      return;
    }

    setUpdatingId(booking.id);
    setError("");
    setSuccess("");

    try {
      const response = await axios.put(
        `${API_URL}/admin/bookings/${booking.id}`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const updatedBooking =
        response.data;

      setBookings((current) =>
        current.map((item) =>
          item.id === booking.id
            ? updatedBooking
            : item
        )
      );

      setSelectedStatuses((current) => ({
        ...current,
        [booking.id]:
          updatedBooking.status ||
          newStatus,
      }));

      setSuccess(
        `Booking #${booking.id} status updated successfully.`
      );

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (requestError) {
      if (
        requestError.response?.status === 401
      ) {
        localStorage.removeItem(
          "lumora_token"
        );

        localStorage.removeItem(
          "isAuthenticated"
        );

        navigate("/login", {
          state: {
            from: "/admin/bookings",
          },
          replace: true,
        });

        return;
      }

      setError(
        requestError.response?.data?.detail ||
          "Unable to update booking status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // =======================================================
  // STATISTICS
  // =======================================================

  const pendingCount = bookings.filter(
    (booking) =>
      booking.status === "pending"
  ).length;

  const confirmedCount = bookings.filter(
    (booking) =>
      booking.status === "confirmed"
  ).length;

  const completedCount = bookings.filter(
    (booking) =>
      booking.status === "completed"
  ).length;

  const cancelledCount = bookings.filter(
    (booking) =>
      booking.status === "cancelled"
  ).length;

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="admin-management-page">

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
              {getStoredUser()?.name ||
                "Administrator"}
            </strong>

            <span>
              ADMINISTRATOR
            </span>
          </div>

          <button
            type="button"
            className="text-button"
            onClick={() => {
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

              navigate("/login", {
                replace: true,
              });
            }}
          >
            Sign out
          </button>

        </div>

      </header>


      {/* =================================================
          MAIN
          ================================================= */}

      <main className="management-main">

        {/* Back */}

        <Link
          to="/admin"
          className="back-link"
        >
          ← Back to admin dashboard
        </Link>


        {/* =================================================
            HERO
            ================================================= */}

        <section className="management-hero">

          <div className="eyebrow">
            BOOKING MANAGEMENT
          </div>

          <h1>
            Manage
            <br />
            Lumora bookings.
          </h1>

          <p>
            Review appointments and keep
            booking statuses up to date
            across the platform.
          </p>

        </section>


        {/* =================================================
            MESSAGES
            ================================================= */}

        {error && (
          <div className="error-message">
            <span className="message-icon">
              !
            </span>

            <span>
              {error}
            </span>
          </div>
        )}

        {success && (
          <div className="success-message">
            <span className="message-icon">
              ✓
            </span>

            <span>
              {success}
            </span>
          </div>
        )}


        {/* =================================================
            SUMMARY
            ================================================= */}

        <section className="booking-summary-grid">

          <div className="booking-summary-card">
            <span className="summary-label">
              TOTAL
            </span>

            <strong>
              {bookings.length}
            </strong>

            <small>
              All bookings
            </small>
          </div>


          <div className="booking-summary-card">
            <span className="summary-label">
              PENDING
            </span>

            <strong>
              {pendingCount}
            </strong>

            <small>
              Awaiting action
            </small>
          </div>


          <div className="booking-summary-card">
            <span className="summary-label">
              CONFIRMED
            </span>

            <strong>
              {confirmedCount}
            </strong>

            <small>
              Upcoming appointments
            </small>
          </div>


          <div className="booking-summary-card">
            <span className="summary-label">
              COMPLETED
            </span>

            <strong>
              {completedCount}
            </strong>

            <small>
              Finished appointments
            </small>
          </div>


          <div className="booking-summary-card">
            <span className="summary-label">
              CANCELLED
            </span>

            <strong>
              {cancelledCount}
            </strong>

            <small>
              Cancelled appointments
            </small>
          </div>

        </section>


        {/* =================================================
            ACTIONS
            ================================================= */}

        <section className="management-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              loadBookings(true)
            }
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh bookings"}
          </button>

        </section>


        {/* =================================================
            BOOKINGS
            ================================================= */}

        <section className="management-section">

          <div className="section-heading-row">

            <div>
              <div className="eyebrow">
                APPOINTMENTS
              </div>

              <h2>
                All bookings
              </h2>

              <p>
                {bookings.length} booking
                {bookings.length !== 1
                  ? "s"
                  : ""}{" "}
                recorded on Lumora.
              </p>
            </div>

            <div className="count-pill">
              {bookings.length}
            </div>

          </div>


          {/* Loading */}

          {loading && (
            <div className="dashboard-loading">
              Loading bookings...
            </div>
          )}


          {/* Empty */}

          {!loading &&
            bookings.length === 0 && (
              <div className="empty-state">

                <div className="empty-icon">
                  ✦
                </div>

                <h3>
                  No bookings yet
                </h3>

                <p>
                  Customer appointments
                  will appear here once
                  they are created.
                </p>

              </div>
            )}


          {/* Booking cards */}

          {!loading &&
            bookings.length > 0 && (
              <div className="management-grid">

                {bookings.map(
                  (booking) => {

                    const currentStatus =
                      selectedStatuses[
                        booking.id
                      ] ||
                      booking.status ||
                      "pending";

                    return (
                      <article
                        className="management-card booking-card"
                        key={booking.id}
                      >

                        {/* Top */}

                        <div className="management-card-top">

                          <div className="card-icon">
                            ✦
                          </div>

                          <span
                            className={getStatusClass(
                              booking.status
                            )}
                          >
                            {String(
                              booking.status ||
                                "pending"
                            ).toUpperCase()}
                          </span>

                        </div>


                        {/* Booking ID */}

                        <div className="card-eyebrow">
                          BOOKING #
                          {booking.id}
                        </div>

                        <h3>
                          Appointment
                        </h3>


                        {/* Details */}

                        <div className="booking-details">

                          <div className="booking-detail">
                            <span>
                              DATE
                            </span>

                            <strong>
                              {formatDate(
                                booking.booking_date
                              )}
                            </strong>
                          </div>


                          <div className="booking-detail">
                            <span>
                              TIME
                            </span>

                            <strong>
                              {formatTime(
                                booking.booking_time
                              )}
                            </strong>
                          </div>


                          <div className="booking-detail">
                            <span>
                              CUSTOMER ID
                            </span>

                            <strong>
                              #{booking.user_id}
                            </strong>
                          </div>


                          <div className="booking-detail">
                            <span>
                              SALON ID
                            </span>

                            <strong>
                              #{booking.salon_id}
                            </strong>
                          </div>


                          <div className="booking-detail">
                            <span>
                              SERVICE ID
                            </span>

                            <strong>
                              #{booking.service_id}
                            </strong>
                          </div>


                          <div className="booking-detail">
                            <span>
                              STAFF ID
                            </span>

                            <strong>
                              #{booking.staff_id}
                            </strong>
                          </div>

                        </div>


                        {/* Notes */}

                        {booking.notes && (
                          <div className="booking-notes">

                            <span>
                              NOTES
                            </span>

                            <p>
                              {booking.notes}
                            </p>

                          </div>
                        )}


                        {/* Status control */}

                        <div className="booking-update">

                          <label htmlFor={`booking-status-${booking.id}`}>
                            UPDATE STATUS
                          </label>

                          <div className="booking-update-row">

                            <select
                              id={`booking-status-${booking.id}`}
                              value={currentStatus}
                              onChange={(event) =>
                                handleStatusChange(
                                  booking.id,
                                  event.target.value
                                )
                              }
                              disabled={
                                updatingId ===
                                booking.id
                              }
                            >

                              {STATUSES.map(
                                (status) => (
                                  <option
                                    key={status}
                                    value={status}
                                  >
                                    {status
                                      .charAt(0)
                                      .toUpperCase() +
                                      status.slice(
                                        1
                                      )}
                                  </option>
                                )
                              )}

                            </select>


                            <button
                              type="button"
                              className="primary-button"
                              onClick={() =>
                                handleStatusUpdate(
                                  booking
                                )
                              }
                              disabled={
                                updatingId ===
                                booking.id ||
                                currentStatus ===
                                  booking.status
                              }
                            >
                              {updatingId ===
                              booking.id
                                ? "Updating..."
                                : "Update"}
                            </button>

                          </div>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            )}

        </section>


        {/* =================================================
            SECURITY NOTICE
            ================================================= */}

        <div className="security-notice">

          <div className="security-icon">
            ✓
          </div>

          <div>
            <strong>
              Protected administrator access
            </strong>

            <p>
              Booking management is
              protected by backend
              role-based access control.
            </p>
          </div>

        </div>

      </main>

    </div>
  );
}

export default AdminBookings;