// =========================================================
// LUMORA MOBILE API
// =========================================================

// Expo Web / Chrome on this computer
const API_URL = "http://127.0.0.1:8000";

// Android Emulator:
// const API_URL = "http://10.0.2.2:8000";

// Physical Android phone:
// const API_URL = "http://YOUR_PC_IP:8000";


// =========================================================
// GENERIC REQUEST HELPER
// =========================================================

async function request(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      let message = "Something went wrong";

      if (Array.isArray(data?.detail)) {
        message = data.detail
          .map((item) => item.msg || "Validation error")
          .join(", ");
      } else if (typeof data?.detail === "string") {
        message = data.detail;
      }

      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to Lumora API. Make sure the backend is running."
      );
    }

    throw error;
  }
}


// =========================================================
// AUTH
// =========================================================

export async function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}


// =========================================================
// SALONS
// =========================================================

export async function getSalons() {
  return request("/salons/");
}


export async function getSalon(salonId) {
  return request(`/salons/${salonId}`);
}


// =========================================================
// SERVICES
// =========================================================

export async function getSalonServices(salonId) {
  return request(`/salons/${salonId}/services`);
}


// =========================================================
// STAFF / STYLISTS
// =========================================================

export async function getSalonStaff(salonId) {
  return request(`/salons/${salonId}/staff`);
}


// =========================================================
// AVAILABILITY
// =========================================================

export async function getAvailableSlots(
  salonId,
  serviceId,
  staffId,
  date
) {
  return request("/availability/", {
    method: "POST",

    body: JSON.stringify({
      salon_id: Number(salonId),
      service_id: Number(serviceId),
      staff_id: Number(staffId),
      booking_date: date,
    }),
  });
}


// =========================================================
// BOOKINGS
// =========================================================

export async function createBooking(token, booking) {
  return request("/bookings/", {
    method: "POST",

    headers: {
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(booking),
  });
}


export async function getMyBookings(token) {
  return request("/bookings/my", {
    method: "GET",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}


export async function cancelBooking(token, bookingId) {
  return request(`/bookings/${bookingId}/cancel`, {
    method: "PUT",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}