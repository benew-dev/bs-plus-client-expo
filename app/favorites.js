// app/favorites.js
// Équivalent mobile de app/favorites/page.jsx.

import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../lib/auth-client";
import FavoriteProducts from "../components/favorites/FavoriteProducts";
import FavoritesSkeleton from "../components/skeletons/FavoritesSkeleton";
import ConditionalFooter from "../components/layouts/ConditionalFooter";

export default function FavoritesScreen() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace({
        pathname: "/login",
        params: { callbackUrl: "/favorites" },
      });
    }
  }, [isPending, session?.user, router]);

  if (isPending) {
    return (
      <SafeAreaView
        edges={["bottom", "left", "right"]}
        className="flex-1 bg-gray-50"
      >
        <FavoritesSkeleton />
      </SafeAreaView>
    );
  }

  if (!session?.user) {
    // Redirection en cours (useEffect ci-dessus)
    return null;
  }

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="flex-1 bg-gray-50"
    >
      <ScrollView>
        {/* En-tête */}
        <View className="flex-row items-center gap-3 bg-pink-100 px-4 py-5">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-pink-500">
            <Ionicons name="heart" size={22} color="#ffffff" />
          </View>
          <Text className="text-2xl font-medium text-slate-800">
            MES FAVORIS
          </Text>
        </View>

        <View className="p-4">
          <FavoriteProducts />
        </View>

        <ConditionalFooter />
      </ScrollView>
    </SafeAreaView>
  );
}
