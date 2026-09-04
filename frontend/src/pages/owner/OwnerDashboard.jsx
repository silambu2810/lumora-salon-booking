import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function getToken() {
  return localStorage.getItem("lumora_token");
}

function getStoredUser() {
  try {
    const storedUser =
      localStorage.getItem("user") ||
      localStorage.getItem("User") ||
      localStorage.getItem("lumora_user");

    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

/*
 * Convert FastAPI errors into a string that React
 * can safely render.
 */
function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return (
      detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (item?.msg) {
            return item.msg;
          }

          return "";
        })
        .filter(Boolean)
        .join(", ") || fallback
    );
  }

  if (typeof detail === "string") {
    return detail;
  }

  return fallback;
}

function formatPrice(price) {
  if (price === null || price === undefined) {
    return "—";
  }

  return `₹${Number(price).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatTime(timeString) {
  if (!timeString) {
    return "—";
  }

  const [hours, minutes] = timeString.split(":");

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function OwnerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [staff, setStaff] = useState([]);

  const [workingHours, setWorkingHours] = useState([]);

  const [selectedLeaveStaff, setSelectedLeaveStaff] =
    useState(null);

  const [staffLeaves, setStaffLeaves] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);

  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [showServiceForm, setShowServiceForm] =
    useState(false);

  const [serviceLoading, setServiceLoading] =
    useState(false);

  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "",
    category_id: "",
  });

  const [workingHoursLoading, setWorkingHoursLoading] =
    useState(false);

  const [workingHoursForm, setWorkingHoursForm] =
    useState(
      DAYS.map((day, index) => ({
        day_of_week: index,
        day_name: day,
        is_open: true,
        opening_time: "09:00",
        closing_time: "18:00",
      }))
    );

  const [leaveLoading, setLeaveLoading] =
    useState(false);

  const [leaveForm, setLeaveForm] = useState({
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    initializeDashboard();
  }, []);

  async function initializeDashboard() {
    const token = getToken();

    if (!token) {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    const storedUser = getStoredUser();

    if (!storedUser) {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    if (storedUser.role !== "salon_owner") {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    setUser(storedUser);

    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      let salonId = storedUser.salon_id;

      /*
       * If salon_id is missing from localStorage,
       * find the salon owned by the current user.
       */
      if (!salonId) {
        const salonsResponse = await axios.get(
          `${API_URL}/salons/`,
          { headers }
        );

        const salons = salonsResponse.data || [];

        const ownerSalon = salons.find(
          (item) =>
            Number(item.owner_id) ===
            Number(storedUser.id)
        );

        if (!ownerSalon) {
          setError(
            "Your owner account is not assigned to a salon."
          );
          return;
        }

        salonId = ownerSalon.id;

        const updatedUser = {
          ...storedUser,
          salon_id: salonId,
        };

        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );

        localStorage.setItem(
          "User",
          JSON.stringify(updatedUser)
        );

        localStorage.setItem(
          "lumora_user",
          JSON.stringify(updatedUser)
        );

        setUser(updatedUser);
      }

      await loadDashboard(
        Number(salonId),
        headers
      );

      await loadWorkingHours(headers);
    } catch (err) {
      console.error(
        "OWNER DASHBOARD INITIALIZATION ERROR:",
        err
      );

      if (err.response?.status === 401) {
        clearSession();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to load your salon dashboard."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard(
    salonId,
    headers
  ) {
    const [
      salonResponse,
      servicesResponse,
      categoriesResponse,
      staffResponse,
    ] = await Promise.all([
      axios.get(
        `${API_URL}/salons/${salonId}`,
        { headers }
      ),

      axios.get(
        `${API_URL}/services/?salon_id=${salonId}`,
        { headers }
      ),

      axios.get(
        `${API_URL}/service-categories/?salon_id=${salonId}`,
        { headers }
      ),

      axios.get(
        `${API_URL}/salons/${salonId}/staff`,
        { headers }
      ),
    ]);

    setSalon(salonResponse.data);
    setServices(servicesResponse.data || []);
    setCategories(categoriesResponse.data || []);
    setStaff(staffResponse.data || []);
  }

  async function loadWorkingHours(headers) {
    try {
      const response = await axios.get(
        `${API_URL}/owner/working-hours`,
        { headers }
      );

      const existingHours =
        response.data || [];

      setWorkingHours(
        DAYS.map((day, index) => {
          const existing =
            existingHours.find(
              (item) =>
                Number(item.day_of_week) === index
            );

          /*
           * BACKEND:
           * open_time
           * close_time
           * is_closed
           *
           * FRONTEND:
           * opening_time
           * closing_time
           * is_open
           *
           * Convert backend format to frontend format.
           */
          if (existing) {
            return {
              day_of_week: index,
              day_name: day,

              is_open:
                existing.is_closed === false,

              opening_time:
                existing.open_time || "09:00",

              closing_time:
                existing.close_time || "18:00",

              id: existing.id,
            };
          }

          /*
           * No record exists yet.
           * Use default working hours.
           */
          return {
            day_of_week: index,
            day_name: day,
            is_open: true,
            opening_time: "09:00",
            closing_time: "18:00",
          };
        })
      );
    } catch (err) {
      console.error(
        "WORKING HOURS ERROR:",
        err
      );

      if (err.response?.status === 401) {
        clearSession();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      /*
       * Keep default working hours if the API
       * does not have records yet.
       */
    }
  }

  async function loadStaffLeaves(staffId) {
    const token = getToken();

    if (!token || !staffId) {
      return;
    }

    try {
      setLeaveLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/owner/staff/${staffId}/leave`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStaffLeaves(response.data || []);
    } catch (err) {
      console.error(
        "STAFF LEAVE ERROR:",
        err
      );

      if (err.response?.status === 401) {
        clearSession();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to load staff leave."
        )
      );
    } finally {
      setLeaveLoading(false);
    }
  }

  function clearSession() {
    localStorage.removeItem("lumora_token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    localStorage.removeItem("User");
    localStorage.removeItem("lumora_user");
    localStorage.removeItem("role");
  }

  function handleStaffChange(event) {
    const { name, value } = event.target;

    setStaffForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleAddStaff(event) {
    event.preventDefault();

    try {
      setStaffLoading(true);
      setError("");

      const token = getToken();

      const response = await axios.post(
        `${API_URL}/owner/staff`,
        {
          name: staffForm.name.trim(),
          email: staffForm.email.trim(),
          phone: staffForm.phone.trim(),
          password: staffForm.password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setStaff((previous) => [
        ...previous,
        response.data,
      ]);

      setStaffForm({
        name: "",
        email: "",
        phone: "",
        password: "",
      });

      setShowStaffForm(false);
    } catch (err) {
      console.error(
        "ADD STAFF ERROR:",
        err
      );

      if (err.response?.status === 401) {
        clearSession();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to add staff member."
        )
      );
    } finally {
      setStaffLoading(false);
    }
  }

  function handleServiceChange(event) {
    const { name, value } = event.target;

    setServiceForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleAddService(event) {
    event.preventDefault();

    if (!user?.salon_id) {
      setError(
        "Your account is not assigned to a salon."
      );
      return;
    }

    try {
      setServiceLoading(true);
      setError("");

      const token = getToken();

      const payload = {
        name: serviceForm.name.trim(),
        description:
          serviceForm.description.trim() || null,
        price: Number(serviceForm.price),
        duration_minutes: Number(
          serviceForm.duration_minutes
        ),
        salon_id: Number(user.salon_id),
      };

      if (serviceForm.category_id) {
        payload.category_id = Number(
          serviceForm.category_id
        );
      }

      const response = await axios.post(
        `${API_URL}/services/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setServices((previous) => [
        ...previous,
        response.data,
      ]);

      setServiceForm({
        name: "",
        description: "",
        price: "",
        duration_minutes: "",
        category_id: "",
      });

      setShowServiceForm(false);
    } catch (err) {
      console.error(
        "ADD SERVICE ERROR:",
        err
      );

      if (err.response?.status === 401) {
        clearSession();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to add service."
        )
      );
    } finally {
      setServiceLoading(false);
    }
  }

  async function handleDeactivateService(
    serviceId
  ) {
    const confirmed = window.confirm(
      "Deactivate this service?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setServiceLoading(true);
      setError("");

      const token = getToken();

      await axios.delete(
        `${API_URL}/services/${serviceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setServices((previous) =>
        previous.filter(
          (service) =>
            service.id !== serviceId
        )
      );
    } catch (err) {
      console.error(
        "DEACTIVATE SERVICE ERROR:",
        err
      );

      if (err.response?.status === 401) {
        clearSession();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to deactivate service."
        )
      );
    } finally {
      setServiceLoading(false);
    }
  }

  function handleWorkingHoursChange(
    dayIndex,
    field,
    value
  ) {
    setWorkingHours((previous) =>
      previous.map((day) =>
        day.day_of_week === dayIndex
          ? {
              ...day,
              [field]: value,
            }
          : day
      )
    );
  }

  /*
   * ========================================================
   * SAVE WORKING HOURS
   *
   * BACKEND EXPECTS:
   *
   * {
   *   "open_time": "09:00",
   *   "close_time": "18:00",
   *   "is_closed": false
   * }
   *
   * ========================================================
   */
  async function saveWorkingHours(day) {
    const token = getToken();

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setWorkingHoursLoading(true);
      setError("");

      /*
       * Convert frontend values to backend values.
       */
      const payload = day.is_open
        ? {
            open_time: day.opening_time,
            close_time: day.closing_time,
            is_closed: false,
          }
        : {
            open_time: null,
            close_time: null,
            is_closed: true,
          };

      let response;

      /*
       * Existing record -> UPDATE
       */
      if (day.id) {
        response = await axios.put(
          `${API_URL}/owner/working-hours/${day.day_of_week}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      /*
       * No record -> CREATE
       */
      else {
        response = await axios.post(
          `${API_URL}/owner/working-hours`,
          {
            day_of_week: day.day_of_week,
            ...payload,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const saved = response.data;

      /*
       * Convert backend response back to
       * frontend format.
       */
      setWorkingHours((previous) =>
        previous.map((item) =>
          item.day_of_week ===
          day.day_of_week
            ? {
                ...item,

                id: saved.id,

                opening_time:
                  saved.open_time || "",

                closing_time:
                  saved.close_time || "",

                is_open:
                  saved.is_closed === false,
              }
            : item
        )
      );

      console.log(
        "WORKING HOURS SAVED:",
        saved
      );
    } catch (err) {
      console.error(
        "SAVE WORKING HOURS ERROR:",
        err
      );

      if (err.response?.status === 401) {
        clearSession();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      /*
       * IMPORTANT:
       * FastAPI validation errors are arrays
       * containing objects.
       *
       * Never put err.response.data.detail
       * directly inside JSX.
       */
      setError(
        getErrorMessage(
          err,
          "Unable to save working hours."
        )
      );
    } finally {
      setWorkingHoursLoading(false);
    }
  }

  function handleLeaveChange(event) {
    const { name, value } = event.target;

    setLeaveForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleAddLeave(event) {
    event.preventDefault();

    if (!selectedLeaveStaff) {
      setError(
        "Please select a staff member."
      );
      return;
    }

    if (!leaveForm.start_date) {
      setError(
        "Please select a start date."
      );
      return;
    }

    if (!leaveForm.end_date) {
      setError(
        "Please select an end date."
      );
      return;
    }

    if (
      leaveForm.end_date <
      leaveForm.start_date
    ) {
      setError(
        "End date cannot be before start date."
      );
      return;
    }

    try {
      setLeaveLoading(true);
      setError("");

      const token = getToken();

      const response = await axios.post(
        `${API_URL}/owner/staff/${selectedLeaveStaff.id}/leave`,
        {
          start_date: leaveForm.start_date,
          end_date: leaveForm.end_date,
          reason:
            leaveForm.reason.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setStaffLeaves((previous) => [
        ...previous,
        response.data,
      ]);

      setLeaveForm({
        start_date: "",
        end_date: "",
        reason: "",
      });
    } catch (err) {
      console.error(
        "ADD STAFF LEAVE ERROR:",
        err
      );

      if (err.response?.status === 401) {
        clearSession();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to add staff leave."
        )
      );
    } finally {
      setLeaveLoading(false);
    }
  }

  async function handleSelectLeaveStaff(
    member
  ) {
    setSelectedLeaveStaff(member);
    setStaffLeaves([]);

    await loadStaffLeaves(member.id);
  }

  function handleLogout() {
    clearSession();

    navigate("/login", {
      replace: true,
    });
  }

  if (loading) {
    return (
      <div className="owner-page">
        <div className="owner-loading">
          <div className="loading-spinner"></div>
          <p>Loading your salon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-page">

      {/* ==========================================
          HEADER
      ========================================== */}

      <header className="owner-header">

        <div className="owner-brand">

          <div className="owner-brand-mark">
            L
          </div>

          <div>
            <strong>Lumora</strong>
            <span>Salon Owner</span>
          </div>

        </div>

        <div className="owner-header-actions">

          <span className="owner-user">
            {user?.name || "Salon Owner"}
          </span>

          <button
            type="button"
            className="owner-logout"
            onClick={handleLogout}
          >
            Sign out
          </button>

        </div>

      </header>


      {/* ==========================================
          MAIN
      ========================================== */}

      <main className="owner-main">

        {error && (
          <div className="owner-error">
            {error}
          </div>
        )}


        {/* WELCOME */}

        <section className="owner-welcome">

          <div>
            <div className="eyebrow">
              SALON MANAGEMENT
            </div>

            <h1>
              Welcome back,
              <br />
              {user?.name || "Owner"}.
            </h1>

            <p>
              Manage your salon, team and beauty
              services from one place.
            </p>
          </div>

        </section>


        {/* SALON OVERVIEW */}

        <section className="owner-overview">

          <div className="owner-overview-main">

            <div className="eyebrow">
              YOUR SALON
            </div>

            <h2>
              {salon?.name || "Your Salon"}
            </h2>

            <p>
              {salon?.description ||
                "Manage your salon operations with Lumora."}
            </p>

            <div className="salon-meta">

              <div>
                <span>Address</span>

                <strong>
                  {salon?.address || "—"}
                </strong>
              </div>

              <div>
                <span>Phone</span>

                <strong>
                  {salon?.phone || "—"}
                </strong>
              </div>

              {salon?.email && (
                <div>
                  <span>Email</span>

                  <strong>
                    {salon.email}
                  </strong>
                </div>
              )}

            </div>

          </div>


          <div className="owner-stat-card">

            <span className="stat-number">
              {services.length}
            </span>

            <span className="stat-label">
              Active services
            </span>

          </div>


          <div className="owner-stat-card">

            <span className="stat-number">
              {staff.length}
            </span>

            <span className="stat-label">
              Team members
            </span>

          </div>

        </section>


        {/* ==========================================
            SERVICES
        ========================================== */}

        <section className="owner-section">

          <div className="owner-section-header">

            <div>
              <div className="eyebrow">
                SERVICES
              </div>

              <h2>
                Your beauty menu
              </h2>

              <p>
                Manage the services customers can
                book at your salon.
              </p>
            </div>

            <button
              type="button"
              className="owner-primary-button"
              onClick={() =>
                setShowServiceForm(
                  (previous) => !previous
                )
              }
            >
              {showServiceForm
                ? "Close"
                : "+ Add service"}
            </button>

          </div>


          {showServiceForm && (
            <form
              className="owner-form-card"
              onSubmit={handleAddService}
            >

              <div className="owner-form-heading">

                <div>
                  <div className="eyebrow">
                    NEW SERVICE
                  </div>

                  <h3>
                    Add a beauty service
                  </h3>
                </div>

              </div>


              <div className="owner-form-grid">

                <label>
                  Service name

                  <input
                    type="text"
                    name="name"
                    value={serviceForm.name}
                    onChange={handleServiceChange}
                    placeholder="e.g. Haircut & Styling"
                    required
                    minLength={2}
                  />
                </label>


                <label>
                  Price

                  <input
                    type="number"
                    name="price"
                    value={serviceForm.price}
                    onChange={handleServiceChange}
                    placeholder="e.g. 800"
                    min="1"
                    step="0.01"
                    required
                  />
                </label>


                <label>
                  Duration

                  <select
                    name="duration_minutes"
                    value={
                      serviceForm.duration_minutes
                    }
                    onChange={handleServiceChange}
                    required
                  >
                    <option value="">
                      Select duration
                    </option>

                    <option value="30">
                      30 minutes
                    </option>

                    <option value="60">
                      60 minutes
                    </option>

                    <option value="90">
                      90 minutes
                    </option>

                    <option value="120">
                      120 minutes
                    </option>
                  </select>
                </label>


                <label>
                  Category

                  <select
                    name="category_id"
                    value={
                      serviceForm.category_id
                    }
                    onChange={handleServiceChange}
                  >
                    <option value="">
                      Select category (optional)
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>


                <label className="full-width">
                  Description

                  <textarea
                    name="description"
                    value={
                      serviceForm.description
                    }
                    onChange={handleServiceChange}
                    placeholder="Describe this service..."
                    rows="3"
                  />
                </label>

              </div>


              <div className="owner-form-actions">

                <button
                  type="button"
                  className="owner-secondary-button"
                  onClick={() =>
                    setShowServiceForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="owner-primary-button"
                  disabled={serviceLoading}
                >
                  {serviceLoading
                    ? "Saving..."
                    : "Create service"}
                </button>

              </div>

            </form>
          )}


          {services.length === 0 ? (
            <div className="owner-empty">

              <div className="owner-empty-icon">
                ✦
              </div>

              <h3>
                No services yet
              </h3>

              <p>
                Add your first service so customers
                can start booking.
              </p>

            </div>
          ) : (
            <div className="owner-services-grid">

              {services.map((service) => (
                <article
                  className="owner-service-card"
                  key={service.id}
                >

                  <div className="service-card-top">

                    <div className="service-icon">
                      ✦
                    </div>

                    <span className="service-active">
                      ACTIVE
                    </span>

                  </div>

                  <h3>
                    {service.name}
                  </h3>

                  <p>
                    {service.description ||
                      "Beauty service at your Lumora salon."}
                  </p>

                  <div className="service-card-meta">

                    <div>
                      <span>PRICE</span>

                      <strong>
                        {formatPrice(
                          service.price
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>DURATION</span>

                      <strong>
                        {service.duration_minutes} min
                      </strong>
                    </div>

                  </div>

                  <button
                    type="button"
                    className="service-deactivate"
                    onClick={() =>
                      handleDeactivateService(
                        service.id
                      )
                    }
                    disabled={serviceLoading}
                  >
                    Deactivate service
                  </button>

                </article>
              ))}

            </div>
          )}

        </section>


        {/* ==========================================
            STAFF
        ========================================== */}

        <section className="owner-section">

          <div className="owner-section-header">

            <div>
              <div className="eyebrow">
                YOUR TEAM
              </div>

              <h2>
                Stylists & staff
              </h2>

              <p>
                Manage the people serving customers
                at your salon.
              </p>
            </div>

            <button
              type="button"
              className="owner-primary-button"
              onClick={() =>
                setShowStaffForm(
                  (previous) => !previous
                )
              }
            >
              {showStaffForm
                ? "Close"
                : "+ Add staff"}
            </button>

          </div>


          {showStaffForm && (
            <form
              className="owner-form-card"
              onSubmit={handleAddStaff}
            >

              <div className="owner-form-heading">

                <div>
                  <div className="eyebrow">
                    NEW TEAM MEMBER
                  </div>

                  <h3>
                    Add staff member
                  </h3>
                </div>

              </div>


              <div className="owner-form-grid">

                <label>
                  Full name

                  <input
                    type="text"
                    name="name"
                    value={staffForm.name}
                    onChange={handleStaffChange}
                    placeholder="e.g. Priya Sharma"
                    required
                    minLength={2}
                  />
                </label>


                <label>
                  Email

                  <input
                    type="email"
                    name="email"
                    value={staffForm.email}
                    onChange={handleStaffChange}
                    placeholder="staff@example.com"
                    required
                  />
                </label>


                <label>
                  Phone

                  <input
                    type="tel"
                    name="phone"
                    value={staffForm.phone}
                    onChange={handleStaffChange}
                    placeholder="10 digit phone number"
                    required
                    minLength={10}
                  />
                </label>


                <label>
                  Temporary password

                  <input
                    type="password"
                    name="password"
                    value={staffForm.password}
                    onChange={handleStaffChange}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                </label>

              </div>


              <div className="owner-form-note">
                Staff accounts are created with the
                <strong> staff </strong>
                role automatically.
              </div>


              <div className="owner-form-actions">

                <button
                  type="button"
                  className="owner-secondary-button"
                  onClick={() =>
                    setShowStaffForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="owner-primary-button"
                  disabled={staffLoading}
                >
                  {staffLoading
                    ? "Creating..."
                    : "Create staff"}
                </button>

              </div>

            </form>
          )}


          {staff.length === 0 ? (
            <div className="owner-empty">

              <div className="owner-empty-icon">
                ♢
              </div>

              <h3>
                No staff members yet
              </h3>

              <p>
                Add stylists and staff members to
                your salon.
              </p>

            </div>
          ) : (
            <div className="owner-staff-grid">

              {staff.map((member) => (
                <article
                  className="owner-staff-card"
                  key={member.id}
                >

                  <div className="staff-avatar">
                    {member.name
                      ?.charAt(0)
                      ?.toUpperCase() || "S"}
                  </div>

                  <div className="staff-info">

                    <h3>
                      {member.name}
                    </h3>

                    <span className="staff-role">
                      {member.role === "staff"
                        ? "Stylist"
                        : member.role}
                    </span>

                    <p>
                      {member.email}
                    </p>

                    <p>
                      {member.phone}
                    </p>

                  </div>

                  <span
                    className={
                      member.is_active
                        ? "staff-active"
                        : "staff-inactive"
                    }
                  >
                    {member.is_active
                      ? "ACTIVE"
                      : "INACTIVE"}
                  </span>

                </article>
              ))}

            </div>
          )}

        </section>


        {/* ==========================================
            WORKING HOURS
        ========================================== */}

        <section className="owner-section">

          <div className="owner-section-header">

            <div>
              <div className="eyebrow">
                AVAILABILITY
              </div>

              <h2>
                Working hours
              </h2>

              <p>
                Set the opening hours customers can
                book appointments.
              </p>
            </div>

          </div>


          <div className="working-hours-card">

            {workingHours.map((day) => (
              <div
                className="working-hours-row"
                key={day.day_of_week}
              >

                <div className="working-day">
                  <strong>
                    {day.day_name}
                  </strong>
                </div>


                <label className="working-toggle">

                  <input
                    type="checkbox"
                    checked={day.is_open}
                    onChange={(event) =>
                      handleWorkingHoursChange(
                        day.day_of_week,
                        "is_open",
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    {day.is_open
                      ? "Open"
                      : "Closed"}
                  </span>

                </label>


                {day.is_open ? (
                  <div className="working-time-fields">

                    <input
                      type="time"
                      value={
                        day.opening_time
                      }
                      onChange={(event) =>
                        handleWorkingHoursChange(
                          day.day_of_week,
                          "opening_time",
                          event.target.value
                        )
                      }
                    />

                    <span>
                      to
                    </span>

                    <input
                      type="time"
                      value={
                        day.closing_time
                      }
                      onChange={(event) =>
                        handleWorkingHoursChange(
                          day.day_of_week,
                          "closing_time",
                          event.target.value
                        )
                      }
                    />

                  </div>
                ) : (
                  <span className="closed-label">
                    Salon closed
                  </span>
                )}


                <button
                  type="button"
                  className="save-hours-button"
                  onClick={() =>
                    saveWorkingHours(day)
                  }
                  disabled={
                    workingHoursLoading
                  }
                >
                  {workingHoursLoading
                    ? "Saving..."
                    : "Save"}
                </button>

              </div>
            ))}

          </div>

        </section>


        {/* ==========================================
            STAFF LEAVE
        ========================================== */}

        <section className="owner-section">

          <div className="owner-section-header">

            <div>
              <div className="eyebrow">
                STAFF AVAILABILITY
              </div>

              <h2>
                Staff leave
              </h2>

              <p>
                Manage leave periods for your stylists.
              </p>
            </div>

          </div>


          <div className="leave-management">

            {/* STAFF SELECTOR */}

            <div className="leave-staff-list">

              <div className="leave-panel-title">
                <span>
                  SELECT STYLIST
                </span>
              </div>

              {staff.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  className={`leave-staff-item ${
                    selectedLeaveStaff?.id ===
                    member.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleSelectLeaveStaff(
                      member
                    )
                  }
                >

                  <span className="leave-avatar">
                    {member.name
                      ?.charAt(0)
                      ?.toUpperCase() || "S"}
                  </span>

                  <span>
                    {member.name}
                  </span>

                </button>
              ))}

            </div>


            {/* LEAVE DETAILS */}

            <div className="leave-details">

              {!selectedLeaveStaff ? (
                <div className="leave-empty">

                  <div className="owner-empty-icon">
                    ♢
                  </div>

                  <h3>
                    Select a stylist
                  </h3>

                  <p>
                    Choose a team member to view
                    and manage their leave.
                  </p>

                </div>
              ) : (
                <>
                  <div className="leave-panel-header">

                    <div>
                      <div className="eyebrow">
                        LEAVE CALENDAR
                      </div>

                      <h3>
                        {selectedLeaveStaff.name}
                      </h3>
                    </div>

                  </div>


                  {/* ADD LEAVE */}

                  <form
                    className="leave-form"
                    onSubmit={handleAddLeave}
                  >

                    <label>
                      Start date

                      <input
                        type="date"
                        name="start_date"
                        value={
                          leaveForm.start_date
                        }
                        onChange={
                          handleLeaveChange
                        }
                        required
                      />
                    </label>


                    <label>
                      End date

                      <input
                        type="date"
                        name="end_date"
                        value={
                          leaveForm.end_date
                        }
                        onChange={
                          handleLeaveChange
                        }
                        required
                      />
                    </label>


                    <label className="leave-reason">
                      Reason

                      <input
                        type="text"
                        name="reason"
                        value={
                          leaveForm.reason
                        }
                        onChange={
                          handleLeaveChange
                        }
                        placeholder="Optional"
                      />
                    </label>


                    <button
                      type="submit"
                      className="owner-primary-button"
                      disabled={leaveLoading}
                    >
                      {leaveLoading
                        ? "Saving..."
                        : "Add leave"}
                    </button>

                  </form>


                  {/* LEAVE LIST */}

                  <div className="leave-list">

                    {leaveLoading &&
                    staffLeaves.length ===
                      0 ? (
                      <div className="leave-loading">
                        Loading leave...
                      </div>
                    ) : staffLeaves.length ===
                      0 ? (
                      <div className="leave-no-records">
                        No leave records for this
                        stylist.
                      </div>
                    ) : (
                      staffLeaves.map(
                        (leave) => (
                          <div
                            className="leave-record"
                            key={leave.id}
                          >

                            <div>
                              <strong>
                                {leave.start_date}
                                {" — "}
                                {leave.end_date}
                              </strong>

                              {leave.reason && (
                                <span>
                                  {leave.reason}
                                </span>
                              )}
                            </div>

                            <span className="leave-badge">
                              LEAVE
                            </span>

                          </div>
                        )
                      )
                    )}

                  </div>
                </>
              )}

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default OwnerDashboard;
