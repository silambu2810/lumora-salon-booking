import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getSalon,
  getSalonServices,
  getSalonStaff,
} from "../api/api";

export default function SalonDetailsScreen({
  route,
  navigation,
}) {
  const { salonId } = route.params;

  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadDetails();
  }, []);

  async function loadDetails() {
    try {
      setLoading(true);

      const [
        salonData,
        servicesData,
        staffData,
      ] = await Promise.all([
        getSalon(salonId),
        getSalonServices(salonId),
        getSalonStaff(salonId),
      ]);

      setSalon(salonData);
      setServices(servicesData);
      setStaff(staffData);
    } catch (error) {
      Alert.alert(
        "Unable to load salon",
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading || !salon) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.eyebrow}>
        SALON
      </Text>

      <Text style={styles.title}>
        {salon.name}
      </Text>

      <Text style={styles.description}>
        {salon.description ||
          "Beauty and wellness services."}
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.label}>
          ADDRESS
        </Text>

        <Text style={styles.value}>
          {salon.address}
        </Text>

        <Text style={styles.label}>
          PHONE
        </Text>

        <Text style={styles.value}>
          {salon.phone}
        </Text>

        {salon.email ? (
          <>
            <Text style={styles.label}>
              EMAIL
            </Text>

            <Text style={styles.value}>
              {salon.email}
            </Text>
          </>
        ) : null}
      </View>

      <Text style={styles.sectionLabel}>
        SERVICES
      </Text>

      <Text style={styles.sectionTitle}>
        Choose your service.
      </Text>

      {services.length === 0 ? (
        <Text style={styles.muted}>
          No services currently available.
        </Text>
      ) : (
        services.map((service) => (
          <View
            key={service.id}
            style={styles.serviceCard}
          >
            <View style={styles.serviceTop}>
              <Text style={styles.serviceName}>
                {service.name}
              </Text>

              <Text style={styles.price}>
                ₹{service.price}
              </Text>
            </View>

            <Text style={styles.duration}>
              {service.duration_minutes} minutes
            </Text>

            {service.description ? (
              <Text style={styles.serviceDescription}>
                {service.description}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                navigation.navigate(
                  "Booking",
                  {
                    salonId,
                    serviceId: service.id,
                    serviceName: service.name,
                    serviceDuration:
                      service.duration_minutes,
                  }
                )
              }
            >
              <Text style={styles.buttonText}>
                Book this service →
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <Text style={styles.sectionLabel}>
        STYLISTS
      </Text>

      <Text style={styles.sectionTitle}>
        Meet the team.
      </Text>

      {staff.map((person) => (
        <View
          key={person.id}
          style={styles.staffCard}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {person.name?.charAt(0)?.toUpperCase()}
            </Text>
          </View>

          <View>
            <Text style={styles.staffName}>
              {person.name}
            </Text>

            <Text style={styles.staffRole}>
              Stylist
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f3ee",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    backgroundColor: "#f7f3ee",
    justifyContent: "center",
    alignItems: "center",
  },

  eyebrow: {
    color: "#9b7650",
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: "700",
    marginTop: 10,
  },

  title: {
    color: "#282522",
    fontSize: 38,
    lineHeight: 43,
    fontWeight: "700",
    marginTop: 7,
  },

  description: {
    color: "#766b61",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },

  infoCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1d8cf",
    borderRadius: 16,
    padding: 18,
    marginTop: 22,
  },

  label: {
    color: "#a17a51",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginTop: 8,
  },

  value: {
    color: "#3b3632",
    fontSize: 15,
    marginTop: 5,
  },

  sectionLabel: {
    color: "#9b7650",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    marginTop: 32,
  },

  sectionTitle: {
    color: "#282522",
    fontSize: 27,
    fontWeight: "700",
    marginTop: 5,
    marginBottom: 15,
  },

  serviceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e1d8cf",
    padding: 18,
    marginBottom: 14,
  },

  serviceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  serviceName: {
    flex: 1,
    color: "#282522",
    fontSize: 20,
    fontWeight: "700",
  },

  price: {
    color: "#9b7650",
    fontSize: 17,
    fontWeight: "700",
  },

  duration: {
    color: "#766b61",
    marginTop: 7,
  },

  serviceDescription: {
    color: "#766b61",
    lineHeight: 21,
    marginTop: 8,
  },

  button: {
    backgroundColor: "#282522",
    borderRadius: 9,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },

  staffCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e1d8cf",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0e9e1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  avatarText: {
    color: "#9b7650",
    fontSize: 18,
    fontWeight: "700",
  },

  staffName: {
    color: "#282522",
    fontSize: 16,
    fontWeight: "700",
  },

  staffRole: {
    color: "#766b61",
    marginTop: 3,
  },

  muted: {
    color: "#766b61",
    marginTop: 5,
  },
});