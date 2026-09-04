import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./MarketingHome.css";

export default function MarketingHome() {
  useEffect(() => {
    document.title =
      "Lumora | Beauty, booked simply.";

    const description =
      "Discover salons, choose your service and stylist, and book your beauty appointment with Lumora.";

    let meta = document.querySelector(
      'meta[name="description"]'
    );

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.setAttribute(
      "content",
      description
    );
  }, []);

  return (
    <div className="marketing-page">

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <header className="marketing-nav">
        <div className="marketing-nav-inner">

          <Link
            to="/"
            className="marketing-logo"
          >
            LUMORA
          </Link>

          <nav className="marketing-nav-links">
            <a href="#salons">
              Salons
            </a>

            <a href="#how-it-works">
              How it works
            </a>

            <a href="#about">
              About
            </a>

            <Link
              to="/login"
              className="marketing-nav-button"
            >
              Sign in
            </Link>
          </nav>

        </div>
      </header>


      {/* =================================================
          HERO
      ================================================= */}

      <main>

        <section className="marketing-hero">

          <div className="marketing-hero-content">

            <div className="marketing-eyebrow">
              LUMORA · SALON BOOKING
            </div>

            <h1>
              Beauty,
              <br />
              booked simply.
            </h1>

            <p className="marketing-hero-text">
              Discover trusted salons, choose
              your service and stylist, and book
              your perfect appointment in just a
              few simple steps.
            </p>

            <div className="marketing-hero-actions">

              <Link
                to="/salons"
                className="marketing-primary-button"
              >
                Book an appointment
                <span>→</span>
              </Link>

              <Link
                to="/salons"
                className="marketing-secondary-button"
              >
                Explore salons
              </Link>

            </div>

            <div className="marketing-hero-note">
              Simple booking · Real availability ·
              Easy management
            </div>

          </div>


          <div className="marketing-hero-card">

            <div className="hero-card-top">
              <span>
                YOUR NEXT APPOINTMENT
              </span>

              <span className="hero-card-dot">
                ●
              </span>
            </div>

            <div className="hero-card-date">
              10
            </div>

            <div className="hero-card-month">
              SEPTEMBER 2026
            </div>

            <div className="hero-card-divider" />

            <div className="hero-card-info">

              <div>
                <small>
                  SALON
                </small>

                <strong>
                  Lumora Beauty Salon
                </strong>
              </div>

              <div>
                <small>
                  SERVICE
                </small>

                <strong>
                  Haircut & Styling
                </strong>
              </div>

              <div>
                <small>
                  STYLIST
                </small>

                <strong>
                  Priya Stylist
                </strong>
              </div>

            </div>

            <div className="hero-card-time">
              <span>
                10:00 AM
              </span>

              <span>
                60 min
              </span>
            </div>

          </div>

        </section>


        {/* =================================================
            INTRO
        ================================================= */}

        <section
          className="marketing-intro"
          id="about"
        >

          <div className="marketing-section-label">
            A BETTER WAY TO BOOK
          </div>

          <h2>
            Your beauty routine,
            <br />
            without the back and forth.
          </h2>

          <p>
            Lumora brings salons, services,
            stylists and appointments together
            in one simple booking experience.
            Find what you need and reserve your
            time without unnecessary calls or
            messages.
          </p>

        </section>


        {/* =================================================
            SALONS
        ================================================= */}

        <section
          className="marketing-salons"
          id="salons"
        >

          <div className="marketing-section-heading">

            <div>
              <div className="marketing-section-label">
                OUR SALONS
              </div>

              <h2>
                Find your place.
              </h2>
            </div>

            <Link
              to="/salons"
              className="marketing-text-link"
            >
              View all salons →
            </Link>

          </div>


          <div className="marketing-salon-grid">

            <article className="marketing-salon-card">

              <div className="salon-card-image salon-image-one">
                <span>
                  LUMORA
                </span>
              </div>

              <div className="salon-card-content">

                <div className="salon-card-label">
                  CHENNAI
                </div>

                <h3>
                  Lumora Beauty Salon
                </h3>

                <p>
                  Premium beauty and hair
                  services designed around
                  your time.
                </p>

                <Link
                  to="/salons"
                  className="salon-card-link"
                >
                  Explore salon →
                </Link>

              </div>

            </article>


            <article className="marketing-salon-card">

              <div className="salon-card-image salon-image-two">
                <span>
                  LUMORA
                </span>
              </div>

              <div className="salon-card-content">

                <div className="salon-card-label">
                  CHENNAI
                </div>

                <h3>
                  Lumora Beauty Studio
                </h3>

                <p>
                  A modern beauty experience
                  with services and stylists
                  you can book with ease.
                </p>

                <Link
                  to="/salons"
                  className="salon-card-link"
                >
                  Explore salon →
                </Link>

              </div>

            </article>

          </div>

        </section>


        {/* =================================================
            HOW IT WORKS
        ================================================= */}

        <section
          className="marketing-how"
          id="how-it-works"
        >

          <div className="marketing-section-label">
            HOW IT WORKS
          </div>

          <h2>
            Four simple steps.
          </h2>

          <div className="marketing-steps">

            <div className="marketing-step">

              <span className="step-number">
                01
              </span>

              <h3>
                Choose a salon
              </h3>

              <p>
                Browse Lumora salons and
                find the location that works
                for you.
              </p>

            </div>


            <div className="marketing-step">

              <span className="step-number">
                02
              </span>

              <h3>
                Pick your service
              </h3>

              <p>
                Choose from available beauty
                and hair services with clear
                pricing and duration.
              </p>

            </div>


            <div className="marketing-step">

              <span className="step-number">
                03
              </span>

              <h3>
                Select your stylist
              </h3>

              <p>
                Pick a stylist and see the
                available appointment times.
              </p>

            </div>


            <div className="marketing-step">

              <span className="step-number">
                04
              </span>

              <h3>
                Book your time
              </h3>

              <p>
                Confirm your appointment and
                manage it later from your
                bookings.
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            FEATURES
        ================================================= */}

        <section className="marketing-features">

          <div className="marketing-feature-copy">

            <div className="marketing-section-label">
              MADE FOR REAL APPOINTMENTS
            </div>

            <h2>
              Everything you need
              <br />
              before the appointment.
            </h2>

          </div>


          <div className="marketing-feature-list">

            <div className="marketing-feature">
              <span>01</span>

              <div>
                <h3>
                  Real availability
                </h3>

                <p>
                  See appointment slots based
                  on salon hours, stylist
                  availability and existing
                  bookings.
                </p>
              </div>
            </div>


            <div className="marketing-feature">
              <span>02</span>

              <div>
                <h3>
                  Easy booking management
                </h3>

                <p>
                  Keep track of upcoming and
                  previous appointments from
                  one place.
                </p>
              </div>
            </div>


            <div className="marketing-feature">
              <span>03</span>

              <div>
                <h3>
                  One connected platform
                </h3>

                <p>
                  Customers, stylists, salon
                  owners and administrators work
                  from the same booking system.
                </p>
              </div>
            </div>

          </div>

        </section>


        {/* =================================================
            FINAL CTA
        ================================================= */}

        <section className="marketing-cta">

          <div className="marketing-section-label">
            READY WHEN YOU ARE
          </div>

          <h2>
            Your next appointment
            <br />
            starts here.
          </h2>

          <p>
            Discover a salon, choose your
            service and book your time with
            Lumora.
          </p>

          <Link
            to="/salons"
            className="marketing-cta-button"
          >
            Start booking
            <span>→</span>
          </Link>

        </section>

      </main>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="marketing-footer">

        <div className="marketing-footer-inner">

          <div>

            <div className="marketing-footer-logo">
              LUMORA
            </div>

            <p>
              Beauty, booked simply.
            </p>

          </div>


          <div className="marketing-footer-links">

            <Link to="/salons">
              Salons
            </Link>

            <Link to="/login">
              Sign in
            </Link>

            <a href="#how-it-works">
              How it works
            </a>

          </div>

        </div>


        <div className="marketing-footer-bottom">
          © 2026 Lumora. Salon & Beauty
          Booking Platform.
        </div>

      </footer>

    </div>
  );
}