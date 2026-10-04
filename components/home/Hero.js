// components/home/Hero.js
// Équivalent mobile de Hero.jsx.
// Simplifié : pas de blobs animés en fond ni de vague SVG en bas (détails
// purement décoratifs, coûteux à reproduire fidèlement en React Native
// sans nouvelle dépendance). Le contenu et la logique (titre dynamique,
// image Cloudinary ou repli) sont conservés.

import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const DEFAULT_DATA = {
  title: "Bienvenue sur Buy It Now",
  subtitle: "Votre destination shopping de confiance",
  text: "Découvrez des milliers de produits de qualité à des prix imbattables",
  image: null,
};

const Hero = ({ homePageData }) => {
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);

  const heroData = homePageData || DEFAULT_DATA;
  const hasImage = heroData.image?.url && !imageFailed;

  return (
    <View className="bg-blue-50 px-4 py-8">
      {/* Image */}
      <View className="mb-6 overflow-hidden rounded-2xl shadow-lg">
        <View className="h-64 w-full">
          {hasImage ? (
            <Image
              source={{ uri: heroData.image.url }}
              className="h-full w-full"
              resizeMode="cover"
              onError={() => setImageFailed(true)}
              accessibilityLabel={heroData.title}
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-gray-200">
              <Ionicons name="image-outline" size={48} color="#9ca3af" />
            </View>
          )}
        </View>

        {/* Badge décoratif */}
        <View className="absolute bottom-3 left-3 right-3 flex-row items-center rounded-xl bg-white/95 p-3 shadow">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <Ionicons name="bag-outline" size={20} color="#ffffff" />
          </View>
          <View>
            <Text className="text-sm font-semibold text-gray-800">
              Expérience Premium
            </Text>
            <Text className="text-xs text-gray-600">
              Shopping de qualité supérieure
            </Text>
          </View>
        </View>
      </View>

      {/* Texte */}
      <Text className="mb-2 text-3xl font-bold text-gray-800">
        {heroData.title}
      </Text>
      <Text className="mb-2 text-lg font-semibold text-gray-600">
        {heroData.subtitle}
      </Text>
      <Text className="mb-6 text-base text-gray-500">{heroData.text}</Text>

      {/* CTA */}
      <View className="gap-3">
        <Pressable
          onPress={() => router.push("/shop")}
          className="flex-row items-center justify-center rounded-lg bg-blue-600 px-6 py-4 active:bg-blue-700"
        >
          <Text className="mr-2 font-semibold text-white">
            Parcourir la boutique
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#ffffff" />
        </Pressable>

        <Pressable
          onPress={() => router.push("/about")}
          className="items-center rounded-lg border border-gray-200 bg-white px-6 py-4 active:bg-gray-50"
        >
          <Text className="font-semibold text-gray-700">En savoir plus</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Hero;
