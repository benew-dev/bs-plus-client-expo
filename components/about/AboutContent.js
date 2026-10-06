// components/about/AboutContent.js
// Équivalent mobile de AboutContent.jsx.
// Dégradés CSS remplacés par des couleurs pleines (pas de gradient natif
// en React Native sans dépendance supplémentaire).

import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const VALUES = [
  {
    icon: "heart",
    title: "Satisfaction Client",
    description:
      "Votre satisfaction est notre priorité absolue. Nous mettons tout en œuvre pour vous offrir une expérience d'achat exceptionnelle.",
    color: "#ef4444",
  },
  {
    icon: "shield-checkmark",
    title: "Sécurité",
    description:
      "Vos données sont protégées avec les dernières technologies de sécurité. Achetez en toute confiance.",
    color: "#2563eb",
  },
  {
    icon: "flash",
    title: "Rapidité",
    description:
      "Livraison express et service client réactif. Nous valorisons votre temps autant que vous.",
    color: "#f59e0b",
  },
  {
    icon: "ribbon",
    title: "Qualité",
    description:
      "Nous sélectionnons rigoureusement nos produits pour vous garantir la meilleure qualité au meilleur prix.",
    color: "#7c3aed",
  },
];

const MILESTONES = [
  {
    year: "2020",
    title: "Création",
    description:
      "Lancement de Buy It Now avec une vision claire : simplifier le shopping en ligne.",
  },
  {
    year: "2021",
    title: "Expansion",
    description: "Ouverture de notre catalogue à plus de 10 000 produits.",
  },
  {
    year: "2023",
    title: "Innovation",
    description:
      "Lancement de notre application mobile et amélioration de l'expérience utilisateur.",
  },
  {
    year: "2025",
    title: "Leadership",
    description:
      "Reconnaissance comme l'une des plateformes e-commerce les plus innovantes.",
  },
];

const AboutContent = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("mission");

  return (
    <ScrollView
      className="flex-1 bg-blue-50"
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Hero */}
      <View className="mb-8 items-center">
        <Text className="mb-4 text-center text-3xl font-bold text-gray-800">
          À propos de <Text className="text-blue-600">Buy It Now</Text>
        </Text>
        <Text className="text-center leading-relaxed text-gray-600">
          Nous sommes bien plus qu&apos;une simple boutique en ligne. Nous
          sommes votre partenaire de confiance pour une expérience shopping
          exceptionnelle, alliant qualité, rapidité et sécurité.
        </Text>
      </View>

      {/* Onglets */}
      <View className="mb-8 rounded-2xl bg-white p-6 shadow">
        <View className="mb-6 flex-row justify-center gap-3">
          <Pressable
            onPress={() => setActiveTab("mission")}
            className={`flex-row items-center rounded-lg px-4 py-3 ${
              activeTab === "mission" ? "bg-blue-600" : "bg-gray-100"
            }`}
          >
            <Ionicons
              name="flag-outline"
              size={18}
              color={activeTab === "mission" ? "#ffffff" : "#374151"}
            />
            <Text
              className={`ml-2 font-semibold ${activeTab === "mission" ? "text-white" : "text-gray-700"}`}
            >
              Notre Mission
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("histoire")}
            className={`flex-row items-center rounded-lg px-4 py-3 ${
              activeTab === "histoire" ? "bg-blue-600" : "bg-gray-100"
            }`}
          >
            <Ionicons
              name="trending-up-outline"
              size={18}
              color={activeTab === "histoire" ? "#ffffff" : "#374151"}
            />
            <Text
              className={`ml-2 font-semibold ${activeTab === "histoire" ? "text-white" : "text-gray-700"}`}
            >
              Notre Histoire
            </Text>
          </Pressable>
        </View>

        {activeTab === "mission" ? (
          <View className="gap-4">
            <Text className="text-xl font-bold text-gray-800">
              Notre Mission
            </Text>
            <Text className="leading-relaxed text-gray-600">
              Chez Buy It Now, notre mission est de révolutionner
              l&apos;expérience du shopping en ligne en rendant l&apos;achat de
              produits de qualité simple, rapide et accessible à tous. Nous
              croyons que chacun mérite d&apos;avoir accès à des produits
              exceptionnels sans compromettre la qualité ou la sécurité.
            </Text>
            <Text className="leading-relaxed text-gray-600">
              Nous nous engageons à offrir une plateforme innovante où la
              satisfaction client est au cœur de tout ce que nous faisons.
              Chaque jour, nous travaillons pour améliorer votre expérience et
              dépasser vos attentes.
            </Text>
          </View>
        ) : (
          <View className="gap-6">
            <Text className="text-xl font-bold text-gray-800">
              Notre Histoire
            </Text>
            <Text className="leading-relaxed text-gray-600">
              Depuis nos débuts en 2020, Buy It Now n&apos;a cessé
              d&apos;évoluer pour devenir l&apos;une des plateformes e-commerce
              les plus fiables et innovantes du marché.
            </Text>

            <View className="gap-4">
              {MILESTONES.map((milestone) => (
                <View
                  key={milestone.year}
                  className="flex-row items-start gap-4"
                >
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-blue-600">
                    <Text className="text-xs font-bold text-white">
                      {milestone.year}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-lg bg-gray-50 p-4">
                    <Text className="mb-1 text-base font-bold text-gray-800">
                      {milestone.title}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {milestone.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Valeurs */}
      <Text className="mb-6 text-center text-2xl font-bold text-gray-800">
        Nos Valeurs
      </Text>
      <View className="mb-8 gap-4">
        {VALUES.map((value) => (
          <View key={value.title} className="rounded-xl bg-white p-5 shadow">
            <View
              className="mb-4 h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: value.color }}
            >
              <Ionicons name={value.icon} size={26} color="#ffffff" />
            </View>
            <Text className="mb-2 text-lg font-bold text-gray-800">
              {value.title}
            </Text>
            <Text className="leading-relaxed text-gray-600">
              {value.description}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View className="items-center rounded-2xl bg-blue-600 p-8">
        <Text className="mb-3 text-center text-2xl font-bold text-white">
          Prêt à commencer ?
        </Text>
        <Text className="mb-6 text-center text-white opacity-90">
          Rejoignez des milliers de clients satisfaits et découvrez une nouvelle
          façon de faire du shopping en ligne.
        </Text>

        <View className="w-full gap-3">
          <Pressable
            onPress={() => router.push("/shop")}
            className="flex-row items-center justify-center rounded-lg bg-white px-6 py-4 active:bg-gray-100"
          >
            <Ionicons name="bag-outline" size={18} color="#2563eb" />
            <Text className="ml-2 font-semibold text-blue-600">
              Parcourir la boutique
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/contact")}
            className="items-center justify-center rounded-lg border-2 border-white px-6 py-4 active:bg-blue-700"
          >
            <Text className="font-semibold text-white">Contactez-nous</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

export default AboutContent;
