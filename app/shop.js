// app/shop.js
// Équivalent mobile de app/shop/page.jsx.

import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import ListProducts from "../components/products/ListProducts";
import ListProductsSkeleton from "../components/skeletons/ListProductsSkeleton";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const REQUEST_TIMEOUT = 10000;

const first = (value) => (Array.isArray(value) ? value[0] : value);

const getAllProducts = async (searchParams) => {
  try {
    const urlSearchParams = new URLSearchParams();
    Object.entries(searchParams || {}).forEach(([key, value]) => {
      const v = first(value);
      if (v !== null && v !== undefined && v !== "")
        urlSearchParams.set(key, String(v));
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const res = await fetch(
      `${API_URL}/api/v1/products?${urlSearchParams.toString()}`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      },
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error(`API Error: ${res.status} - ${res.statusText}`);
      return { success: false, data: { products: [], totalPages: 0 } };
    }

    const responseBody = await res.json();
    if (!responseBody.success || !responseBody.data) {
      return { success: false, data: { products: [], totalPages: 0 } };
    }

    return {
      success: true,
      data: {
        products: responseBody.data.products || [],
        totalPages: responseBody.data.totalPages || 0,
        totalProducts: responseBody.data.totalProducts || 0,
      },
    };
  } catch (error) {
    console.error("Network error:", error.message);
    return { success: false, data: { products: [], totalPages: 0 } };
  }
};

const getCategories = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const res = await fetch(`${API_URL}/api/v1/category`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return { categories: [] };

    const responseBody = await res.json();
    if (!responseBody.success || !responseBody.data) return { categories: [] };

    return { categories: responseBody.data.categories || [] };
  } catch (error) {
    console.error("Network error:", error.message);
    return { categories: [] };
  }
};

export default function ShopScreen() {
  const searchParams = useLocalSearchParams();
  const [productsData, setProductsData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Clé stable pour re-déclencher le fetch quand les paramètres changent
  const paramsKey = JSON.stringify(searchParams);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [productsResult, categoriesResult] = await Promise.all([
        getAllProducts(searchParams),
        getCategories(),
      ]);

      if (!cancelled) {
        setProductsData(productsResult);
        setCategories(categoriesResult.categories);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  if (loading && !productsData) {
    return (
      <SafeAreaView
        edges={["bottom", "left", "right"]}
        className="flex-1 bg-white"
      >
        <ListProductsSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="flex-1 bg-white"
    >
      <ListProducts
        data={productsData?.data}
        categories={categories}
        loading={loading}
        searchParams={searchParams}
      />
    </SafeAreaView>
  );
}
