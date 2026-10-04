// components/layouts/Footer.js
// Équivalent mobile de Footer.jsx.

import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/me", label: "Mon compte" },
  { href: "/cart", label: "Panier" },
];

const Footer = () => {
  const router = useRouter();

  return (
    <View className="bg-gray-800 px-4 py-6">
      <Text className="mb-2 text-lg font-bold text-white">Buy It Now</Text>
      <Text className="mb-4 text-sm text-gray-300">
        Votre destination pour le shopping en ligne de qualité. Découvrez notre
        vaste sélection de produits à des prix compétitifs.
      </Text>

      <Text className="mb-2 text-base font-bold text-white">Liens utiles</Text>
      <View className="mb-4 gap-1">
        {LINKS.map((link) => (
          <Pressable key={link.href} onPress={() => router.push(link.href)}>
            <Text className="py-1 text-sm text-gray-300">{link.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text className="mb-2 text-base font-bold text-white">
        Nous contacter
      </Text>
      <Text className="text-sm text-gray-300">Email: contact@buyitnow.com</Text>
      <Text className="text-sm text-gray-300">
        Téléphone: +33 1 23 45 67 89
      </Text>

      <View className="mt-6 border-t border-gray-700 pt-4">
        <Text className="text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Buy It Now. Tous droits réservés.
        </Text>
      </View>
    </View>
  );
};

export default Footer;
