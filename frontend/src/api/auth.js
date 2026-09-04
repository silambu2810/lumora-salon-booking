import api from "./client";

export async function registerUser(data) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function verifyEmail(data) {
  const response = await api.post("/auth/verify-email", data);
  return response.data;
}

export async function resendOtp(data) {
  const response = await api.post("/auth/resend-otp", data);
  return response.data;
}

export async function loginUser(data) {
  const response = await api.post("/auth/login", data);
  return response.data;
}