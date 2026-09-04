import api from "./client";

export async function getSalonStaff(salonId) {
  const response = await api.get(`/salons/${salonId}/staff`);
  return response.data;
}

export async function getAvailability({
  salonId,
  serviceId,
  staffId,
  bookingDate,
}) {
  const response = await api.post("/availability/", {
    salon_id: Number(salonId),
    service_id: Number(serviceId),
    staff_id: Number(staffId),
    booking_date: bookingDate,
  });

  return response.data;
}

export async function createBooking({
  salonId,
  serviceId,
  staffId,
  bookingDate,
  bookingTime,
  notes,
}) {
  const response = await api.post("/bookings/", {
    salon_id: Number(salonId),
    service_id: Number(serviceId),
    staff_id: Number(staffId),
    booking_date: bookingDate,
    booking_time: bookingTime,
    notes: notes || null,
  });

  return response.data;
}

export async function getMyBookings() {
  const response = await api.get("/bookings/my");
  return response.data;
}

export async function cancelBooking(bookingId) {
  const response = await api.put(
    `/bookings/${bookingId}/cancel`
  );

  return response.data;
}