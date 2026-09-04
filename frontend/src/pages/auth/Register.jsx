import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/auth";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await registerUser(form);

      navigate("/verify-email", {
        state: {
          email: form.email,
        },
      });
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">
          <span className="brand-mark">L</span>

          <div>
            <h1>Lumora</h1>
            <p>Salon Booking</p>
          </div>
        </div>

        <div className="auth-heading">
          <h2>Create your account</h2>
          <p>
            Join Lumora and book your salon appointments.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>

          <input
            id="name"
            value={form.name}
            onChange={(event) =>
              updateField("name", event.target.value)
            }
            placeholder="Your name"
            required
          />

          <label htmlFor="email">Email address</label>

          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) =>
              updateField("email", event.target.value)
            }
            placeholder="you@example.com"
            required
          />

          <label htmlFor="phone">Phone number</label>

          <input
            id="phone"
            value={form.phone}
            onChange={(event) =>
              updateField("phone", event.target.value)
            }
            placeholder="Your phone number"
            required
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) =>
              updateField("password", event.target.value)
            }
            placeholder="Minimum 8 characters"
            minLength={8}
            required
          />

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;