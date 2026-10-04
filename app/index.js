// app/index.js
// Équivalent mobile de app/page.jsx.

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Hero from "../components/home/Hero";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const REQUEST_TIMEOUT = 10000;

const getHomePageData = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(`${API_URL}/api/v1/homepage`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(`API Error: ${res.status} - ${res.statusText}`);
      return {
        success: false,
        message: "Erreur lors de la récupération des données",
        data: null,
      };
    }

    const responseBody = await res.json();

    if (!responseBody.success) {
      console.error("Invalid API response structure:", responseBody);
      return {
        success: false,
        message: responseBody.message || "Réponse API invalide",
        data: null,
      };
    }

    return {
      success: true,
      message: "Données récupérées avec succès",
      data: responseBody.data,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("Request timeout after 10 seconds");
      return {
        success: false,
        message: "La requête a pris trop de temps",
        data: null,
      };
    }
    console.error("Network error:", error.message);
    return {
      success: false,
      message: "Problème de connexion réseau",
      data: null,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

export default function HomeScreen() {
  const [homePageData, setHomePageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await getHomePageData();
      if (!cancelled) {
        setHomePageData(result.data);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (loading) {
    return (
      <SafeAreaView
        edges={["bottom", "left", "right"]}
        className="flex-1 items-center justify-center bg-white"
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="flex-1 bg-white"
    >
      <ScrollView>
        <Hero homePageData={homePageData} />
      </ScrollView>
    </SafeAreaView>
  );
}
