import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext(null);

const TOKEN_KEY = "lumora_mobile_token";
const USER_KEY = "lumora_mobile_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const savedUser = await AsyncStorage.getItem(USER_KEY);

      if (savedToken) {
        setToken(savedToken);
      }

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.log("Failed to restore mobile session:", error);
    } finally {
      setLoading(false);
    }
  }

  async function login(authToken, userData) {
    setToken(authToken);
    setUser(userData);

    await AsyncStorage.setItem(
      TOKEN_KEY,
      authToken
    );

    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify(userData)
    );
  }

  async function logout() {
    setToken(null);
    setUser(null);

    await AsyncStorage.multiRemove([
      TOKEN_KEY,
      USER_KEY,
    ]);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        loading,
        isAuthenticated: Boolean(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}