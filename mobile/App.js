import React from "react";

import {
  NavigationContainer,
} from "@react-navigation/native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import { AuthProvider, useAuth } from "./src/context/AuthContext";

import LoginScreen from "./src/screens/LoginScreen";
import SalonsScreen from "./src/screens/SalonsScreen";
import SalonDetailsScreen from "./src/screens/SalonDetailsScreen";
import BookingScreen from "./src/screens/BookingScreen";
import BookingConfirmationScreen from "./src/screens/BookingConfirmationScreen";
import MyBookingsScreen from "./src/screens/MyBookingsScreen";

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={
          isAuthenticated
            ? "Salons"
            : "Login"
        }
        screenOptions={{
          headerStyle: {
            backgroundColor: "#282522",
          },

          headerTintColor: "#ffffff",

          headerTitleStyle: {
            fontWeight: "600",
          },

          contentStyle: {
            backgroundColor: "#f7f3ee",
          },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: "Lumora",
          }}
        />

        <Stack.Screen
          name="Salons"
          component={SalonsScreen}
          options={{
            title: "Discover Salons",
          }}
        />

        <Stack.Screen
          name="SalonDetails"
          component={SalonDetailsScreen}
          options={{
            title: "Salon",
          }}
        />

        <Stack.Screen
          name="Booking"
          component={BookingScreen}
          options={{
            title: "Book Appointment",
          }}
        />

        <Stack.Screen
          name="BookingConfirmation"
          component={BookingConfirmationScreen}
          options={{
            title: "Booking Confirmed",
            headerBackVisible: false,
          }}
        />

        <Stack.Screen
          name="MyBookings"
          component={MyBookingsScreen}
          options={{
            title: "My Bookings",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}