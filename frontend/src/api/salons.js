import api from "./client";

export async function getSalons() {
  const response = await api.get("/salons/");
  return response.data;
}

export async function getSalon(salonId) {
  const response = await api.get(`/salons/${salonId}`);
  return response.data;
}

export async function getSalonServices(salonId) {
  const response = await api.get("/services/", {
    params: {
      salon_id: salonId,
    },
  });

  return response.data;
}

export async function getSalonCategories(salonId) {
  const response = await api.get("/service-categories/", {
    params: {
      salon_id: salonId,
    },
  });

  return response.data;
}