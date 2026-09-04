import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          email: email.trim(),
          password,
        }
      );

      console.log("LOGIN RESPONSE:", response.data);

      /*
       * =====================================================
       * GET JWT
       * =====================================================
       */

      const token = response.data?.access_token;

      if (!token) {
        console.error(
          "Login succeeded but access_token was not returned:",
          response.data
        );

        setError(
          "Login succeeded, but no access token was returned by the server."
        );

        return;
      }

      /*
       * =====================================================
       * SAVE JWT
       * =====================================================
       */

      localStorage.setItem("lumora_token", token);

      /*
       * =====================================================
       * SAVE AUTH STATE
       * =====================================================
       */

      localStorage.setItem("isAuthenticated", "true");

      /*
       * =====================================================
       * SAVE USER IF API RETURNS USER
       * =====================================================
       */

      if (response.data?.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        localStorage.setItem(
          "User",
          JSON.stringify(response.data.user)
        );
      }

      /*
       * =====================================================
       * SAVE ROLE
       * =====================================================
       */

      if (response.data?.user?.role) {
        localStorage.setItem(
          "role",
          response.data.user.role
        );
      } else if (response.data?.role) {
        localStorage.setItem(
          "role",
          response.data.role
        );
      }

      /*
       * =====================================================
       * VERIFY TOKEN WAS ACTUALLY STORED
       * =====================================================
       */

      const savedToken =
        localStorage.getItem("lumora_token");

      console.log(
        "JWT stored successfully:",
        Boolean(savedToken)
      );

      /*
       * =====================================================
       * ROLE BASED REDIRECT
       * =====================================================
       */

      const role =
        response.data?.user?.role ||
        response.data?.role ||
        localStorage.getItem("role") ||
        "customer";

      /*
       * If the user originally tried to access another
       * page, return there after login.
       */

      const returnPath = location.state?.from;

      if (returnPath) {
        navigate(returnPath, { replace: true });
        return;
      }

      /*
       * Customer
       */

      if (role === "customer") {
        navigate("/salons", { replace: true });
        return;
      }

      /*
       * Salon owner
       */

      if (role === "salon_owner") {
        navigate("/owner", { replace: true });
        return;
      }

      /*
       * Staff
       */

      if (role === "staff") {
        navigate("/staff", { replace: true });
        return;
      }

      /*
       * Admin
       */

      if (role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      /*
       * Fallback
       */

      navigate("/salons", { replace: true });
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item.msg)
            .filter(Boolean)
            .join(", ")
        );
      } else {
        setError(
          detail ||
            "Unable to sign in. Please check your email and password."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="brand">
          <div className="brand-mark">L</div>

          <div>
            <h1>Lumora</h1>
            <p>Salon Booking</p>
          </div>
        </div>

        <div className="auth-heading">
          <p className="eyebrow">
            WELCOME BACK
          </p>

          <h2>Sign in to Lumora</h2>

          <p>
            Sign in to book your next salon experience.
          </p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <div className="form-group">
            <label htmlFor="email">
              Email address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              placeholder="Enter your password"
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">
            Create an account
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;