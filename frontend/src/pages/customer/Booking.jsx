import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const salonId = searchParams.get("salonId");
  const serviceId = searchParams.get("serviceId");

  const [salon, setSalon] = useState(null);
  const [service, setService] = useState(null);
  const [staff, setStaff] = useState([]);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] =
    useState(false);
  const [bookingLoading, setBookingLoading] =
    useState(false);

  const [error, setError] = useState("");

  /* =========================================================
     TOKEN
     ========================================================= */

  function getToken() {
    return localStorage.getItem("lumora_token");
  }

  /* =========================================================
     TODAY
     ========================================================= */

  function getToday() {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /* =========================================================
     LOAD SALON / SERVICE / STAFF
     ========================================================= */

  useEffect(() => {
    if (!salonId || !serviceId) {
      setError(
        "Invalid booking information."
      );

      setLoading(false);

      return;
    }

    loadBookingData();
  }, [salonId, serviceId]);

  async function loadBookingData() {
    try {
      setLoading(true);
      setError("");

      const [
        salonResponse,
        serviceResponse,
        staffResponse,
      ] = await Promise.all([
        axios.get(
          `${API_URL}/salons/${salonId}`
        ),

        axios.get(
          `${API_URL}/services/${serviceId}`
        ),

        axios.get(
          `${API_URL}/salons/${salonId}/staff`
        ),
      ]);

      setSalon(salonResponse.data);

      setService(
        serviceResponse.data
      );

      const staffList =
        staffResponse.data || [];

      setStaff(staffList);

      if (staffList.length > 0) {
        setSelectedStaff(
          staffList[0]
        );
      } else {
        setSelectedStaff(null);
      }

      setBookingDate(
        getToday()
      );
    } catch (err) {
      console.error(
        "LOAD BOOKING DATA ERROR:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to load booking information."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     LOAD AVAILABILITY
     ========================================================= */

  useEffect(() => {
    if (
      !salonId ||
      !serviceId ||
      !selectedStaff ||
      !bookingDate
    ) {
      setAvailableSlots([]);
      return;
    }

    loadAvailability();
  }, [
    salonId,
    serviceId,
    selectedStaff,
    bookingDate,
  ]);

  async function loadAvailability() {
    try {
      setAvailabilityLoading(true);

      setAvailableSlots([]);

      setSelectedTime("");

      setError("");

      const response =
        await axios.post(
          `${API_URL}/availability/`,
          {
            salon_id: Number(
              salonId
            ),

            service_id: Number(
              serviceId
            ),

            staff_id: Number(
              selectedStaff.id
            ),

            booking_date:
              bookingDate,
          }
        );

      const slots =
        response.data
          ?.available_slots || [];

      setAvailableSlots(slots);
    } catch (err) {
      console.error(
        "AVAILABILITY ERROR:",
        err
      );

      setAvailableSlots([]);

      setError(
        err.response?.data?.detail ||
          "Unable to load available time slots."
      );
    } finally {
      setAvailabilityLoading(
        false
      );
    }
  }

  /* =========================================================
     FORMAT TIME
     ========================================================= */

  function formatTime(time) {
    if (!time) {
      return "";
    }

    const cleanTime =
      String(time).split(".")[0];

    const parts =
      cleanTime.split(":");

    if (parts.length < 2) {
      return time;
    }

    const hours =
      Number(parts[0]);

    const minutes =
      Number(parts[1]);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return time;
    }

    const date = new Date();

    date.setHours(
      hours,
      minutes,
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  /* =========================================================
     NORMALIZE TIME
     ========================================================= */

  function normalizeBookingTime(
    time
  ) {
    if (!time) {
      return "";
    }

    const value =
      String(time).split(".")[0];

    const parts =
      value.split(":");

    if (parts.length === 2) {
      return `${parts[0].padStart(
        2,
        "0"
      )}:${parts[1].padStart(
        2,
        "0"
      )}:00`;
    }

    if (parts.length >= 3) {
      return `${parts[0].padStart(
        2,
        "0"
      )}:${parts[1].padStart(
        2,
        "0"
      )}:${parts[2].padStart(
        2,
        "0"
      )}`;
    }

    return value;
  }

  /* =========================================================
     FORMAT DATE
     ========================================================= */

  function formatBookingDate(
    dateString
  ) {
    if (!dateString) {
      return "Select a date";
    }

    const date = new Date(
      `${dateString}T00:00:00`
    );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateString;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  /* =========================================================
     CONFIRM BOOKING
     ========================================================= */

  async function handleBooking() {
    const token =
      getToken();

    console.log(
      "========== BOOKING START =========="
    );

    console.log(
      "Token exists:",
      Boolean(token)
    );

    console.log(
      "Salon ID:",
      salonId
    );

    console.log(
      "Service ID:",
      serviceId
    );

    console.log(
      "Staff ID:",
      selectedStaff?.id
    );

    console.log(
      "Booking date:",
      bookingDate
    );

    console.log(
      "Selected time:",
      selectedTime
    );

    /*
     * No token
     */

    if (!token) {
      setError(
        "Your login session is missing. Please sign in again."
      );

      navigate(
        "/login",
        {
          replace: true,

          state: {
            from:
              `/booking?salonId=${salonId}&serviceId=${serviceId}`,
          },
        }
      );

      return;
    }

    /*
     * Validate stylist
     */

    if (!selectedStaff) {
      setError(
        "Please select a stylist."
      );

      return;
    }

    /*
     * Validate date
     */

    if (!bookingDate) {
      setError(
        "Please select a date."
      );

      return;
    }

    /*
     * Validate time
     */

    if (!selectedTime) {
      setError(
        "Please select an available time."
      );

      return;
    }

    /*
     * Prevent duplicate clicks
     */

    if (bookingLoading) {
      return;
    }

    try {
      setBookingLoading(true);

      setError("");

      const bookingTime =
        normalizeBookingTime(
          selectedTime
        );

      const bookingPayload = {
        salon_id: Number(
          salonId
        ),

        service_id: Number(
          serviceId
        ),

        staff_id: Number(
          selectedStaff.id
        ),

        booking_date:
          bookingDate,

        booking_time:
          bookingTime,

        notes:
          notes.trim() || null,
      };

      console.log(
        "SENDING BOOKING:",
        bookingPayload
      );

      const response =
        await axios.post(
          `${API_URL}/bookings/`,
          bookingPayload,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },
          }
        );

      console.log(
        "BOOKING RESPONSE:",
        response.data
      );

      /*
       * Successful booking
       */

      if (
        response.data &&
        response.data.id
      ) {
        console.log(
          "BOOKING SUCCESS:",
          response.data.id
        );

        navigate(
          `/booking-confirmed/${response.data.id}`,
          {
            replace: true,
          }
        );

        return;
      }

      setError(
        "Booking was created but no booking ID was returned."
      );
    } catch (err) {
      console.error(
        "CREATE BOOKING ERROR:",
        err
      );

      const statusCode =
        err.response?.status;

      const detail =
        err.response?.data?.detail;

      console.log(
        "BOOKING STATUS:",
        statusCode
      );

      console.log(
        "BOOKING DETAIL:",
        detail
      );

      /*
       * 401
       */

      if (
        statusCode === 401
      ) {
        localStorage.removeItem(
          "lumora_token"
        );

        localStorage.removeItem(
          "isAuthenticated"
        );

        setError(
          "Your login session has expired. Please sign in again."
        );

        setTimeout(() => {
          navigate(
            "/login",
            {
              replace: true,
            }
          );
        }, 800);

        return;
      }

      /*
       * 403
       */

      if (
        statusCode === 403
      ) {
        setError(
          detail ||
            "You are not allowed to create this booking."
        );

        return;
      }

      /*
       * 400
       */

      if (
        statusCode === 400
      ) {
        setError(
          detail ||
            "This appointment cannot be booked. Please choose another time."
        );

        /*
         * Refresh availability.
         */

        await loadAvailability();

        return;
      }

      /*
       * 422
       */

      if (
        statusCode === 422
      ) {
        if (
          Array.isArray(detail)
        ) {
          const messages =
            detail
              .map(
                (item) =>
                  item.msg
              )
              .filter(Boolean)
              .join(", ");

          setError(
            messages ||
              "Some booking information is invalid."
          );
        } else {
          setError(
            detail ||
              "Some booking information is invalid."
          );
        }

        return;
      }

      /*
       * Network/server error
       */

      setError(
        detail ||
          err.message ||
          "Unable to create booking. Please try again."
      );
    } finally {
      setBookingLoading(
        false
      );
    }
  }

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="page">
        <p>
          Loading booking details...
        </p>
      </div>
    );
  }

  /* =========================================================
     INITIAL ERROR
     ========================================================= */

  if (
    error &&
    !service
  ) {
    return (
      <div className="page">

        <h1>
          Unable to book
        </h1>

        <p>
          {error}
        </p>

        <Link to="/salons">
          Back to salons
        </Link>

      </div>
    );
  }

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <div className="booking-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="site-header">

        <div className="brand">

          <div className="brand-mark">
            L
          </div>

          <div>

            <div className="brand-name">
              Lumora
            </div>

            <div className="brand-subtitle">
              SALON BOOKING
            </div>

          </div>

        </div>


        <nav>

          <Link to="/salons">
            Discover
          </Link>

          <Link to="/my-bookings">
            My Bookings
          </Link>

          <button
            type="button"
            className="sign-out-button"
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

              navigate(
                "/login",
                {
                  replace: true,
                }
              );
            }}
          >
            Sign out
          </button>

        </nav>

      </header>


      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="booking-container">

        <Link
          to={`/salons/${salonId}`}
          className="back-link"
        >
          ← Back to salon
        </Link>


        {/* ===================================================
            HERO
            =================================================== */}

        <section className="booking-hero">

          <div className="eyebrow">
            BOOK YOUR APPOINTMENT
          </div>

          <h1>
            Choose your perfect time.
          </h1>

          <p>
            Select a stylist, date and
            available time for your{" "}
            {service?.name} appointment.
          </p>

        </section>


        {/* ===================================================
            SERVICE
            =================================================== */}

        <section className="service-summary">

          <div className="service-icon">
            ✂
          </div>

          <div className="service-summary-content">

            <div className="salon-name">
              {salon?.name}
            </div>

            <h2>
              {service?.name}
            </h2>

            <div className="service-meta">

              <span>
                ◷{" "}
                {
                  service
                    ?.duration_minutes
                }{" "}
                min
              </span>

              <strong>
                ₹
                {Number(
                  service?.price || 0
                ).toFixed(2)}
              </strong>

            </div>

          </div>

        </section>


        {/* ===================================================
            STEP 01
            =================================================== */}

        <section className="booking-section">

          <div className="section-heading">

            <div className="step-number">
              01
            </div>

            <div>

              <div className="eyebrow">
                CHOOSE
              </div>

              <h2>
                Your stylist
              </h2>

            </div>

          </div>


          <div className="staff-grid">

            {staff.length === 0 ? (

              <div className="empty-box">

                <strong>
                  No stylists are currently available.
                </strong>

                <p>
                  Please try another salon.
                </p>

              </div>

            ) : (

              staff.map(
                (person) => (

                  <button
                    type="button"
                    key={person.id}
                    className={`staff-card ${
                      selectedStaff?.id ===
                      person.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => {

                      setSelectedStaff(
                        person
                      );

                      setSelectedTime("");

                      setAvailableSlots([]);

                      setError("");

                    }}
                  >

                    <div className="staff-avatar">
                      {person.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="staff-info">

                      <h3>
                        {person.name}
                      </h3>

                      <p>
                        Stylist
                      </p>

                    </div>

                    {selectedStaff?.id ===
                      person.id && (
                      <div className="check">
                        ✓
                      </div>
                    )}

                  </button>

                )
              )

            )}

          </div>

        </section>


        {/* ===================================================
            STEP 02
            =================================================== */}

        <section className="booking-section">

          <div className="section-heading">

            <div className="step-number">
              02
            </div>

            <div>

              <div className="eyebrow">
                WHEN
              </div>

              <h2>
                Select a date
              </h2>

            </div>

          </div>


          <div className="date-wrapper">

            <input
              type="date"
              value={bookingDate}
              min={getToday()}
              onChange={(event) => {

                setBookingDate(
                  event.target.value
                );

                setSelectedTime("");

                setAvailableSlots([]);

                setError("");

              }}
            />

          </div>

        </section>


        {/* ===================================================
            STEP 03
            =================================================== */}

        <section className="booking-section">

          <div className="section-heading">

            <div className="step-number">
              03
            </div>

            <div>

              <div className="eyebrow">
                AVAILABLE
              </div>

              <h2>
                Choose a time
              </h2>

            </div>

          </div>


          {availabilityLoading ? (

            <div className="empty-box">

              <div className="empty-icon">
                ◷
              </div>

              <strong>
                Checking availability...
              </strong>

              <p>
                Please wait a moment.
              </p>

            </div>

          ) : availableSlots.length ===
            0 ? (

            <div className="empty-box">

              <div className="empty-icon">
                ◷
              </div>

              <strong>
                No available appointments
              </strong>

              <p>
                Try another date or stylist.
              </p>

            </div>

          ) : (

            <div className="time-grid">

              {availableSlots.map(
                (time) => (

                  <button
                    type="button"
                    key={time}
                    className={`time-button ${
                      selectedTime ===
                      time
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => {

                      setSelectedTime(
                        time
                      );

                      setError("");

                    }}
                  >
                    {formatTime(time)}
                  </button>

                )
              )}

            </div>

          )}

        </section>


        {/* ===================================================
            STEP 04
            =================================================== */}

        <section className="booking-section">

          <div className="section-heading">

            <div className="step-number">
              04
            </div>

            <div>

              <div className="eyebrow">
                OPTIONAL
              </div>

              <h2>
                Anything we should know?
              </h2>

            </div>

          </div>


          <textarea
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value
              )
            }
            placeholder="Add a note for your stylist..."
            rows={4}
          />

        </section>


        {/* ===================================================
            ERROR
            =================================================== */}

        {error && (
          <div className="booking-error">
            {error}
          </div>
        )}


        {/* ===================================================
            SUMMARY
            =================================================== */}

        <section className="appointment-summary">

          <div>

            <div className="eyebrow">
              YOUR APPOINTMENT
            </div>

            <h2>
              {formatBookingDate(
                bookingDate
              )}
            </h2>

            <p>

              {selectedTime
                ? `${formatTime(
                    selectedTime
                  )} · `
                : "Select a time · "}

              {selectedStaff?.name ||
                "Select a stylist"}

            </p>

          </div>


          <button
            type="button"
            className="confirm-button"
            disabled={
              !selectedStaff ||
              !selectedTime ||
              !bookingDate ||
              bookingLoading ||
              availabilityLoading
            }
            onClick={
              handleBooking
            }
          >

            {bookingLoading
              ? "Creating booking..."
              : "Confirm booking →"}

          </button>

        </section>

      </main>

    </div>
  );
}

export default Booking;