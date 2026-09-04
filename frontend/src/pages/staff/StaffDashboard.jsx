import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

const STATUS_OPTIONS = [
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
    const storedUser =
      localStorage.getItem("user") ||
      localStorage.getItem("User");

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch {
    return null;
  }
}

function formatDate(dateString) {
  if (!dateString) {
    return "—";
  }

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeString) {
  if (!timeString) {
    return "—";
  }

  const [hours, minutes] =
    timeString.split(":");

  const date = new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

function StaffDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingBooking, setEditingBooking] =
    useState(null);

  const [editStatus, setEditStatus] =
    useState("");

  const [editNotes, setEditNotes] =
    useState("");

  useEffect(() => {
    initializeDashboard();
  }, []);

  async function initializeDashboard() {
    const token = getToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    if (storedUser.role !== "staff") {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    setUser(storedUser);

    await loadBookings(token);
  }

  async function loadBookings(token = getToken()) {
    if (!token) {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/staff/bookings/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookings(response.data || []);
    } catch (err) {
      console.error(
        "STAFF BOOKINGS ERROR:",
        err
      );

      if (err.response?.status === 401) {
        clearSession();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      if (err.response?.status === 403) {
        setError(
          "You do not have permission to access staff bookings."
        );
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Unable to load your appointments."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearSession() {
    localStorage.removeItem("lumora_token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    localStorage.removeItem("User");
    localStorage.removeItem("role");
  }

  function handleLogout() {
    clearSession();

    navigate("/login", {
      replace: true,
    });
  }

  function openEdit(booking) {
    setEditingBooking(booking);
    setEditStatus(
      booking.status || "pending"
    );
    setEditNotes(
      booking.notes || ""
    );

    setError("");
    setSuccess("");
  }

  function closeEdit() {
    setEditingBooking(null);
    setEditStatus("");
    setEditNotes("");
  }

  async function handleUpdateBooking(
    event
  ) {
    event.preventDefault();

    if (!editingBooking) {
      return;
    }

    const token = getToken();

    if (!token) {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    try {
      setSavingId(editingBooking.id);
      setError("");
      setSuccess("");

      const response = await axios.put(
        `${API_URL}/staff/bookings/${editingBooking.id}`,
        {
          status: editStatus,
          notes: editNotes.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id ===
          editingBooking.id
            ? response.data
            : booking
        )
      );

      setSuccess(
        `Booking #${editingBooking.id} updated successfully.`
      );

      closeEdit();
    } catch (err) {
      console.error(
        "UPDATE STAFF BOOKING ERROR:",
        err
      );

      if (err.response?.status === 401) {
        clearSession();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      if (
        Array.isArray(
          err.response?.data?.detail
        )
      ) {
        setError(
          err.response.data.detail
            .map((item) => item.msg)
            .filter(Boolean)
            .join(", ")
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to update this booking."
        );
      }
    } finally {
      setSavingId(null);
    }
  }

  const upcomingBookings =
    bookings.filter(
      (booking) =>
        booking.status !== "cancelled" &&
        booking.status !== "completed"
    );

  const completedBookings =
    bookings.filter(
      (booking) =>
        booking.status === "completed"
    );

  const cancelledBookings =
    bookings.filter(
      (booking) =>
        booking.status === "cancelled"
    );

  if (loading) {
    return (
      <div className="staff-page">
        <div className="staff-loading">
          <div className="loading-spinner"></div>
          <p>
            Loading your appointments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-page">

      {/* ==========================================
          HEADER
      ========================================== */}

      <header className="staff-header">

        <div className="staff-brand">

          <div className="staff-brand-mark">
            L
          </div>

          <div>
            <strong>Lumora</strong>
            <span>Staff Portal</span>
          </div>

        </div>


        <div className="staff-header-actions">

          <div className="staff-user">

            <span className="staff-user-name">
              {user?.name || "Staff"}
            </span>

            <span className="staff-user-role">
              Stylist
            </span>

          </div>

          <button
            type="button"
            className="staff-logout"
            onClick={handleLogout}
          >
            Sign out
          </button>

        </div>

      </header>


      {/* ==========================================
          MAIN
      ========================================== */}

      <main className="staff-main">

        {/* ALERTS */}

        {error && (
          <div className="staff-alert staff-alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="staff-alert staff-alert-success">
            {success}
          </div>
        )}


        {/* ==========================================
            HERO
        ========================================== */}

        <section className="staff-hero">

          <div>

            <div className="eyebrow">
              STAFF DASHBOARD
            </div>

            <h1>
              Welcome back,
              <br />
              {user?.name || "Stylist"}.
            </h1>

            <p>
              Keep track of your appointments
              and update booking status from one
              place.
            </p>

          </div>

        </section>


        {/* ==========================================
            STATS
        ========================================== */}

        <section className="staff-stats">

          <div className="staff-stat-card">

            <span className="staff-stat-number">
              {upcomingBookings.length}
            </span>

            <span className="staff-stat-label">
              Upcoming
            </span>

          </div>


          <div className="staff-stat-card">

            <span className="staff-stat-number">
              {completedBookings.length}
            </span>

            <span className="staff-stat-label">
              Completed
            </span>

          </div>


          <div className="staff-stat-card">

            <span className="staff-stat-number">
              {cancelledBookings.length}
            </span>

            <span className="staff-stat-label">
              Cancelled
            </span>

          </div>


          <div className="staff-stat-card">

            <span className="staff-stat-number">
              {bookings.length}
            </span>

            <span className="staff-stat-label">
              Total bookings
            </span>

          </div>

        </section>


        {/* ==========================================
            APPOINTMENTS
        ========================================== */}

        <section className="staff-section">

          <div className="staff-section-header">

            <div>

              <div className="eyebrow">
                YOUR SCHEDULE
              </div>

              <h2>
                Assigned appointments
              </h2>

              <p>
                View and manage appointments
                assigned to you.
              </p>

            </div>

            <button
              type="button"
              className="staff-refresh-button"
              onClick={() =>
                loadBookings()
              }
            >
              Refresh
            </button>

          </div>


          {bookings.length === 0 ? (
            <div className="staff-empty">

              <div className="staff-empty-icon">
                ◷
              </div>

              <h3>
                No appointments yet
              </h3>

              <p>
                Appointments assigned to you
                will appear here.
              </p>

            </div>
          ) : (
            <div className="staff-bookings">

              {bookings.map((booking) => (
                <article
                  className="staff-booking-card"
                  key={booking.id}
                >

                  {/* TOP */}

                  <div className="staff-booking-top">

                    <div>

                      <span className="booking-eyebrow">
                        APPOINTMENT
                      </span>

                      <h3>
                        Booking #{booking.id}
                      </h3>

                    </div>


                    <span
                      className={`booking-status status-${booking.status}`}
                    >
                      {formatStatus(
                        booking.status
                      )}
                    </span>

                  </div>


                  {/* DETAILS */}

                  <div className="staff-booking-details">

                    <div className="staff-detail">

                      <span className="detail-icon">
                        ◷
                      </span>

                      <div>

                        <span>
                          DATE & TIME
                        </span>

                        <strong>
                          {formatDate(
                            booking.booking_date
                          )}
                        </strong>

                        <small>
                          {formatTime(
                            booking.booking_time
                          )}
                        </small>

                      </div>

                    </div>


                    <div className="staff-detail">

                      <span className="detail-icon">
                        ✦
                      </span>

                      <div>

                        <span>
                          SALON
                        </span>

                        <strong>
                          Salon #{booking.salon_id}
                        </strong>

                        <small>
                          Lumora Salon
                        </small>

                      </div>

                    </div>


                    <div className="staff-detail">

                      <span className="detail-icon">
                        ◇
                      </span>

                      <div>

                        <span>
                          SERVICE
                        </span>

                        <strong>
                          Service #{booking.service_id}
                        </strong>

                        <small>
                          Beauty service
                        </small>

                      </div>

                    </div>


                    <div className="staff-detail">

                      <span className="detail-icon">
                        A
                      </span>

                      <div>

                        <span>
                          CUSTOMER
                        </span>

                        <strong>
                          Customer #{booking.user_id}
                        </strong>

                        <small>
                          Lumora customer
                        </small>

                      </div>

                    </div>

                  </div>


                  {/* NOTES */}

                  <div className="staff-booking-notes">

                    <span>
                      NOTES
                    </span>

                    <p>
                      {booking.notes ||
                        "No notes added."}
                    </p>

                  </div>


                  {/* ACTION */}

                  <div className="staff-booking-footer">

                    <button
                      type="button"
                      className="staff-update-button"
                      onClick={() =>
                        openEdit(booking)
                      }
                      disabled={
                        savingId ===
                        booking.id
                      }
                    >
                      Update booking
                    </button>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>

      </main>


      {/* ==========================================
          EDIT MODAL
      ========================================== */}

      {editingBooking && (
        <div
          className="staff-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEdit();
            }
          }}
        >

          <div className="staff-modal">

            <div className="staff-modal-header">

              <div>

                <div className="eyebrow">
                  MANAGE APPOINTMENT
                </div>

                <h2>
                  Booking #{editingBooking.id}
                </h2>

              </div>

              <button
                type="button"
                className="staff-modal-close"
                onClick={closeEdit}
              >
                ×
              </button>

            </div>


            <form
              className="staff-edit-form"
              onSubmit={handleUpdateBooking}
            >

              <label>

                Booking status

                <select
                  value={editStatus}
                  onChange={(event) =>
                    setEditStatus(
                      event.target.value
                    )
                  }
                >

                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        value={status}
                        key={status}
                      >
                        {formatStatus(
                          status
                        )}
                      </option>
                    )
                  )}

                </select>

              </label>


              <label>

                Notes

                <textarea
                  value={editNotes}
                  onChange={(event) =>
                    setEditNotes(
                      event.target.value
                    )
                  }
                  placeholder="Add appointment notes..."
                  rows="5"
                />

              </label>


              <div className="staff-edit-summary">

                <div>
                  <span>
                    DATE
                  </span>

                  <strong>
                    {formatDate(
                      editingBooking.booking_date
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    TIME
                  </span>

                  <strong>
                    {formatTime(
                      editingBooking.booking_time
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    CUSTOMER
                  </span>

                  <strong>
                    #{editingBooking.user_id}
                  </strong>
                </div>

              </div>


              <div className="staff-modal-actions">

                <button
                  type="button"
                  className="staff-secondary-button"
                  onClick={closeEdit}
                  disabled={
                    savingId ===
                    editingBooking.id
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="staff-primary-button"
                  disabled={
                    savingId ===
                    editingBooking.id
                  }
                >
                  {savingId ===
                  editingBooking.id
                    ? "Saving..."
                    : "Save changes"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default StaffDashboard;