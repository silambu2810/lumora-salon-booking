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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  createBooking,
  getAvailableSlots,
  getSalonStaff,
} from "../api/api";

import { useAuth } from "../context/AuthContext";


// =========================================================
// DATE HELPERS
// =========================================================

function formatDate(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function displayDate(dateString) {
  const date = new Date(
    `${dateString}T00:00:00`
  );

  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
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
// BOOKING SCREEN
// =========================================================

export default function BookingScreen({
  route,
  navigation,
}) {
  const {
    salonId,
    serviceId,
    serviceName,
    serviceDuration,
  } = route.params;

  const { token } = useAuth();


  // =======================================================
  // STATE
  // =======================================================

  const [staff, setStaff] = useState([]);

  const [selectedStaff, setSelectedStaff] =
    useState(null);

  const [date, setDate] = useState(
    formatDate(new Date())
  );

  const [slots, setSlots] = useState([]);

  const [selectedTime, setSelectedTime] =
    useState(null);

  const [notes, setNotes] = useState("");

  const [loadingStaff, setLoadingStaff] =
    useState(true);

  const [loadingSlots, setLoadingSlots] =
    useState(false);

  const [booking, setBooking] =
    useState(false);


  // =======================================================
  // LOAD STAFF
  // =======================================================

  useEffect(() => {
    loadStaff();
  }, []);


  // =======================================================
  // LOAD AVAILABILITY WHEN STAFF/DATE CHANGES
  // =======================================================

  useEffect(() => {
    if (selectedStaff) {
      loadSlots();
    }
  }, [selectedStaff, date]);


  // =======================================================
  // LOAD STAFF
  // =======================================================

  async function loadStaff() {
    try {
      setLoadingStaff(true);

      const data =
        await getSalonStaff(salonId);

      // Safety check
      const staffList =
        Array.isArray(data)
          ? data
          : [];

      setStaff(staffList);

      // Automatically select first stylist
      if (staffList.length > 0) {
        setSelectedStaff(staffList[0]);
      }
    } catch (error) {
      Alert.alert(
        "Unable to load stylists",
        error.message
      );
    } finally {
      setLoadingStaff(false);
    }
  }


  // =======================================================
  // LOAD AVAILABLE SLOTS
  // =======================================================

  async function loadSlots() {
    try {
      setLoadingSlots(true);

      setSelectedTime(null);

      const data =
        await getAvailableSlots(
          salonId,
          serviceId,
          selectedStaff.id,
          date
        );

      /*
       * Backend returns:
       *
       * {
       *   salon_id: 2,
       *   service_id: 5,
       *   staff_id: 9,
       *   booking_date: "2026-09-13",
       *   available_slots: [
       *     "10:00:00",
       *     "10:30:00"
       *   ]
       * }
       *
       * We only need the available_slots array.
       */

      const availableSlots =
        Array.isArray(data?.available_slots)
          ? data.available_slots
          : [];

      setSlots(availableSlots);
    } catch (error) {
      Alert.alert(
        "Unable to load availability",
        error.message
      );

      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }


  // =======================================================
  // CHANGE DATE
  // =======================================================

  function changeDate(days) {
    const current =
      new Date(`${date}T00:00:00`);

    current.setDate(
      current.getDate() + days
    );

    setDate(formatDate(current));
  }


  // =======================================================
  // CREATE BOOKING
  // =======================================================

  async function handleBooking() {
    if (!selectedStaff) {
      Alert.alert(
        "Select a stylist",
        "Please select a stylist."
      );

      return;
    }

    if (!selectedTime) {
      Alert.alert(
        "Select a time",
        "Please select an available time."
      );

      return;
    }

    try {
      setBooking(true);

      const created =
        await createBooking(
          token,
          {
            salon_id: Number(salonId),

            service_id: Number(serviceId),

            staff_id: Number(
              selectedStaff.id
            ),

            booking_date: date,

            booking_time: selectedTime,

            notes:
              notes.trim() || null,
          }
        );

      navigation.replace(
        "BookingConfirmation",
        {
          bookingId: created.id,
        }
      );
    } catch (error) {
      Alert.alert(
        "Booking failed",
        error.message
      );

      // Refresh availability in case
      // another customer booked the slot.
      if (selectedStaff) {
        loadSlots();
      }
    } finally {
      setBooking(false);
    }
  }


  // =======================================================
  // UI
  // =======================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >

      {/* =================================================
          SERVICE
      ================================================= */}

      <Text style={styles.eyebrow}>
        BOOK APPOINTMENT
      </Text>

      <Text style={styles.title}>
        {serviceName}
      </Text>

      <Text style={styles.duration}>
        {serviceDuration} minutes
      </Text>


      {/* =================================================
          STYLIST
      ================================================= */}

      <Text style={styles.sectionLabel}>
        01 · STYLIST
      </Text>

      <Text style={styles.sectionTitle}>
        Choose your stylist.
      </Text>


      {loadingStaff ? (
        <ActivityIndicator />
      ) : staff.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            No stylists available
          </Text>

          <Text style={styles.muted}>
            Please try another salon.
          </Text>
        </View>
      ) : (
        staff.map((person) => {
          const selected =
            selectedStaff?.id === person.id;

          return (
            <TouchableOpacity
              key={person.id}
              style={[
                styles.staffButton,
                selected &&
                  styles.selectedButton,
              ]}
              onPress={() =>
                setSelectedStaff(person)
              }
            >

              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {person.name
                    ?.charAt(0)
                    ?.toUpperCase()}
                </Text>
              </View>

              <View>
                <Text
                  style={[
                    styles.staffName,
                    selected &&
                      styles.selectedText,
                  ]}
                >
                  {person.name}
                </Text>

                <Text
                  style={[
                    styles.staffRole,
                    selected &&
                      styles.selectedSubText,
                  ]}
                >
                  Stylist
                </Text>
              </View>

            </TouchableOpacity>
          );
        })
      )}


      {/* =================================================
          DATE
      ================================================= */}

      <Text style={styles.sectionLabel}>
        02 · DATE
      </Text>

      <Text style={styles.sectionTitle}>
        Select a date.
      </Text>


      <View style={styles.dateRow}>

        <TouchableOpacity
          style={styles.dateArrow}
          onPress={() =>
            changeDate(-1)
          }
        >
          <Text style={styles.arrowText}>
            ‹
          </Text>
        </TouchableOpacity>


        <View style={styles.dateBox}>

          <Text style={styles.dateText}>
            {displayDate(date)}
          </Text>

          <Text style={styles.dateValue}>
            {date}
          </Text>

        </View>


        <TouchableOpacity
          style={styles.dateArrow}
          onPress={() =>
            changeDate(1)
          }
        >
          <Text style={styles.arrowText}>
            ›
          </Text>
        </TouchableOpacity>

      </View>


      {/* =================================================
          TIME
      ================================================= */}

      <Text style={styles.sectionLabel}>
        03 · TIME
      </Text>

      <Text style={styles.sectionTitle}>
        Choose a time.
      </Text>


      {loadingSlots ? (

        <View style={styles.loading}>
          <ActivityIndicator />

          <Text style={styles.muted}>
            Checking availability...
          </Text>
        </View>

      ) : slots.length === 0 ? (

        <View style={styles.empty}>

          <Text style={styles.emptyTitle}>
            No available times
          </Text>

          <Text style={styles.muted}>
            Try another date or stylist.
          </Text>

        </View>

      ) : (

        <View style={styles.slotGrid}>

          {slots.map((slot) => {

            const selected =
              selectedTime === slot;

            return (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.slot,
                  selected &&
                    styles.slotSelected,
                ]}
                onPress={() =>
                  setSelectedTime(slot)
                }
              >

                <Text
                  style={[
                    styles.slotText,
                    selected &&
                      styles.slotSelectedText,
                  ]}
                >
                  {formatTime(slot)}
                </Text>

              </TouchableOpacity>
            );
          })}

        </View>
      )}


      {/* =================================================
          NOTES
      ================================================= */}

      <Text style={styles.sectionLabel}>
        04 · NOTES
      </Text>

      <Text style={styles.sectionTitle}>
        Anything we should know?
      </Text>


      <TextInput
        style={styles.notes}
        multiline
        numberOfLines={4}
        maxLength={500}
        placeholder="Add a note for your stylist..."
        placeholderTextColor="#9b9087"
        value={notes}
        onChangeText={setNotes}
      />


      {/* =================================================
          CONFIRM BOOKING
      ================================================= */}

      <TouchableOpacity
        style={[
          styles.confirmButton,
          (!selectedTime || booking) &&
            styles.disabled,
        ]}
        disabled={
          !selectedTime || booking
        }
        onPress={handleBooking}
      >

        <Text style={styles.confirmText}>
          {booking
            ? "Booking..."
            : "Confirm booking →"}
        </Text>

      </TouchableOpacity>

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
    paddingBottom: 45,
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
    marginTop: 7,
  },

  duration: {
    color: "#766b61",
    fontSize: 15,
    marginTop: 6,
  },

  sectionLabel: {
    color: "#9b7650",
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "700",
    marginTop: 30,
  },

  sectionTitle: {
    color: "#282522",
    fontSize: 25,
    fontWeight: "700",
    marginTop: 5,
    marginBottom: 14,
  },

  staffButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1d8cf",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  selectedButton: {
    backgroundColor: "#282522",
    borderColor: "#282522",
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#f0e9e1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#9b7650",
    fontSize: 17,
    fontWeight: "700",
  },

  staffName: {
    color: "#282522",
    fontSize: 16,
    fontWeight: "700",
  },

  selectedText: {
    color: "#ffffff",
  },

  staffRole: {
    color: "#766b61",
    fontSize: 13,
    marginTop: 3,
  },

  selectedSubText: {
    color: "#d6cbc0",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  dateArrow: {
    width: 44,
    height: 55,
    borderRadius: 10,
    backgroundColor: "#282522",
    justifyContent: "center",
    alignItems: "center",
  },

  arrowText: {
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 32,
  },

  dateBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1d8cf",
    borderRadius: 10,
    padding: 11,
  },

  dateText: {
    color: "#282522",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  dateValue: {
    color: "#9b7650",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },

  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  slot: {
    width: "31%",
    backgroundColor: "#282522",
    borderRadius: 9,
    paddingVertical: 14,
    alignItems: "center",
  },

  slotSelected: {
    backgroundColor: "#9b7650",
  },

  slotText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },

  slotSelectedText: {
    color: "#ffffff",
  },

  loading: {
    alignItems: "center",
    paddingVertical: 20,
  },

  empty: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1d8cf",
    borderRadius: 12,
    padding: 20,
  },

  emptyTitle: {
    color: "#282522",
    fontWeight: "700",
    fontSize: 16,
  },

  muted: {
    color: "#766b61",
    marginTop: 6,
  },

  notes: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1d8cf",
    borderRadius: 12,
    minHeight: 110,
    padding: 14,
    color: "#282522",
    textAlignVertical: "top",
  },

  confirmButton: {
    backgroundColor: "#282522",
    borderRadius: 11,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 28,
  },

  disabled: {
    opacity: 0.45,
  },

  confirmText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

});