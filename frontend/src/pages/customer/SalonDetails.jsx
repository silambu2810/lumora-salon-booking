import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Mail,
  MapPin,
  Phone,
  Scissors,
  Sparkles,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getSalon,
  getSalonCategories,
  getSalonServices,
} from "../../api/salons";

function SalonDetails() {
  const { salonId } = useParams();
  const navigate = useNavigate();

  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSalon();
  }, [salonId]);

  async function loadSalon() {
    try {
      setLoading(true);
      setError("");

      const [salonData, serviceData, categoryData] =
        await Promise.all([
          getSalon(salonId),
          getSalonServices(salonId),
          getSalonCategories(salonId),
        ]);

      setSalon(salonData);
      setServices(serviceData);
      setCategories(categoryData);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
          "Unable to load this salon."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleBook(service) {
    navigate(
      `/booking?salonId=${salon.id}&serviceId=${service.id}`
    );
  }

  if (loading) {
    return (
      <div className="customer-page">
        <div className="details-state">
          <div className="loader" />
          <p>Loading salon...</p>
        </div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="customer-page">
        <div className="details-state">
          <h2>Salon unavailable</h2>
          <p>{error || "Salon not found."}</p>

          <button onClick={() => navigate("/salons")}>
            Back to salons
          </button>
        </div>
      </div>
    );
  }

  const uncategorizedServices = services.filter(
    (service) => !service.category_id
  );

  return (
    <div className="customer-page">
      {/* Header */}
      <header className="customer-header">
        <div
          className="customer-logo"
          onClick={() => navigate("/salons")}
          style={{ cursor: "pointer" }}
        >
          <div className="logo-mark">L</div>

          <div>
            <h1>Lumora</h1>
            <span>Salon Booking</span>
          </div>
        </div>

        <nav className="customer-nav">
          <button
            className="nav-link active"
            onClick={() => navigate("/salons")}
          >
            Discover
          </button>

          <button
            className="nav-link"
            onClick={() => navigate("/my-bookings")}
          >
            My Bookings
          </button>

          <button
            className="logout-button"
            onClick={() => {
              localStorage.removeItem("lumora_token");
              navigate("/login");
            }}
          >
            Sign out
          </button>
        </nav>
      </header>

      {/* Back */}
      <div className="details-container">
        <button
          className="back-button"
          onClick={() => navigate("/salons")}
        >
          <ArrowLeft size={17} />
          Back to salons
        </button>
      </div>

      {/* Salon hero */}
      <section className="salon-detail-hero">
        <div className="salon-detail-image">
          <span>
            {salon.name?.charAt(0)?.toUpperCase()}
          </span>
        </div>

        <div className="salon-detail-info">
          <p className="eyebrow">LUMORA SALON</p>

          <h2>{salon.name}</h2>

          {salon.description && (
            <p className="detail-description">
              {salon.description}
            </p>
          )}

          <div className="detail-contact">
            <div>
              <MapPin size={18} />
              <span>{salon.address}</span>
            </div>

            {salon.phone && (
              <div>
                <Phone size={18} />
                <span>{salon.phone}</span>
              </div>
            )}

            {salon.email && (
              <div>
                <Mail size={18} />
                <span>{salon.email}</span>
              </div>
            )}
          </div>

          <div className="open-status">
            <span className="status-dot" />
            Currently accepting appointments
          </div>
        </div>
      </section>

      {/* Services */}
      <main className="service-content">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WHAT WE OFFER</p>
            <h3>Our services</h3>
          </div>

          <span className="salon-count">
            {services.length}{" "}
            {services.length === 1 ? "service" : "services"}
          </span>
        </div>

        {categories.map((category) => {
          const categoryServices = services.filter(
            (service) =>
              service.category_id === category.id
          );

          if (categoryServices.length === 0) {
            return null;
          }

          return (
            <section
              className="service-category"
              key={category.id}
            >
              <div className="category-heading">
                <div className="category-icon">
                  <Sparkles size={18} />
                </div>

                <div>
                  <h4>{category.name}</h4>

                  {category.description && (
                    <p>{category.description}</p>
                  )}
                </div>
              </div>

              <div className="service-list">
                {categoryServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onBook={() => handleBook(service)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {uncategorizedServices.length > 0 && (
          <section className="service-category">
            <div className="category-heading">
              <div className="category-icon">
                <Scissors size={18} />
              </div>

              <div>
                <h4>Services</h4>
                <p>Available salon services</p>
              </div>
            </div>

            <div className="service-list">
              {uncategorizedServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onBook={() => handleBook(service)}
                />
              ))}
            </div>
          </section>
        )}

        {services.length === 0 && (
          <div className="details-state">
            <h3>No services available</h3>
            <p>
              This salon hasn't added any active services yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function ServiceCard({ service, onBook }) {
  return (
    <article className="service-card">
      <div className="service-card-main">
        <div className="service-icon">
          <Scissors size={19} />
        </div>

        <div className="service-details">
          <h5>{service.name}</h5>

          {service.description && (
            <p>{service.description}</p>
          )}

          <div className="service-meta">
            <span>
              <Clock size={14} />
              {service.duration_minutes} min
            </span>
          </div>
        </div>
      </div>

      <div className="service-card-action">
        <strong>
          ₹{Number(service.price).toFixed(2)}
        </strong>

        <button onClick={onBook}>
          Book
          <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );
}

export default SalonDetails;