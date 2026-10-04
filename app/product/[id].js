// app/product/[id].js
// Équivalent mobile de app/product/[id]/page.jsx.

import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import ProductDetails from "../../components/products/ProductDetails";
import ProductDetailsSkeleton from "../../components/skeletons/ProductDetailsSkeleton";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const REQUEST_TIMEOUT = 10000;

const getProductDetails = async (id) => {
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return { success: false, notFound: true };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(`${API_URL}/api/v1/products/${id}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        success: false,
        notFound: res.status === 404 || res.status === 400,
      };
    }

    const responseBody = await res.json();
    if (!responseBody.success || !responseBody.data?.product) {
      return { success: false, notFound: true };
    }

    return {
      success: true,
      product: responseBody.data.product,
      sameCategoryProducts: responseBody.data.sameCategoryProducts || [],
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Network error:", error.message);
    return { success: false, notFound: false };
  }
};

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await getProductDetails(id);
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView
        edges={["bottom", "left", "right"]}
        className="flex-1 bg-gray-50"
      >
        <ProductDetailsSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="flex-1 bg-gray-50"
    >
      <ProductDetails
        product={data?.product}
        sameCategoryProducts={data?.sameCategoryProducts}
      />
    </SafeAreaView>
  );
}
