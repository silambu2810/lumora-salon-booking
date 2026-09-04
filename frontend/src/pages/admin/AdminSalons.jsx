import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// =========================================================
// AUTH
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
      localStorage.getItem("lumora_user") ||
      localStorage.getItem("user") ||
      localStorage.getItem("User");

    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// =========================================================
// ERROR HANDLING
// =========================================================

function getErrorMessage(error, fallback) {
  const response = error?.response;
  const detail = response?.data?.detail;

  console.error("API ERROR:", {
    status: response?.status,
    data: response?.data,
    detail,
  });

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item?.msg) {
          const location = Array.isArray(item.loc)
            ? item.loc.join(" → ")
            : "";

          return location
            ? `${location}: ${item.msg}`
            : item.msg;
        }

        return JSON.stringify(item);
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (detail && typeof detail === "object") {
    return detail.msg || JSON.stringify(detail);
  }

  if (response?.status === 401) {
    return "Your session has expired. Please login again.";
  }

  if (response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (response?.status === 404) {
    return "Requested API endpoint was not found.";
  }

  if (response?.status === 409) {
    return "This record already exists or conflicts with another record.";
  }

  if (response?.status === 422) {
    return "The server rejected the submitted data. Please check the form values.";
  }

  return error?.message || fallback;
}

// =========================================================
// EMPTY FORMS
// =========================================================

const EMPTY_SALON_FORM = {
  name: "",
  address: "",
  phone: "",
  email: "",
  description: "",
};

const EMPTY_OWNER_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  salon_id: "",
};

// =========================================================
// COMPONENT
// =========================================================

function AdminSalons() {
  const navigate = useNavigate();

  const [salons, setSalons] = useState([]);
  const [owners, setOwners] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [salonFormOpen, setSalonFormOpen] = useState(false);
  const [ownerFormOpen, setOwnerFormOpen] = useState(false);

  const [salonLoading, setSalonLoading] = useState(false);
  const [ownerLoading, setOwnerLoading] = useState(false);

  const [salonActionLoading, setSalonActionLoading] =
    useState(null);

  const [ownerActionLoading, setOwnerActionLoading] =
    useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [salonForm, setSalonForm] = useState({
    ...EMPTY_SALON_FORM,
  });

  const [ownerForm, setOwnerForm] = useState({
    ...EMPTY_OWNER_FORM,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [salonPhoneError, setSalonPhoneError] =
    useState("");

  const [ownerPhoneError, setOwnerPhoneError] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [confirmPasswordError, setConfirmPasswordError] =
    useState("");

  const user = getStoredUser();

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // LOGOUT
  // =========================================================

  function handleLogout() {
    localStorage.removeItem("lumora_token");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");

    localStorage.removeItem("user");
    localStorage.removeItem("User");
    localStorage.removeItem("lumora_user");

    localStorage.removeItem("role");

    navigate("/login", {
      replace: true,
    });
  }

  // =========================================================
  // HEADERS
  // =========================================================

  function getHeaders() {
    const token = getToken();

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  // =========================================================
  // LOAD DATA
  // =========================================================

  async function loadData() {
    const token = getToken();

    if (!token) {
      handleLogout();
      return;
    }

    try {
      setError("");

      // -----------------------------------------------------
      // IMPORTANT:
      // ADMIN MUST LOAD ACTIVE + INACTIVE SALONS
      // -----------------------------------------------------

      const salonsResponse = await axios.get(
        `${API_URL}/salons/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const salonData = Array.isArray(
        salonsResponse.data
      )
        ? salonsResponse.data
        : [];

      setSalons(salonData);

      // -----------------------------------------------------
      // LOAD ALL OWNERS
      // -----------------------------------------------------

      const ownersResponse = await axios.get(
        `${API_URL}/admin/salon-owners`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const ownerData = Array.isArray(
        ownersResponse.data
      )
        ? ownersResponse.data
        : [];

      setOwners(ownerData);

      console.log("ADMIN SALONS:", salonData);
      console.log("SALON OWNERS:", ownerData);
    } catch (err) {
      console.error(
        "LOAD ADMIN SALON DATA ERROR:",
        err
      );

      if (err?.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to load salon management data."
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
    if (refreshing) {
      return;
    }

    setMessage("");
    setError("");
    setRefreshing(true);

    await loadData();
  }

  // =========================================================
  // SALON INPUT
  // =========================================================

  function handleSalonChange(event) {
    const { name, value } = event.target;

    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");

      setSalonForm((current) => ({
        ...current,
        phone: digitsOnly,
      }));

      if (digitsOnly.length === 0) {
        setSalonPhoneError(
          "Phone number is required."
        );
      } else if (digitsOnly.length !== 10) {
        setSalonPhoneError(
          "Phone number must contain exactly 10 digits."
        );
      } else {
        setSalonPhoneError("");
      }

      setMessage("");
      setError("");

      return;
    }

    setSalonForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }

  // =========================================================
  // OWNER INPUT
  // =========================================================

  function handleOwnerChange(event) {
    const { name, value } = event.target;

    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");

      setOwnerForm((current) => ({
        ...current,
        phone: digitsOnly,
      }));

      if (digitsOnly.length === 0) {
        setOwnerPhoneError(
          "Phone number is required."
        );
      } else if (digitsOnly.length !== 10) {
        setOwnerPhoneError(
          "Phone number must contain exactly 10 digits."
        );
      } else {
        setOwnerPhoneError("");
      }

      setMessage("");
      setError("");

      return;
    }

    if (name === "password") {
      setOwnerForm((current) => ({
        ...current,
        password: value,
      }));

      if (value.length === 0) {
        setPasswordError(
          "Password is required."
        );
      } else if (value.length < 8) {
        setPasswordError(
          "Password must be at least 8 characters."
        );
      } else {
        setPasswordError("");
      }

      if (
        ownerForm.confirmPassword &&
        value !== ownerForm.confirmPassword
      ) {
        setConfirmPasswordError(
          "Passwords do not match."
        );
      } else {
        setConfirmPasswordError("");
      }

      setMessage("");
      setError("");

      return;
    }

    if (name === "confirmPassword") {
      setOwnerForm((current) => ({
        ...current,
        confirmPassword: value,
      }));

      if (value.length === 0) {
        setConfirmPasswordError(
          "Please re-type the password."
        );
      } else if (
        value !== ownerForm.password
      ) {
        setConfirmPasswordError(
          "Passwords do not match."
        );
      } else {
        setConfirmPasswordError("");
      }

      setMessage("");
      setError("");

      return;
    }

    setOwnerForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }

  // =========================================================
  // OPEN SALON FORM
  // =========================================================

  function openSalonForm() {
    setSalonForm({
      ...EMPTY_SALON_FORM,
    });

    setSalonPhoneError("");
    setSalonFormOpen(true);
    setOwnerFormOpen(false);

    setMessage("");
    setError("");
  }

  // =========================================================
  // CLOSE SALON FORM
  // =========================================================

  function closeSalonForm() {
    if (salonLoading) {
      return;
    }

    setSalonFormOpen(false);

    setSalonForm({
      ...EMPTY_SALON_FORM,
    });

    setSalonPhoneError("");
    setError("");
  }

  // =========================================================
  // OPEN OWNER FORM
  // =========================================================

  function openOwnerForm() {
    setOwnerForm({
      ...EMPTY_OWNER_FORM,
    });

    setOwnerPhoneError("");
    setPasswordError("");
    setConfirmPasswordError("");

    setShowPassword(false);
    setShowConfirmPassword(false);

    setOwnerFormOpen(true);
    setSalonFormOpen(false);

    setMessage("");
    setError("");
  }

  // =========================================================
  // CLOSE OWNER FORM
  // =========================================================

  function closeOwnerForm() {
    if (ownerLoading) {
      return;
    }

    setOwnerFormOpen(false);

    setOwnerForm({
      ...EMPTY_OWNER_FORM,
    });

    setOwnerPhoneError("");
    setPasswordError("");
    setConfirmPasswordError("");

    setShowPassword(false);
    setShowConfirmPassword(false);

    setError("");
  }

  // =========================================================
  // CREATE SALON
  // =========================================================

  async function handleCreateSalon(event) {
    event.preventDefault();

    if (salonLoading) {
      return;
    }

    const token = getToken();

    if (!token) {
      handleLogout();
      return;
    }

    setMessage("");
    setError("");

    const name = salonForm.name.trim();
    const address = salonForm.address.trim();
    const phone = salonForm.phone.trim();
    const email = salonForm.email.trim();
    const description =
      salonForm.description.trim();

    if (!name) {
      setError("Salon name is required.");
      return;
    }

    if (name.length < 2) {
      setError(
        "Salon name must contain at least 2 characters."
      );
      return;
    }

    if (!address) {
      setError("Salon address is required.");
      return;
    }

    if (!phone) {
      setSalonPhoneError(
        "Phone number is required."
      );
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setSalonPhoneError(
        "Phone number must contain exactly 10 digits."
      );
      return;
    }

    const payload = {
      name,
      address,
      phone,
      email: email || null,
      description: description || null,
    };

    try {
      setSalonLoading(true);

      await axios.post(
        `${API_URL}/salons/`,
        payload,
        {
          headers: getHeaders(),
        }
      );

      setMessage(
        "Salon created successfully."
      );

      setSalonForm({
        ...EMPTY_SALON_FORM,
      });

      setSalonPhoneError("");
      setSalonFormOpen(false);

      await loadData();
    } catch (err) {
      console.error(
        "CREATE SALON ERROR:",
        err
      );

      if (err?.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to create salon."
        )
      );
    } finally {
      setSalonLoading(false);
    }
  }

  // =========================================================
  // CREATE OWNER
  // =========================================================

  async function handleCreateOwner(event) {
    event.preventDefault();

    if (ownerLoading) {
      return;
    }

    const token = getToken();

    if (!token) {
      handleLogout();
      return;
    }

    setMessage("");
    setError("");

    const name = ownerForm.name.trim();
    const email = ownerForm.email.trim();
    const phone = ownerForm.phone.trim();
    const password = ownerForm.password;
    const confirmPassword =
      ownerForm.confirmPassword;
    const salonId = ownerForm.salon_id;

    if (!name) {
      setError("Owner name is required.");
      return;
    }

    if (name.length < 2) {
      setError(
        "Owner name must contain at least 2 characters."
      );
      return;
    }

    if (!email) {
      setError("Owner email is required.");
      return;
    }

    if (!phone) {
      setOwnerPhoneError(
        "Phone number is required."
      );
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setOwnerPhoneError(
        "Phone number must contain exactly 10 digits."
      );
      return;
    }

    if (!password) {
      setPasswordError(
        "Password is required."
      );
      return;
    }

    if (password.length < 8) {
      setPasswordError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(
        "Please re-type the password."
      );
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError(
        "Passwords do not match."
      );
      return;
    }

    if (!salonId) {
      setError("Please select a salon.");
      return;
    }

    const ownerPayload = {
      name,
      email,
      phone,
      password,
    };

    try {
      setOwnerLoading(true);

      const headers = getHeaders();

      // -----------------------------------------------------
      // CREATE OWNER
      // -----------------------------------------------------

      const ownerResponse =
        await axios.post(
          `${API_URL}/admin/salon-owners`,
          ownerPayload,
          {
            headers,
          }
        );

      const createdOwner =
        ownerResponse.data;

      if (!createdOwner?.id) {
        throw new Error(
          "Owner was created but the server did not return an owner ID."
        );
      }

      // -----------------------------------------------------
      // ASSIGN OWNER
      // -----------------------------------------------------

      await axios.put(
        `${API_URL}/admin/salons/${salonId}/owner`,
        {
          owner_id: createdOwner.id,
        },
        {
          headers,
        }
      );

      setMessage(
        "Salon owner created and assigned successfully."
      );

      setOwnerForm({
        ...EMPTY_OWNER_FORM,
      });

      setOwnerPhoneError("");
      setPasswordError("");
      setConfirmPasswordError("");

      setShowPassword(false);
      setShowConfirmPassword(false);

      setOwnerFormOpen(false);

      await loadData();
    } catch (err) {
      console.error(
        "CREATE / ASSIGN OWNER ERROR:",
        err
      );

      if (err?.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to create or assign salon owner."
        )
      );
    } finally {
      setOwnerLoading(false);
    }
  }

  // =========================================================
  // OWNER LOOKUP
  // =========================================================

  function getOwnerForSalon(salonId) {
    return owners.find(
      (owner) =>
        Number(owner.salon_id) ===
        Number(salonId)
    );
  }

  // =========================================================
  // DEACTIVATE SALON
  // =========================================================

  async function handleDeactivateSalon(salon) {
    if (!salon?.id) {
      return;
    }

    if (salonActionLoading !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Deactivate ${salon.name}?\n\nCustomers will no longer see this salon or be able to make new bookings. Existing historical data will be preserved.`
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      handleLogout();
      return;
    }

    setMessage("");
    setError("");
    setSalonActionLoading(salon.id);

    try {
      await axios.delete(
        `${API_URL}/salons/${salon.id}`,
        {
          headers: getHeaders(),
        }
      );

      setMessage(
        `${salon.name} has been deactivated successfully.`
      );

      await loadData();
    } catch (err) {
      console.error(
        "DEACTIVATE SALON ERROR:",
        err
      );

      if (err?.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to deactivate salon."
        )
      );
    } finally {
      setSalonActionLoading(null);
    }
  }

  // =========================================================
  // REACTIVATE SALON
  // =========================================================

  async function handleActivateSalon(salon) {
    if (!salon?.id) {
      return;
    }

    if (salonActionLoading !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Reactivate ${salon.name}?\n\nCustomers will be able to discover the salon and make new bookings again.`
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      handleLogout();
      return;
    }

    setMessage("");
    setError("");
    setSalonActionLoading(salon.id);

    try {
      await axios.put(
        `${API_URL}/salons/${salon.id}`,
        {
          is_active: true,
        },
        {
          headers: getHeaders(),
        }
      );

      setMessage(
        `${salon.name} has been reactivated successfully.`
      );

      await loadData();
    } catch (err) {
      console.error(
        "REACTIVATE SALON ERROR:",
        err
      );

      if (err?.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to reactivate salon."
        )
      );
    } finally {
      setSalonActionLoading(null);
    }
  }

  // =========================================================
  // DEACTIVATE OWNER
  // =========================================================

  async function handleDeactivateOwner(owner) {
    if (!owner?.id) {
      return;
    }

    if (ownerActionLoading) {
      return;
    }

    const confirmed = window.confirm(
      `Deactivate ${owner.name}?\n\nThey will no longer be able to login or manage the salon. Their data will be preserved.`
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      handleLogout();
      return;
    }

    setMessage("");
    setError("");
    setOwnerActionLoading(owner.id);

    try {
      await axios.put(
        `${API_URL}/admin/salon-owners/${owner.id}/deactivate`,
        {},
        {
          headers: getHeaders(),
        }
      );

      setMessage(
        `${owner.name} has been deactivated successfully.`
      );

      await loadData();
    } catch (err) {
      console.error(
        "DEACTIVATE OWNER ERROR:",
        err
      );

      if (err?.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to deactivate salon owner."
        )
      );
    } finally {
      setOwnerActionLoading(null);
    }
  }

  // =========================================================
  // ACTIVATE OWNER
  // =========================================================

  async function handleActivateOwner(owner) {
    if (!owner?.id) {
      return;
    }

    if (ownerActionLoading) {
      return;
    }

    const confirmed = window.confirm(
      `Reactivate ${owner.name}?`
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      handleLogout();
      return;
    }

    setMessage("");
    setError("");
    setOwnerActionLoading(owner.id);

    try {
      await axios.put(
        `${API_URL}/admin/salon-owners/${owner.id}/activate`,
        {},
        {
          headers: getHeaders(),
        }
      );

      setMessage(
        `${owner.name} has been reactivated successfully.`
      );

      await loadData();
    } catch (err) {
      console.error(
        "ACTIVATE OWNER ERROR:",
        err
      );

      if (err?.response?.status === 401) {
        handleLogout();
        return;
      }

      setError(
        getErrorMessage(
          err,
          "Unable to reactivate salon owner."
        )
      );
    } finally {
      setOwnerActionLoading(null);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="page">
        <div className="dashboard-loading">
          <div className="eyebrow">
            ADMIN PORTAL
          </div>

          <h1>
            Loading salon management...
          </h1>

          <p>
            Please wait while we load the
            salon data.
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
          SALON MANAGEMENT
        </div>

        <h1>
          Manage
          <br />
          Lumora salons.
        </h1>

        <p>
          Create salons, assign owners and
          manage platform locations.
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

          <span>
            {message}
          </span>
        </div>
      )}

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

      {/* =====================================================
          ACTIONS
          ===================================================== */}

      <section className="management-actions">

        <button
          type="button"
          className="primary-button"
          onClick={openSalonForm}
          disabled={
            salonLoading ||
            ownerLoading ||
            salonActionLoading !== null ||
            ownerActionLoading !== null
          }
        >
          + Add salon
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={openOwnerForm}
          disabled={
            salonLoading ||
            ownerLoading ||
            salonActionLoading !== null ||
            ownerActionLoading !== null
          }
        >
          + Add salon owner
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={handleRefresh}
          disabled={
            refreshing ||
            salonLoading ||
            ownerLoading ||
            salonActionLoading !== null ||
            ownerActionLoading !== null
          }
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </section>

      {/* =====================================================
          CREATE SALON
          ===================================================== */}

      {salonFormOpen && (
        <section className="management-form-card">

          <div className="form-heading">

            <div className="eyebrow">
              NEW SALON
            </div>

            <h2>
              Create a salon
            </h2>

            <p>
              Add a new salon location to Lumora.
            </p>

          </div>

          <form
            onSubmit={handleCreateSalon}
            autoComplete="off"
          >

            <div className="form-grid">

              <label>
                Salon name

                <input
                  type="text"
                  name="name"
                  autoComplete="off"
                  value={salonForm.name}
                  onChange={handleSalonChange}
                  placeholder="Lumora Beauty Studio"
                  required
                  minLength={2}
                  maxLength={150}
                  disabled={salonLoading}
                />
              </label>

              <label>
                Phone

                <input
                  type="tel"
                  name="phone"
                  autoComplete="off"
                  inputMode="numeric"
                  value={salonForm.phone}
                  onChange={handleSalonChange}
                  placeholder="9876543210"
                  required
                  maxLength={10}
                  disabled={salonLoading}
                  className={
                    salonPhoneError
                      ? "input-error"
                      : ""
                  }
                />

                {salonPhoneError && (
                  <span className="field-error">
                    {salonPhoneError}
                  </span>
                )}
              </label>

              <label className="full-width">
                Address

                <textarea
                  name="address"
                  autoComplete="off"
                  value={salonForm.address}
                  onChange={handleSalonChange}
                  placeholder="Chennai, Tamil Nadu"
                  required
                  rows="4"
                  disabled={salonLoading}
                />
              </label>

              <label>
                Email

                <input
                  type="email"
                  name="email"
                  autoComplete="off"
                  value={salonForm.email}
                  onChange={handleSalonChange}
                  placeholder="salon@lumora.com"
                  disabled={salonLoading}
                />
              </label>

              <label>
                Description

                <input
                  type="text"
                  name="description"
                  autoComplete="off"
                  value={salonForm.description}
                  onChange={handleSalonChange}
                  placeholder="Premium beauty and hair salon"
                  disabled={salonLoading}
                />
              </label>

            </div>

            <div className="form-actions">

              <button
                type="submit"
                className="primary-button"
                disabled={
                  salonLoading ||
                  Boolean(salonPhoneError)
                }
              >
                {salonLoading
                  ? "Creating..."
                  : "Create salon"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={closeSalonForm}
                disabled={salonLoading}
              >
                Cancel
              </button>

            </div>

          </form>

        </section>
      )}

      {/* =====================================================
          CREATE OWNER
          ===================================================== */}

      {ownerFormOpen && (
        <section className="management-form-card">

          <div className="form-heading">

            <div className="eyebrow">
              NEW SALON OWNER
            </div>

            <h2>
              Create salon owner
            </h2>

            <p>
              Create an owner account and assign
              it to a salon.
            </p>

          </div>

          <form
            onSubmit={handleCreateOwner}
            autoComplete="off"
          >

            <div className="form-grid">

              <label>
                Full name

                <input
                  type="text"
                  name="name"
                  autoComplete="off"
                  value={ownerForm.name}
                  onChange={handleOwnerChange}
                  placeholder="Salon Owner"
                  required
                  minLength={2}
                  maxLength={100}
                  disabled={ownerLoading}
                />
              </label>

              <label>
                Email

                <input
                  type="email"
                  name="email"
                  autoComplete="off"
                  value={ownerForm.email}
                  onChange={handleOwnerChange}
                  placeholder="owner@lumora.com"
                  required
                  disabled={ownerLoading}
                />
              </label>

              <label>
                Phone

                <input
                  type="tel"
                  name="phone"
                  autoComplete="off"
                  inputMode="numeric"
                  value={ownerForm.phone}
                  onChange={handleOwnerChange}
                  placeholder="9876543210"
                  required
                  maxLength={10}
                  disabled={ownerLoading}
                  className={
                    ownerPhoneError
                      ? "input-error"
                      : ""
                  }
                />

                {ownerPhoneError && (
                  <span className="field-error">
                    {ownerPhoneError}
                  </span>
                )}
              </label>

              <label>
                Password

                <div className="password-input-wrapper">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    autoComplete="new-password"
                    value={ownerForm.password}
                    onChange={handleOwnerChange}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    maxLength={128}
                    disabled={ownerLoading}
                    className={
                      passwordError
                        ? "input-error"
                        : ""
                    }
                  />

                  <button
                    type="button"
                    className="password-eye-button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    disabled={ownerLoading}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "◉" : "◌"}
                  </button>

                </div>

                {passwordError && (
                  <span className="field-error">
                    {passwordError}
                  </span>
                )}

              </label>

              <label>
                Re-type password

                <div className="password-input-wrapper">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={
                      ownerForm.confirmPassword
                    }
                    onChange={handleOwnerChange}
                    placeholder="Re-type your password"
                    required
                    minLength={8}
                    maxLength={128}
                    disabled={ownerLoading}
                    className={
                      confirmPasswordError
                        ? "input-error"
                        : ""
                    }
                  />

                  <button
                    type="button"
                    className="password-eye-button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) => !current
                      )
                    }
                    disabled={ownerLoading}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? "◉" : "◌"}
                  </button>

                </div>

                {confirmPasswordError && (
                  <span className="field-error">
                    {confirmPasswordError}
                  </span>
                )}

              </label>

              <label className="full-width">
                Assign salon

                <select
                  name="salon_id"
                  value={ownerForm.salon_id}
                  onChange={handleOwnerChange}
                  required
                  disabled={ownerLoading}
                >

                  <option value="">
                    Select a salon
                  </option>

                  {salons
                    .filter(
                      (salon) => salon.is_active
                    )
                    .map((salon) => {

                      const owner =
                        getOwnerForSalon(
                          salon.id
                        );

                      return (
                        <option
                          key={salon.id}
                          value={salon.id}
                          disabled={
                            Boolean(owner)
                          }
                        >
                          {salon.name}

                          {owner
                            ? " — Owner assigned"
                            : ""}
                        </option>
                      );
                    })}

                </select>

              </label>

            </div>

            <div className="form-actions">

              <button
                type="submit"
                className="primary-button"
                disabled={
                  ownerLoading ||
                  Boolean(ownerPhoneError) ||
                  Boolean(passwordError) ||
                  Boolean(confirmPasswordError)
                }
              >
                {ownerLoading
                  ? "Creating..."
                  : "Create owner"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={closeOwnerForm}
                disabled={ownerLoading}
              >
                Cancel
              </button>

            </div>

          </form>

        </section>
      )}

      {/* =====================================================
          SALONS
          ===================================================== */}

      <section className="management-section">

        <div className="section-heading-row">

          <div>

            <div className="eyebrow">
              ALL LOCATIONS
            </div>

            <h2>
              Salons
            </h2>

            <p>
              {salons.length} salon
              {salons.length === 1
                ? ""
                : "s"} on Lumora.
            </p>

          </div>

          <div className="count-pill">
            {salons.length}
          </div>

        </div>

        {salons.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              ✦
            </div>

            <h3>
              No salons yet
            </h3>

            <p>
              Create the first salon to start
              building the platform.
            </p>

          </div>

        ) : (

          <div className="management-grid">

            {salons.map((salon) => {

              const owner =
                getOwnerForSalon(
                  salon.id
                );

              return (
                <article
                  key={salon.id}
                  className="management-card"
                >

                  {/* CARD TOP */}

                  <div className="management-card-top">

                    <div className="card-icon">
                      ✦
                    </div>

                    <span
                      className={
                        salon.is_active
                          ? "status-badge status-active"
                          : "status-badge status-inactive"
                      }
                    >
                      {salon.is_active
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>

                  </div>

                  <div className="eyebrow">
                    SALON #{salon.id}
                  </div>

                  <h3>
                    {salon.name}
                  </h3>

                  <p className="card-description">
                    {salon.description ||
                      "No description provided."}
                  </p>

                  {/* SALON DETAILS */}

                  <div className="salon-meta">

                    <div>
                      <span>
                        ADDRESS
                      </span>

                      <strong>
                        {salon.address || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        PHONE
                      </span>

                      <strong>
                        {salon.phone || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        EMAIL
                      </span>

                      <strong>
                        {salon.email || "—"}
                      </strong>
                    </div>

                  </div>

                  {/* OWNER */}

                  <div className="owner-panel">

                    <span>
                      SALON OWNER
                    </span>

                    {owner ? (

                      <div>

                        <strong>
                          {owner.name}
                        </strong>

                        <small>
                          {owner.email}
                        </small>

                        <div
                          style={{
                            marginTop: "10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                          }}
                        >

                          <span
                            className={
                              owner.is_active
                                ? "status-badge status-active"
                                : "status-badge status-inactive"
                            }
                          >
                            {owner.is_active
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </span>

                          {owner.is_active ? (

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                handleDeactivateOwner(
                                  owner
                                )
                              }
                              disabled={
                                ownerActionLoading !==
                                null
                              }
                            >
                              {ownerActionLoading ===
                              owner.id
                                ? "Deactivating..."
                                : "Deactivate owner"}
                            </button>

                          ) : (

                            <button
                              type="button"
                              className="primary-button"
                              onClick={() =>
                                handleActivateOwner(
                                  owner
                                )
                              }
                              disabled={
                                ownerActionLoading !==
                                null
                              }
                            >
                              {ownerActionLoading ===
                              owner.id
                                ? "Reactivating..."
                                : "Reactivate owner"}
                            </button>

                          )}

                        </div>

                      </div>

                    ) : (

                      <div>

                        <strong>
                          No owner assigned
                        </strong>

                        <small>
                          Create an owner and assign
                          this salon.
                        </small>

                      </div>

                    )}

                  </div>

                  {/* SALON ACTION */}

                  <div
                    style={{
                      marginTop: "18px",
                      paddingTop: "18px",
                      borderTop:
                        "1px solid rgba(0,0,0,0.08)",
                    }}
                  >

                    {salon.is_active ? (

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          handleDeactivateSalon(
                            salon
                          )
                        }
                        disabled={
                          salonActionLoading !== null
                        }
                        style={{
                          width: "100%",
                        }}
                      >
                        {salonActionLoading ===
                        salon.id
                          ? "Deactivating salon..."
                          : "Deactivate salon"}
                      </button>

                    ) : (

                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          handleActivateSalon(
                            salon
                          )
                        }
                        disabled={
                          salonActionLoading !== null
                        }
                        style={{
                          width: "100%",
                        }}
                      >
                        {salonActionLoading ===
                        salon.id
                          ? "Reactivating salon..."
                          : "Reactivate salon"}
                      </button>

                    )}

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </section>

      {/* =====================================================
          OWNER DIRECTORY
          ===================================================== */}

      <section className="management-section">

        <div className="section-heading-row">

          <div>

            <div className="eyebrow">
              OWNER DIRECTORY
            </div>

            <h2>
              Salon owners
            </h2>

            <p>
              Manage owner account access.
            </p>

          </div>

          <div className="count-pill">
            {owners.length}
          </div>

        </div>

        {owners.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              ✦
            </div>

            <h3>
              No salon owners
            </h3>

            <p>
              Create a salon owner account
              to get started.
            </p>

          </div>

        ) : (

          <div className="management-grid">

            {owners.map((owner) => {

              const assignedSalon =
                salons.find(
                  (salon) =>
                    Number(salon.id) ===
                    Number(owner.salon_id)
                );

              return (
                <article
                  key={owner.id}
                  className="management-card"
                >

                  <div className="management-card-top">

                    <div className="card-icon">
                      {owner.name
                        ?.charAt(0)
                        ?.toUpperCase() || "O"}
                    </div>

                    <span
                      className={
                        owner.is_active
                          ? "status-badge status-active"
                          : "status-badge status-inactive"
                      }
                    >
                      {owner.is_active
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>

                  </div>

                  <div className="eyebrow">
                    OWNER #{owner.id}
                  </div>

                  <h3>
                    {owner.name}
                  </h3>

                  <p className="card-description">
                    {owner.email}
                  </p>

                  <div className="salon-meta">

                    <div>
                      <span>
                        PHONE
                      </span>

                      <strong>
                        {owner.phone || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        SALON
                      </span>

                      <strong>
                        {assignedSalon?.name ||
                          "Not assigned"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        EMAIL VERIFIED
                      </span>

                      <strong>
                        {owner.is_email_verified
                          ? "Yes"
                          : "No"}
                      </strong>
                    </div>

                  </div>

                  <div
                    style={{
                      marginTop: "18px",
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >

                    {owner.is_active ? (

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          handleDeactivateOwner(
                            owner
                          )
                        }
                        disabled={
                          ownerActionLoading !==
                          null
                        }
                      >
                        {ownerActionLoading ===
                        owner.id
                          ? "Deactivating..."
                          : "Deactivate owner"}
                      </button>

                    ) : (

                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          handleActivateOwner(
                            owner
                          )
                        }
                        disabled={
                          ownerActionLoading !==
                          null
                        }
                      >
                        {ownerActionLoading ===
                        owner.id
                          ? "Reactivating..."
                          : "Reactivate owner"}
                      </button>

                    )}

                  </div>

                </article>
              );
            })}

          </div>

        )}

      </section>

      {/* =====================================================
          SECURITY
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
            Salon and owner management are
            protected by backend role-based
            access control. Deactivation
            preserves historical data.
          </p>

        </div>

      </section>

    </div>
  );
}

export default AdminSalons;
