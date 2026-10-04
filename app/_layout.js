// app/_layout.js
// Équivalent mobile de app/layout.jsx + GlobalProvider.jsx.

import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { OrderProvider } from "../context/OrderContext";
import Header from "../components/layouts/Header";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            <StatusBar style="dark" />
            <View className="flex-1 bg-gray-50">
              <Header />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "#f9fafb" },
                }}
              />
            </View>
          </OrderProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
