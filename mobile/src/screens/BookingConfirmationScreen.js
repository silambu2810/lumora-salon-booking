import React from "react";

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BookingConfirmationScreen({
  route,
  navigation,
}) {
  const { bookingId } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Text style={styles.check}>
            ✓
          </Text>
        </View>

        <Text style={styles.eyebrow}>
          BOOKING CONFIRMED
        </Text>

        <Text style={styles.title}>
          Your appointment is booked.
        </Text>

        <Text style={styles.description}>
          Your Lumora appointment has been
          successfully created.
        </Text>

        <Text style={styles.bookingId}>
          Booking ID: #{bookingId}
        </Text>

        <TouchableOpacity
          style={styles.primary}
          onPress={() =>
            navigation.replace(
              "MyBookings"
            )
          }
        >
          <Text style={styles.primaryText}>
            View my bookings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondary}
          onPress={() =>
            navigation.replace("Salons")
          }
        >
          <Text style={styles.secondaryText}>
            Discover more salons
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f3ee",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1d8cf",
    borderRadius: 18,
    padding: 25,
  },

  icon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f0e9e1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  check: {
    color: "#7d9b76",
    fontSize: 25,
    fontWeight: "700",
  },

  eyebrow: {
    color: "#9b7650",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
  },

  title: {
    color: "#282522",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    marginTop: 8,
  },

  description: {
    color: "#766b61",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },

  bookingId: {
    color: "#282522",
    fontSize: 16,
    marginTop: 20,
    marginBottom: 20,
  },

  primary: {
    backgroundColor: "#282522",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },

  primaryText: {
    color: "#ffffff",
    fontWeight: "700",
  },

  secondary: {
    borderWidth: 1,
    borderColor: "#d9cfc6",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },

  secondaryText: {
    color: "#282522",
    fontWeight: "600",
  },
});