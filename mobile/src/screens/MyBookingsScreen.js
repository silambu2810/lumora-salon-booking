import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  cancelBooking,
  getMyBookings,
} from "../api/api";

import { useAuth } from "../context/AuthContext";


// =========================================================
// DATE / TIME HELPERS
// =========================================================

function formatDate(value) {
  const date = new Date(
    `${value}T00:00:00`
  );

  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}


function formatTime(value) {
  const [hours, minutes] =
    value.split(":");

  const date = new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}


// =========================================================
// MY BOOKINGS SCREEN
// =========================================================

export default function MyBookingsScreen({
  navigation,
}) {
  const { token } = useAuth();

  const [bookings, setBookings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);


  // =======================================================
  // LOAD BOOKINGS
  // =======================================================

  const loadBookings = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data =
          await getMyBookings(token);

        setBookings(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        Alert.alert(
          "Unable to load bookings",
          error.message
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );


  // =======================================================
  // RELOAD WHEN SCREEN GETS FOCUS
  // =======================================================

  React.useEffect(() => {
    const unsubscribe =
      navigation.addListener(
        "focus",
        () => {
          loadBookings();
        }
      );

    return unsubscribe;
  }, [
    navigation,
    loadBookings,
  ]);


  // =======================================================
  // CANCEL BOOKING
  // =======================================================

  async function handleCancel(booking) {
    Alert.alert(
      "Cancel appointment",
      `Cancel booking #${booking.id}?`,
      [
        {
          text: "Keep booking",
          style: "cancel",
        },
        {
          text: "Cancel appointment",
          style: "destructive",

          onPress: async () => {
            try {
              await cancelBooking(
                token,
                booking.id
              );

              await loadBookings();
            } catch (error) {
              Alert.alert(
                "Unable to cancel",
                error.message
              );
            }
          },
        },
      ]
    );
  }


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }


  // =======================================================
  // UI
  // =======================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }

      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() =>
            loadBookings(true)
          }
        />
      }
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <Text style={styles.eyebrow}>
        YOUR BOOKINGS
      </Text>

      <Text style={styles.title}>
        My appointments
      </Text>


      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {bookings.length === 0 ? (

        <View style={styles.empty}>

          <Text style={styles.emptyTitle}>
            No appointments yet.
          </Text>

          <Text style={styles.muted}>
            Find a salon and book your
            first Lumora appointment.
          </Text>

          <TouchableOpacity
            style={styles.primary}
            onPress={() =>
              navigation.navigate(
                "Salons"
              )
            }
          >
            <Text style={styles.primaryText}>
              Discover salons
            </Text>
          </TouchableOpacity>

        </View>

      ) : (

        /* =================================================
           BOOKING LIST
        ================================================= */

        bookings.map((booking) => {

          const cancelled =
            booking.status ===
            "cancelled";

          return (

            <View
              key={booking.id}
              style={styles.card}
            >

              {/* =========================================
                  BOOKING HEADER
              ========================================= */}

              <View style={styles.cardTop}>

                <View>

                  <Text style={styles.label}>
                    APPOINTMENT
                  </Text>

                  <Text
                    style={
                      styles.bookingTitle
                    }
                  >
                    Booking #{booking.id}
                  </Text>

                </View>


                {/* STATUS */}

                <View
                  style={[
                    styles.status,

                    cancelled &&
                      styles.cancelledStatus,
                  ]}
                >

                  <Text
                    style={[
                      styles.statusText,

                      cancelled &&
                        styles.cancelledText,
                    ]}
                  >
                    {booking.status}
                  </Text>

                </View>

              </View>


              {/* =========================================
                  DIVIDER
              ========================================= */}

              <View
                style={styles.divider}
              />


              {/* =========================================
                  CUSTOMER
              ========================================= */}

              <Text style={styles.label}>
                CUSTOMER
              </Text>

              <Text style={styles.value}>
                {booking.customer_name ||
                  "Customer"}
              </Text>


              {/* =========================================
                  DATE & TIME
              ========================================= */}

              <Text style={styles.label}>
                DATE & TIME
              </Text>

              <Text style={styles.value}>
                {formatDate(
                  booking.booking_date
                )}
              </Text>

              <Text
                style={styles.subValue}
              >
                {formatTime(
                  booking.booking_time
                )}
              </Text>


              {/* =========================================
                  SALON
              ========================================= */}

              <Text style={styles.label}>
                SALON
              </Text>

              <Text style={styles.value}>
                {booking.salon_name ||
                  "Salon"}
              </Text>


              {/* =========================================
                  SERVICE
              ========================================= */}

              <Text style={styles.label}>
                SERVICE
              </Text>

              <Text style={styles.value}>
                {booking.service_name ||
                  "Service"}
              </Text>


              {/* =========================================
                  STYLIST
              ========================================= */}

              <Text style={styles.label}>
                STYLIST
              </Text>

              <Text style={styles.value}>
                {booking.staff_name ||
                  "Stylist"}
              </Text>


              {/* =========================================
                  NOTES
              ========================================= */}

              {booking.notes ? (

                <>
                  <Text style={styles.label}>
                    NOTES
                  </Text>

                  <Text
                    style={styles.notesText}
                  >
                    {booking.notes}
                  </Text>
                </>

              ) : null}


              {/* =========================================
                  CANCEL BUTTON
              ========================================= */}

              {!cancelled &&
              booking.status !==
                "completed" ? (

                <TouchableOpacity
                  style={
                    styles.cancelButton
                  }
                  onPress={() =>
                    handleCancel(
                      booking
                    )
                  }
                >

                  <Text
                    style={
                      styles.cancelText
                    }
                  >
                    Cancel appointment
                  </Text>

                </TouchableOpacity>

              ) : null}

            </View>

          );
        })
      )}

    </ScrollView>
  );
}


// =========================================================
// STYLES
// =========================================================

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
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    marginTop: 10,
  },

  title: {
    color: "#282522",
    fontSize: 34,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1d8cf",
    borderRadius: 17,
    padding: 20,
    marginBottom: 16,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  label: {
    color: "#9b7650",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginTop: 12,
  },

  bookingTitle: {
    color: "#282522",
    fontSize: 27,
    fontWeight: "700",
    marginTop: 4,
  },

  status: {
    backgroundColor: "#f7ecd6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  statusText: {
    color: "#9b6a14",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  cancelledStatus: {
    backgroundColor: "#f3dddd",
  },

  cancelledText: {
    color: "#9b4545",
  },

  divider: {
    height: 1,
    backgroundColor: "#ece4dc",
    marginTop: 18,
  },

  value: {
    color: "#282522",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 5,
  },

  subValue: {
    color: "#766b61",
    fontSize: 14,
    marginTop: 3,
  },

  notesText: {
    color: "#766b61",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: "#d8b7ad",
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 22,
  },

  cancelText: {
    color: "#a4483e",
    fontWeight: "700",
  },

  empty: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1d8cf",
    borderRadius: 16,
    padding: 20,
  },

  emptyTitle: {
    color: "#282522",
    fontSize: 20,
    fontWeight: "700",
  },

  muted: {
    color: "#766b61",
    lineHeight: 21,
    marginTop: 7,
  },

  primary: {
    backgroundColor: "#282522",
    borderRadius: 9,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },

  primaryText: {
    color: "#ffffff",
    fontWeight: "700",
  },

});