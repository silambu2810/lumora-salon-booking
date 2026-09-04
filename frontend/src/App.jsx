import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

// =========================================================
// AUTH
// =========================================================

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";

// =========================================================
// CUSTOMER
// =========================================================

import Salons from "./pages/customer/Salons";
import SalonDetails from "./pages/customer/SalonDetails";
import Booking from "./pages/customer/Booking";
import BookingConfirmation from "./pages/customer/BookingConfirmation";
import MyBookings from "./pages/customer/MyBookings";

// =========================================================
// SALON OWNER
// =========================================================

import OwnerDashboard from "./pages/owner/OwnerDashboard";

// =========================================================
// STAFF
// =========================================================

import StaffDashboard from "./pages/staff/StaffDashboard";

// =========================================================
// ADMIN
// =========================================================

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSalons from "./pages/admin/AdminSalons";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminServices from "./pages/admin/AdminServices";
import AdminReviews from "./pages/admin/AdminReviews";

// =========================================================
// MARKETING
// =========================================================

import MarketingHome from "./pages/MarketingHome";

// =========================================================
// APP
// =========================================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =================================================
            PUBLIC MARKETING WEBSITE
            ================================================= */}

        <Route
          path="/"
          element={<MarketingHome />}
        />


        {/* =================================================
            AUTHENTICATION
            ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />


        {/* =================================================
            CUSTOMER
            ================================================= */}

        {/* Salon discovery */}

        <Route
          path="/salons"
          element={<Salons />}
        />


        {/* Salon details */}

        <Route
          path="/salons/:salonId"
          element={<SalonDetails />}
        />


        {/* Booking flow */}

        <Route
          path="/booking"
          element={<Booking />}
        />


        {/* Booking confirmation */}

        <Route
          path="/booking-confirmed/:bookingId"
          element={<BookingConfirmation />}
        />


        {/* Customer booking history */}

        <Route
          path="/my-bookings"
          element={<MyBookings />}
        />


        {/* =================================================
            SALON OWNER
            ================================================= */}

        <Route
          path="/owner"
          element={<OwnerDashboard />}
        />


        {/* =================================================
            STAFF
            ================================================= */}

        <Route
          path="/staff"
          element={<StaffDashboard />}
        />


        {/* =================================================
            ADMIN
            ================================================= */}

        {/* Main admin dashboard */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />


        {/* Salon management */}

        <Route
          path="/admin/salons"
          element={<AdminSalons />}
        />


        {/* Customer management */}

        <Route
          path="/admin/customers"
          element={<AdminCustomers />}
        />


        {/* Staff management */}

        <Route
          path="/admin/staff"
          element={<AdminStaff />}
        />


        {/* Booking management */}

        <Route
          path="/admin/bookings"
          element={<AdminBookings />}
        />


        {/* Service management */}

        <Route
          path="/admin/services"
          element={<AdminServices />}
        />


        {/* Review management */}

        <Route
          path="/admin/reviews"
          element={<AdminReviews />}
        />


        {/* =================================================
            UNKNOWN ROUTES
            ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;