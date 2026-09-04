import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resendOtp, verifyEmail } from "../../api/auth";

function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(event) {
    event.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      await verifyEmail({
        email,
        otp,
      });

      setMessage("Email verified successfully.");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Invalid or expired OTP."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");

    try {
      await resendOtp({ email });
      setMessage("A new OTP has been sent.");
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to resend OTP."
      );
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
          <h2>Verify your email</h2>

          <p>
            Enter the 6-digit code sent to{" "}
            <strong>{email}</strong>.
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <label htmlFor="otp">
            Verification code
          </label>

          <input
            id="otp"
            value={otp}
            onChange={(event) =>
              setOtp(
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6)
              )
            }
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            required
          />

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          {message && (
            <p className="form-success">
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify email"}
          </button>
        </form>

        <button
          type="button"
          className="secondary-button"
          onClick={handleResend}
        >
          Resend OTP
        </button>

        <p className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}

export default VerifyEmail;