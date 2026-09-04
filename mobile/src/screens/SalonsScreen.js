import React, {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getSalons,
} from "../api/api";

import { useAuth } from "../context/AuthContext";

export default function SalonsScreen({
  navigation,
}) {
  const { logout } = useAuth();

  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSalons = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await getSalons();

        setSalons(data);
      } catch (error) {
        Alert.alert(
          "Unable to load salons",
          error.message
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  React.useEffect(() => {
    const unsubscribe =
      navigation.addListener(
        "focus",
        () => {
          loadSalons();
        }
      );

    return unsubscribe;
  }, [navigation, loadSalons]);

  async function handleLogout() {
    await logout();

    navigation.replace("Login");
  }

  function renderSalon({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate(
            "SalonDetails",
            {
              salonId: item.id,
            }
          )
        }
      >
        <View style={styles.icon}>
          <Text style={styles.iconText}>
            ✦
          </Text>
        </View>

        <Text style={styles.label}>
          SALON
        </Text>

        <Text style={styles.name}>
          {item.name}
        </Text>

        <Text style={styles.description}>
          {item.description ||
            "Beauty and wellness services"}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.smallLabel}>
          ADDRESS
        </Text>

        <Text style={styles.value}>
          {item.address}
        </Text>

        <Text style={styles.smallLabel}>
          PHONE
        </Text>

        <Text style={styles.value}>
          {item.phone}
        </Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Finding Lumora salons...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View>
          <Text style={styles.eyebrow}>
            LUMORA
          </Text>

          <Text style={styles.heading}>
            Find your salon.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
        >
          <Text style={styles.logout}>
            Sign out
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.intro}>
        Choose a salon, explore its services
        and book your appointment.
      </Text>

      <FlatList
        data={salons}
        keyExtractor={(item) =>
          String(item.id)
        }
        renderItem={renderSalon}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          salons.length === 0
            ? styles.emptyContainer
            : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadSalons(true)
            }
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No active salons are available.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f3ee",
    paddingHorizontal: 20,
  },

  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 24,
  },

  eyebrow: {
    color: "#9b7650",
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: "700",
  },

  heading: {
    color: "#282522",
    fontSize: 34,
    fontWeight: "700",
    marginTop: 6,
  },

  logout: {
    color: "#8d5f48",
    fontSize: 14,
    marginTop: 5,
  },

  intro: {
    color: "#766b61",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 10,
    marginBottom: 20,
  },

  list: {
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e1d8cf",
    padding: 20,
    marginBottom: 16,
  },

  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#f0e9e1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  iconText: {
    color: "#a17a51",
    fontSize: 22,
  },

  label: {
    color: "#a17a51",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
  },

  name: {
    color: "#282522",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 6,
  },

  description: {
    color: "#766b61",
    fontSize: 15,
    marginTop: 7,
    lineHeight: 21,
  },

  divider: {
    height: 1,
    backgroundColor: "#ece4dc",
    marginVertical: 18,
  },

  smallLabel: {
    color: "#a17a51",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginTop: 8,
  },

  value: {
    color: "#3b3632",
    fontSize: 14,
    marginTop: 4,
  },

  center: {
    flex: 1,
    backgroundColor: "#f7f3ee",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#766b61",
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },

  empty: {
    textAlign: "center",
    color: "#766b61",
    fontSize: 16,
  },
});