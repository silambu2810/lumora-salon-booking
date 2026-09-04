import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getToken() {
  return (
    localStorage.getItem("lumora_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

function getErrorMessage(data) {
  if (!data) {
    return "Unable to load booking details.";
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((item) => item?.msg || "Validation error")
      .join(", ");
  }

  return "Unable to load booking details.";
}

function formatDate(dateString) {
  if (!dateString) {
    return "—";
  }

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeString) {
  if (!timeString) {
    return "—";
  }

  const [hours, minutes] = timeString.split(":");

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function BookingConfirmation() {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBooking() {
      const token = getToken();

      if (!token) {
        setError("Please log in to view your booking.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/bookings/${bookingId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(getErrorMessage(data));
        }

        setBooking(data);
      } catch (requestError) {
        console.error(
          "Booking confirmation error:",
          requestError
        );

        setError(
          requestError.message ||
            "Unable to load booking details."
        );
      } finally {
        setLoading(false);
      }
    }

    if (bookingId) {
      loadBooking();
    } else {
      setError("Booking ID is missing.");
      setLoading(false);
    }
  }, [bookingId]);

  return (
    <div className="page confirmation-page">

      <div className="confirmation-card">

        <div className="confirmation-icon">
          ✓
        </div>

        <div className="eyebrow">
          BOOKING CONFIRMED
        </div>

        <h1>
          Your appointment is booked.
        </h1>

        <p>
          Your Lumora appointment has been successfully
          created.
        </p>

        {loading && (
          <div className="confirmation-loading">
            Loading appointment details...
          </div>
        )}

        {!loading && error && (
          <div className="confirmation-error">
            {error}
          </div>
        )}

        {!loading && !error && booking && (
          <>
            <div className="booking-summary">

              <div className="booking-summary-item">
                <span className="booking-summary-label">
                  BOOKING ID
                </span>

                <strong>
                  #{booking.id}
                </strong>
              </div>

              <div className="booking-summary-item">
                <span className="booking-summary-label">
                  SALON
                </span>

                <strong>
                  {booking.salon_name || "—"}
                </strong>
              </div>

              <div className="booking-summary-item">
                <span className="booking-summary-label">
                  SERVICE
                </span>

                <strong>
                  {booking.service_name || "—"}
                </strong>
              </div>

              <div className="booking-summary-item">
                <span className="booking-summary-label">
                  STYLIST
                </span>

                <strong>
                  {booking.staff_name || "—"}
                </strong>
              </div>

              <div className="booking-summary-item">
                <span className="booking-summary-label">
                  DATE
                </span>

                <strong>
                  {formatDate(booking.booking_date)}
                </strong>
              </div>

              <div className="booking-summary-item">
                <span className="booking-summary-label">
                  TIME
                </span>

                <strong>
                  {formatTime(booking.booking_time)}
                </strong>
              </div>

              <div className="booking-summary-item">
                <span className="booking-summary-label">
                  STATUS
                </span>

                <strong className="booking-status">
                  {booking.status
                    ? booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)
                    : "Pending"}
                </strong>
              </div>

            </div>
          </>
        )}

        <div className="confirmation-actions">

          <Link
            to="/my-bookings"
            className="primary-button"
          >
            View my bookings
          </Link>

          <Link
            to="/salons"
            className="secondary-button"
          >
            Discover more salons
          </Link>

        </div>

      </div>

    </div>
  );
}

export default BookingConfirmation;
