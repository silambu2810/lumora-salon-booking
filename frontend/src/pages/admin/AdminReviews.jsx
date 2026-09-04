import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("lumora_token");
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.detail ||
    error?.message ||
    fallback
  );
}

function AdminReviews() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // LOAD ADMIN REVIEWS
  // =========================================================

  useEffect(() => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    loadReviews();
  }, [navigate]);

  async function loadReviews() {
    setLoading(true);
    setError("");
    setSuccess("");

    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/admin/reviews/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const reviewList = Array.isArray(response.data)
        ? response.data
        : [];

      reviewList.sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      );

      setReviews(reviewList);
    } catch (err) {
      console.error(err);

      setError(
        getErrorMessage(
          err,
          "Unable to load reviews."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // DELETE REVIEW
  // =========================================================

  async function handleDelete(review) {
    const confirmed = window.confirm(
      `Delete review #${review.id}?\n\n` +
        `Customer: ${
          review.customer_name ||
          `Customer #${review.user_id}`
        }\n` +
        `Rating: ${review.rating}/5\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    setDeletingId(review.id);
    setError("");
    setSuccess("");

    try {
      await axios.delete(
        `${API_URL}/admin/reviews/${review.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReviews((currentReviews) =>
        currentReviews.filter(
          (item) => item.id !== review.id
        )
      );

      setSuccess(
        `Review #${review.id} deleted successfully.`
      );
    } catch (err) {
      console.error(err);

      setError(
        getErrorMessage(
          err,
          "Unable to delete review."
        )
      );
    } finally {
      setDeletingId(null);
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  function handleLogout() {
    localStorage.removeItem("lumora_token");
    localStorage.removeItem("lumora_user");

    navigate("/login");
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  function formatDate(dateValue) {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  // =========================================================
  // FORMAT TIME
  // =========================================================

  function formatTime(dateValue) {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  // =========================================================
  // STARS
  // =========================================================

  function renderStars(rating) {
    const safeRating = Math.max(
      0,
      Math.min(5, Number(rating) || 0)
    );

    return (
      <div
        className="review-stars"
        aria-label={`${safeRating} out of 5 stars`}
      >
        {"★".repeat(safeRating)}
        {"☆".repeat(5 - safeRating)}
      </div>
    );
  }

  // =========================================================
  // SUMMARY
  // =========================================================

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (total, review) =>
              total + Number(review.rating || 0),
            0
          ) / reviews.length
        ).toFixed(1)
      : "0.0";

  const fiveStarReviews = reviews.filter(
    (review) => Number(review.rating) === 5
  ).length;

  const lowRatedReviews = reviews.filter(
    (review) => Number(review.rating) <= 2
  ).length;

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="admin-management-page">
        <main className="management-main">
          <div className="dashboard-loading">
            Loading reviews...
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="admin-management-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="dashboard-header">

        <div className="brand-block">

          <div className="brand-mark">
            ✦
          </div>

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
            onClick={() =>
              navigate("/admin")
            }
          >
            Admin Dashboard
          </button>

          <button
            type="button"
            className="text-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="management-main">

        <Link
          to="/admin"
          className="back-link"
        >
          ← Back to admin dashboard
        </Link>


        {/* ===================================================
            HERO
            =================================================== */}

        <section className="management-hero">

          <div className="eyebrow">
            Reviews & Ratings
          </div>

          <h1>
            Customer
            <br />
            feedback.
          </h1>

          <p>
            Review customer ratings and feedback
            across all Lumora salons.
          </p>

        </section>


        {/* ===================================================
            ERROR
            =================================================== */}

        {error && (
          <div className="error-message">

            <span className="message-icon">
              !
            </span>

            {error}

          </div>
        )}


        {/* ===================================================
            SUCCESS
            =================================================== */}

        {success && (
          <div className="success-message">

            <span className="message-icon">
              ✓
            </span>

            {success}

          </div>
        )}


        {/* ===================================================
            SUMMARY
            =================================================== */}

        <section className="review-summary-grid">

          <div className="review-summary-card">

            <span className="summary-label">
              Total reviews
            </span>

            <strong>
              {reviews.length}
            </strong>

            <span>
              Customer reviews
            </span>

          </div>


          <div className="review-summary-card">

            <span className="summary-label">
              Average rating
            </span>

            <strong>
              {averageRating}
            </strong>

            <span>
              Out of 5
            </span>

          </div>


          <div className="review-summary-card">

            <span className="summary-label">
              Five star
            </span>

            <strong>
              {fiveStarReviews}
            </strong>

            <span>
              Excellent ratings
            </span>

          </div>


          <div className="review-summary-card">

            <span className="summary-label">
              Low ratings
            </span>

            <strong>
              {lowRatedReviews}
            </strong>

            <span>
              2 stars or below
            </span>

          </div>

        </section>


        {/* ===================================================
            REVIEWS
            =================================================== */}

        <section className="management-section">

          <div className="section-heading-row">

            <div>

              <div className="eyebrow">
                Customer Feedback
              </div>

              <h2>
                All reviews
              </h2>

            </div>

            <div className="count-pill">
              {reviews.length} reviews
            </div>

          </div>


          {/* =================================================
              EMPTY
              ================================================= */}

          {reviews.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                ☆
              </div>

              <p>
                No customer reviews have been
                submitted yet.
              </p>

            </div>

          ) : (

            <div className="review-management-grid">

              {reviews.map((review) => {

                const customerName =
                  review.customer_name ||
                  `Customer #${review.user_id}`;

                const customerEmail =
                  review.customer_email || "";

                const salonName =
                  review.salon_name ||
                  `Salon #${review.salon_id}`;

                const staffName =
                  review.staff_name ||
                  `Staff #${review.staff_id}`;

                const deleting =
                  deletingId === review.id;

                return (
                  <article
                    className="review-management-card"
                    key={review.id}
                  >

                    {/* =====================================
                        CARD HEADER
                        ===================================== */}

                    <div className="review-card-top">

                      <div className="review-avatar">
                        {customerName
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <div className="card-eyebrow">
                          REVIEW #{review.id}
                        </div>

                        <div className="review-customer">
                          {customerName}
                        </div>

                        {customerEmail && (
                          <div className="review-email">
                            {customerEmail}
                          </div>
                        )}

                      </div>

                    </div>


                    {/* =====================================
                        RATING
                        ===================================== */}

                    <div className="review-rating-row">

                      {renderStars(
                        review.rating
                      )}

                      <strong>
                        {review.rating}/5
                      </strong>

                    </div>


                    {/* =====================================
                        INFO
                        ===================================== */}

                    <div className="review-info-grid">

                      <div>

                        <span>
                          Salon
                        </span>

                        <strong>
                          {salonName}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Booking
                        </span>

                        <strong>
                          #{review.booking_id}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Staff
                        </span>

                        <strong>
                          {staffName}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Date
                        </span>

                        <strong>
                          {formatDate(
                            review.created_at
                          )}
                        </strong>

                        {formatTime(
                          review.created_at
                        ) && (
                          <small>
                            {formatTime(
                              review.created_at
                            )}
                          </small>
                        )}

                      </div>

                    </div>


                    {/* =====================================
                        COMMENT
                        ===================================== */}

                    <div className="review-comment">

                      <span>
                        Customer comment
                      </span>

                      <p>
                        {review.comment ||
                          "No comment provided."}
                      </p>

                    </div>


                    {/* =====================================
                        ADMIN ACTIONS
                        ===================================== */}

                    <div className="review-admin-actions">

                      <button
                        type="button"
                        className="danger-button"
                        disabled={deleting}
                        onClick={() =>
                          handleDelete(review)
                        }
                      >
                        {deleting
                          ? "Deleting..."
                          : "Delete review"}
                      </button>

                    </div>

                  </article>
                );
              })}

            </div>

          )}

        </section>


        {/* ===================================================
            SECURITY NOTICE
            =================================================== */}

        <div className="security-notice">

          <span className="security-icon">
            ✓
          </span>

          <div>

            <strong>
              Admin review management
            </strong>

            <div>
              Administrators can view customer
              reviews across all salons and remove
              inappropriate or unwanted reviews.
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default AdminReviews;