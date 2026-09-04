import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("lumora_token");
}

function clearAuth() {
  localStorage.removeItem("lumora_token");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("user");
  localStorage.removeItem("User");
  localStorage.removeItem("lumora_user");
  localStorage.removeItem("role");
}

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeString) {
  if (!timeString) {
    return "-";
  }

  const [hours, minutes] = timeString.split(":");

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

function getStatusClass(status) {
  switch (status) {
    case "confirmed":
      return "status-confirmed";

    case "completed":
      return "status-completed";

    case "cancelled":
      return "status-cancelled";

    case "pending":
    default:
      return "status-pending";
  }
}

function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // =========================================================
  // LOAD BOOKINGS
  // =========================================================

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    const token = getToken();

    if (!token) {
      navigate("/login", {
        replace: true,
        state: {
          from: "/my-bookings",
        },
      });

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/bookings/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookings(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        "MY BOOKINGS ERROR:",
        err
      );

      if (err.response?.status === 401) {
        clearAuth();

        navigate("/login", {
          replace: true,
          state: {
            from: "/my-bookings",
          },
        });

        return;
      }

      setError(
        err.response?.data?.detail ||
          "Unable to load your bookings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // CANCEL BOOKING
  // =========================================================

  async function handleCancel(bookingId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      navigate("/login", {
        replace: true,
        state: {
          from: "/my-bookings",
        },
      });

      return;
    }

    try {
      setCancellingId(bookingId);
      setError("");

      await axios.put(
        `${API_URL}/bookings/${bookingId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadBookings();
    } catch (err) {
      console.error(
        "CANCEL BOOKING ERROR:",
        err
      );

      if (err.response?.status === 401) {
        clearAuth();

        navigate("/login", {
          replace: true,
          state: {
            from: "/my-bookings",
          },
        });

        return;
      }

      setError(
        err.response?.data?.detail ||
          "Unable to cancel this booking. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  }

  // =========================================================
  // BOOKING GROUPS
  // =========================================================

  const upcomingBookings = bookings.filter(
    (booking) =>
      booking.status !== "cancelled" &&
      booking.status !== "completed"
  );

  const pastBookings = bookings.filter(
    (booking) =>
      booking.status === "completed" ||
      booking.status === "cancelled"
  );

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="page bookings-page">

        <div className="bookings-header">

          <div>

            <div className="eyebrow">
              YOUR APPOINTMENTS
            </div>

            <h1>
              My Bookings
            </h1>

            <p>
              Loading your appointments...
            </p>

          </div>

        </div>

        <div className="booking-loading">
          <div className="loading-spinner"></div>
        </div>

      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="page bookings-page">

      <div className="bookings-header">

        <div>

          <div className="eyebrow">
            YOUR APPOINTMENTS
          </div>

          <h1>
            My Bookings
          </h1>

          <p>
            Keep track of your upcoming and previous
            Lumora appointments.
          </p>

        </div>

        <Link
          to="/salons"
          className="primary-button"
        >
          Book an appointment
        </Link>

      </div>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div className="booking-error">
          {error}
        </div>
      )}

      {/* =====================================================
          EMPTY
          ===================================================== */}

      {bookings.length === 0 ? (

        <div className="empty-bookings">

          <div className="empty-bookings-icon">
            ✦
          </div>

          <div className="eyebrow">
            NO APPOINTMENTS YET
          </div>

          <h2>
            Your next beauty moment starts here.
          </h2>

          <p>
            Discover a Lumora salon and book your
            first appointment.
          </p>

          <Link
            to="/salons"
            className="primary-button"
          >
            Discover salons
          </Link>

        </div>

      ) : (

        <>

          {/* =================================================
              UPCOMING
              ================================================= */}

          {upcomingBookings.length > 0 && (
            <section className="bookings-section">

              <div className="section-heading">

                <div>

                  <div className="eyebrow">
                    UP NEXT
                  </div>

                  <h2>
                    Upcoming appointments
                  </h2>

                </div>

                <span className="booking-count">
                  {upcomingBookings.length}
                </span>

              </div>

              <div className="bookings-grid">

                {upcomingBookings.map(
                  (booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      cancellingId={cancellingId}
                      onCancel={handleCancel}
                    />
                  )
                )}

              </div>

            </section>
          )}

          {/* =================================================
              HISTORY
              ================================================= */}

          {pastBookings.length > 0 && (
            <section className="bookings-section">

              <div className="section-heading">

                <div>

                  <div className="eyebrow">
                    HISTORY
                  </div>

                  <h2>
                    Previous appointments
                  </h2>

                </div>

                <span className="booking-count">
                  {pastBookings.length}
                </span>

              </div>

              <div className="bookings-grid">

                {pastBookings.map(
                  (booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      cancellingId={cancellingId}
                      onCancel={handleCancel}
                    />
                  )
                )}

              </div>

            </section>
          )}

        </>

      )}

    </div>
  );
}


// ===========================================================
// BOOKING CARD
// ===========================================================

function BookingCard({
  booking,
  cancellingId,
  onCancel,
}) {

  const canCancel =
    booking.status !== "cancelled" &&
    booking.status !== "completed";

  return (
    <article className="booking-card">

      {/* =====================================================
          CARD HEADER
          ===================================================== */}

      <div className="booking-card-top">

        <div>

          <div className="booking-label">
            APPOINTMENT
          </div>

          <h3>
            Booking #{booking.id}
          </h3>

        </div>

        <span
          className={`booking-status ${getStatusClass(
            booking.status
          )}`}
        >
          {booking.status}
        </span>

      </div>


      {/* =====================================================
          BOOKING DETAILS
          ===================================================== */}

      <div className="booking-details">

        {/* ---------------------------------------------------
            DATE / TIME
            --------------------------------------------------- */}

        <div className="booking-detail">

          <span className="detail-icon">
            ◷
          </span>

          <div>

            <small>
              Date & time
            </small>

            <strong>
              {formatDate(
                booking.booking_date
              )}
            </strong>

            <span>
              {formatTime(
                booking.booking_time
              )}
            </span>

          </div>

        </div>


        {/* ---------------------------------------------------
            SALON
            --------------------------------------------------- */}

        <div className="booking-detail">

          <span className="detail-icon">
            ✦
          </span>

          <div>

            <small>
              Salon
            </small>

            <strong>
              {booking.salon_name ||
                `Salon #${booking.salon_id}`}
            </strong>

            <span>
              Lumora Salon
            </span>

          </div>

        </div>


        {/* ---------------------------------------------------
            SERVICE
            --------------------------------------------------- */}

        <div className="booking-detail">

          <span className="detail-icon">
            ✧
          </span>

          <div>

            <small>
              Service
            </small>

            <strong>
              {booking.service_name ||
                `Service #${booking.service_id}`}
            </strong>

            <span>
              Lumora beauty service
            </span>

          </div>

        </div>


        {/* ---------------------------------------------------
            STYLIST
            --------------------------------------------------- */}

        <div className="booking-detail">

          <span className="detail-icon">
            ♢
          </span>

          <div>

            <small>
              Stylist
            </small>

            <strong>
              {booking.staff_name ||
                `Stylist #${booking.staff_id}`}
            </strong>

            <span>
              Lumora stylist
            </span>

          </div>

        </div>

      </div>


      {/* =====================================================
          NOTES
          ===================================================== */}

      {booking.notes && (
        <div className="booking-notes">

          <small>
            Notes
          </small>

          <p>
            {booking.notes}
          </p>

        </div>
      )}


      {/* =====================================================
          CANCEL
          ===================================================== */}

      {canCancel && (
        <div className="booking-card-actions">

          <button
            type="button"
            className="cancel-booking-button"
            onClick={() =>
              onCancel(booking.id)
            }
            disabled={
              cancellingId === booking.id
            }
          >
            {cancellingId === booking.id
              ? "Cancelling..."
              : "Cancel appointment"}
          </button>

        </div>
      )}

    </article>
  );
}

export default MyBookings;
