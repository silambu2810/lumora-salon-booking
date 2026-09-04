import { useEffect, useState } from "react";
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSalons } from "../../api/salons";

function Salons() {
  const navigate = useNavigate();

  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSalons();
  }, []);

  async function loadSalons() {
    try {
      setLoading(true);
      setError("");

      const data = await getSalons();

      setSalons(data);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
          "Unable to load salons. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSalonClick(salonId) {
    navigate(`/salons/${salonId}`);
  }

  function logout() {
    localStorage.removeItem("lumora_token");
    navigate("/login");
  }

  return (
    <div className="customer-page">
      {/* Header */}
      <header className="customer-header">
        <div className="customer-logo">
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
            onClick={logout}
          >
            Sign out
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className="salon-hero">
        <div>
          <p className="eyebrow">YOUR BEAUTY, YOUR WAY</p>

          <h2>
            Find your perfect
            <br />
            salon experience.
          </h2>

          <p className="hero-description">
            Discover trusted salons, explore their services,
            and book your next appointment with ease.
          </p>
        </div>
      </section>

      {/* Salon list */}
      <main className="salon-content">
        <div className="section-heading">
          <div>
            <p className="eyebrow">EXPLORE</p>
            <h3>Our salons</h3>
          </div>

          {!loading && (
            <span className="salon-count">
              {salons.length}{" "}
              {salons.length === 1 ? "salon" : "salons"}
            </span>
          )}
        </div>

        {loading && (
          <div className="state-card">
            <div className="loader" />
            <p>Finding beautiful places for you...</p>
          </div>
        )}

        {error && !loading && (
          <div className="state-card error-state">
            <p>{error}</p>

            <button onClick={loadSalons}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && salons.length === 0 && (
          <div className="state-card">
            <h3>No salons available</h3>
            <p>Please check again later.</p>
          </div>
        )}

        {!loading && !error && salons.length > 0 && (
          <div className="salon-grid">
            {salons.map((salon) => (
              <article
                className="salon-card"
                key={salon.id}
                onClick={() => handleSalonClick(salon.id)}
              >
                <div className="salon-image">
                  <div className="salon-image-overlay">
                    <span>View salon</span>
                    <ArrowRight size={18} />
                  </div>

                  <div className="salon-initial">
                    {salon.name?.charAt(0)?.toUpperCase()}
                  </div>
                </div>

                <div className="salon-card-body">
                  <div className="salon-title-row">
                    <h4>{salon.name}</h4>

                    {salon.is_active && (
                      <span className="active-badge">
                        Open
                      </span>
                    )}
                  </div>

                  {salon.description && (
                    <p className="salon-description">
                      {salon.description}
                    </p>
                  )}

                  <div className="salon-info">
                    <div>
                      <MapPin size={16} />
                      <span>{salon.address}</span>
                    </div>

                    {salon.phone && (
                      <div>
                        <Phone size={16} />
                        <span>{salon.phone}</span>
                      </div>
                    )}

                    {salon.email && (
                      <div>
                        <Mail size={16} />
                        <span>{salon.email}</span>
                      </div>
                    )}
                  </div>

                  <button
                    className="view-salon-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSalonClick(salon.id);
                    }}
                  >
                    Explore salon
                    <ArrowRight size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Salons;