import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("lumora_token");
}

function AdminServices() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salons, setSalons] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "",
    salon_id: "",
    category_id: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    salon_id: "",
  });

  useEffect(() => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    loadData();
  }, [navigate]);

  async function loadData() {
    setLoading(true);
    setError("");

    const token = getToken();

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [servicesResponse, categoriesResponse, salonsResponse] =
        await Promise.all([
          axios.get(`${API_URL}/services/`, { headers }),
          axios.get(`${API_URL}/service-categories/`, { headers }),
          axios.get(`${API_URL}/salons/`, { headers }),
        ]);

      setServices(servicesResponse.data || []);
      setCategories(categoriesResponse.data || []);
      setSalons(salonsResponse.data || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load services, categories, or salons."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetServiceForm() {
    setServiceForm({
      name: "",
      description: "",
      price: "",
      duration_minutes: "",
      salon_id: "",
      category_id: "",
    });

    setEditingServiceId(null);
  }

  function resetCategoryForm() {
    setCategoryForm({
      name: "",
      description: "",
      salon_id: "",
    });

    setEditingCategoryId(null);
  }

  function startEditService(service) {
    setEditingServiceId(service.id);

    setServiceForm({
      name: service.name || "",
      description: service.description || "",
      price: service.price || "",
      duration_minutes: service.duration_minutes || "",
      salon_id: service.salon_id || "",
      category_id: service.category_id || "",
    });

    setShowServiceForm(true);
    setSuccess("");
    setError("");
  }

  function startEditCategory(category) {
    setEditingCategoryId(category.id);

    setCategoryForm({
      name: category.name || "",
      description: category.description || "",
      salon_id: category.salon_id || "",
    });

    setShowCategoryForm(true);
    setSuccess("");
    setError("");
  }

  async function handleServiceSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const token = getToken();

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const payload = {
        name: serviceForm.name,
        description: serviceForm.description || null,
        price: Number(serviceForm.price),
        duration_minutes: Number(serviceForm.duration_minutes),
        salon_id: Number(serviceForm.salon_id),
        category_id: serviceForm.category_id
          ? Number(serviceForm.category_id)
          : null,
      };

      if (editingServiceId) {
        await axios.put(
          `${API_URL}/services/${editingServiceId}`,
          {
            name: payload.name,
            description: payload.description,
            price: payload.price,
            duration_minutes: payload.duration_minutes,
            category_id: payload.category_id,
          },
          { headers }
        );

        setSuccess("Service updated successfully.");
      } else {
        await axios.post(`${API_URL}/services/`, payload, {
          headers,
        });

        setSuccess("Service created successfully.");
      }

      resetServiceForm();
      setShowServiceForm(false);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to save the service."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCategorySubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const token = getToken();

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const payload = {
        name: categoryForm.name,
        description: categoryForm.description || null,
        salon_id: Number(categoryForm.salon_id),
      };

      if (editingCategoryId) {
        await axios.put(
          `${API_URL}/service-categories/${editingCategoryId}`,
          {
            name: payload.name,
            description: payload.description,
          },
          { headers }
        );

        setSuccess("Category updated successfully.");
      } else {
        await axios.post(
          `${API_URL}/service-categories/`,
          payload,
          { headers }
        );

        setSuccess("Category created successfully.");
      }

      resetCategoryForm();
      setShowCategoryForm(false);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to save the category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivateService(service) {
    if (!window.confirm(`Deactivate "${service.name}"?`)) {
      return;
    }

    setError("");
    setSuccess("");

    const token = getToken();

    try {
      await axios.delete(
        `${API_URL}/services/${service.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Service deactivated successfully.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to deactivate the service."
      );
    }
  }

  async function deactivateCategory(category) {
    if (!window.confirm(`Deactivate "${category.name}"?`)) {
      return;
    }

    setError("");
    setSuccess("");

    const token = getToken();

    try {
      await axios.delete(
        `${API_URL}/service-categories/${category.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Category deactivated successfully.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to deactivate the category."
      );
    }
  }

  function getSalonName(salonId) {
    const salon = salons.find(
      (item) => item.id === salonId
    );

    return salon?.name || `Salon #${salonId}`;
  }

  function getCategoryName(categoryId) {
    if (!categoryId) {
      return "Uncategorized";
    }

    const category = categories.find(
      (item) => item.id === categoryId
    );

    return category?.name || `Category #${categoryId}`;
  }

  if (loading) {
    return (
      <div className="admin-management-page">
        <main className="management-main">
          <div className="dashboard-loading">
            Loading services and categories...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-management-page">
      <header className="dashboard-header">
        <div className="brand-block">
          <div className="brand-mark">✦</div>

          <div>
            <div className="brand-name">
              Lumora
            </div>

            <div className="brand-role">
              Admin
            </div>
          </div>
        </div>

        <div className="dashboard-user">
          <button
            type="button"
            className="text-button"
            onClick={() => navigate("/admin")}
          >
            Admin Dashboard
          </button>

          <button
            type="button"
            className="text-button"
            onClick={() => {
              localStorage.removeItem("lumora_token");
              localStorage.removeItem("lumora_user");
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="management-main">
        <Link
          to="/admin"
          className="back-link"
        >
          ← Back to admin dashboard
        </Link>

        <section className="management-hero">
          <div className="eyebrow">
            Service Management
          </div>

          <h1>
            Manage
            <br />
            Lumora services.
          </h1>

          <p>
            Manage services, pricing, durations,
            categories, and salon assignments across
            the platform.
          </p>
        </section>

        {error && (
          <div className="error-message">
            <span className="message-icon">!</span>
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <span className="message-icon">✓</span>
            {success}
          </div>
        )}

        {/* SERVICES */}

        <section className="management-section">
          <div className="section-heading-row">
            <div>
              <div className="eyebrow">
                Services
              </div>

              <h2>
                Salon services
              </h2>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => {
                resetServiceForm();
                setShowServiceForm(!showServiceForm);
              }}
            >
              {showServiceForm
                ? "Close"
                : "+ Add service"}
            </button>
          </div>

          {showServiceForm && (
            <form
              className="management-form"
              onSubmit={handleServiceSubmit}
            >
              <h3>
                {editingServiceId
                  ? "Edit service"
                  : "Create service"}
              </h3>

              <div className="form-grid">
                <label>
                  Service name
                  <input
                    type="text"
                    value={serviceForm.name}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        name: event.target.value,
                      })
                    }
                    required
                    minLength={2}
                  />
                </label>

                <label>
                  Salon
                  <select
                    value={serviceForm.salon_id}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        salon_id: event.target.value,
                        category_id: "",
                      })
                    }
                    required
                    disabled={Boolean(editingServiceId)}
                  >
                    <option value="">
                      Select salon
                    </option>

                    {salons.map((salon) => (
                      <option
                        key={salon.id}
                        value={salon.id}
                      >
                        {salon.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Category
                  <select
                    value={serviceForm.category_id}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        category_id: event.target.value,
                      })
                    }
                  >
                    <option value="">
                      No category
                    </option>

                    {categories
                      .filter(
                        (category) =>
                          !serviceForm.salon_id ||
                          category.salon_id ===
                            Number(
                              serviceForm.salon_id
                            )
                      )
                      .map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label>
                  Price
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={serviceForm.price}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        price: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Duration (minutes)
                  <input
                    type="number"
                    min="1"
                    value={
                      serviceForm.duration_minutes
                    }
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        duration_minutes:
                          event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label className="full-width-field">
                  Description
                  <textarea
                    rows="4"
                    value={serviceForm.description}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        description:
                          event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    resetServiceForm();
                    setShowServiceForm(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingServiceId
                    ? "Update service"
                    : "Create service"}
                </button>
              </div>
            </form>
          )}

          {services.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <p>No services found.</p>
            </div>
          ) : (
            <div className="management-grid">
              {services.map((service) => (
                <article
                  className="management-card"
                  key={service.id}
                >
                  <div className="management-card-top">
                    <div className="card-icon">
                      ✦
                    </div>

                    <span
                      className={
                        service.is_active
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {service.is_active
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>
                  </div>

                  <div className="card-eyebrow">
                    SERVICE #{service.id}
                  </div>

                  <h3>
                    {service.name}
                  </h3>

                  <div className="service-price">
                    ₹{service.price}
                  </div>

                  <div className="service-meta-grid">
                    <div>
                      <span>Salon</span>
                      <strong>
                        {getSalonName(
                          service.salon_id
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Category</span>
                      <strong>
                        {getCategoryName(
                          service.category_id
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Duration</span>
                      <strong>
                        {service.duration_minutes} min
                      </strong>
                    </div>
                  </div>

                  {service.description && (
                    <p className="service-description">
                      {service.description}
                    </p>
                  )}

                  <div className="card-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        startEditService(service)
                      }
                    >
                      Edit
                    </button>

                    {service.is_active && (
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() =>
                          deactivateService(service)
                        }
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* CATEGORIES */}

        <section className="management-section category-management-section">
          <div className="section-heading-row">
            <div>
              <div className="eyebrow">
                Categories
              </div>

              <h2>
                Service categories
              </h2>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => {
                resetCategoryForm();
                setShowCategoryForm(
                  !showCategoryForm
                );
              }}
            >
              {showCategoryForm
                ? "Close"
                : "+ Add category"}
            </button>
          </div>

          {showCategoryForm && (
            <form
              className="management-form"
              onSubmit={handleCategorySubmit}
            >
              <h3>
                {editingCategoryId
                  ? "Edit category"
                  : "Create category"}
              </h3>

              <div className="form-grid">
                <label>
                  Category name
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(event) =>
                      setCategoryForm({
                        ...categoryForm,
                        name: event.target.value,
                      })
                    }
                    required
                    minLength={2}
                  />
                </label>

                <label>
                  Salon
                  <select
                    value={categoryForm.salon_id}
                    onChange={(event) =>
                      setCategoryForm({
                        ...categoryForm,
                        salon_id:
                          event.target.value,
                      })
                    }
                    required
                    disabled={Boolean(editingCategoryId)}
                  >
                    <option value="">
                      Select salon
                    </option>

                    {salons.map((salon) => (
                      <option
                        key={salon.id}
                        value={salon.id}
                      >
                        {salon.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="full-width-field">
                  Description
                  <textarea
                    rows="4"
                    value={
                      categoryForm.description
                    }
                    onChange={(event) =>
                      setCategoryForm({
                        ...categoryForm,
                        description:
                          event.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    resetCategoryForm();
                    setShowCategoryForm(false);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingCategoryId
                    ? "Update category"
                    : "Create category"}
                </button>
              </div>
            </form>
          )}

          {categories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <p>No categories found.</p>
            </div>
          ) : (
            <div className="management-grid category-grid">
              {categories.map((category) => (
                <article
                  className="management-card"
                  key={category.id}
                >
                  <div className="management-card-top">
                    <div className="card-icon">
                      ◇
                    </div>

                    <span
                      className={
                        category.is_active
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {category.is_active
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>
                  </div>

                  <div className="card-eyebrow">
                    CATEGORY #{category.id}
                  </div>

                  <h3>
                    {category.name}
                  </h3>

                  <div className="category-salon">
                    {getSalonName(
                      category.salon_id
                    )}
                  </div>

                  {category.description && (
                    <p className="service-description">
                      {category.description}
                    </p>
                  )}

                  <div className="card-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        startEditCategory(category)
                      }
                    >
                      Edit
                    </button>

                    {category.is_active && (
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() =>
                          deactivateCategory(category)
                        }
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminServices;