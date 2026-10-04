// components/layouts/NavDrawer.js
// Panneau de navigation "fait maison" (pas de dépendance supplémentaire),
// glisse depuis la gauche. Même principe que l'overlay du menu "⋮" de
// Profile.js dans le premier projet, mais en panneau latéral animé.

import { useEffect, useRef } from "react";
import { Animated, Dimensions, Pressable, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 320);

const NAV_LINKS = [
  { href: "/", label: "Accueil", icon: "home-outline" },
  { href: "/shop", label: "Boutique", icon: "storefront-outline" },
  { href: "/about", label: "À propos", icon: "information-circle-outline" },
  { href: "/contact", label: "Contactez-nous", icon: "mail-outline" },
];

const NavDrawer = ({ visible, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : -DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: visible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateX, overlayOpacity]);

  const goTo = (href) => {
    onClose();
    router.push(href);
  };

  // Toujours monté (pour l'animation de fermeture), mais ignore les touchers
  // une fois fermé
  return (
    <View
      pointerEvents={visible ? "auto" : "none"}
      className="absolute inset-0 z-50"
    >
      <Animated.View
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-black/40"
      >
        <Pressable onPress={onClose} className="flex-1" />
      </Animated.View>

      <Animated.View
        style={{
          width: DRAWER_WIDTH,
          paddingTop: insets.top,
          transform: [{ translateX }],
        }}
        className="absolute bottom-0 left-0 top-0 bg-white shadow-lg"
      >
        <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-4">
          <Text className="text-xl font-extrabold text-blue-600">BuyItNow</Text>
          <Pressable onPress={onClose} accessibilityLabel="Fermer le menu">
            <Ionicons name="close" size={24} color="#374151" />
          </Pressable>
        </View>

        <View className="px-2 py-4">
          {NAV_LINKS.map((link) => {
            // "/" ne doit être actif que pour une correspondance exacte,
            // sinon il resterait coché sur toutes les routes (toutes
            // commencent par "/"). Les autres liens tolèrent les sous-routes.
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Pressable
                key={link.href}
                onPress={() => goTo(link.href)}
                className={`flex-row items-center rounded-md px-3 py-3 ${
                  isActive ? "bg-blue-50" : "active:bg-gray-50"
                }`}
              >
                <Ionicons
                  name={link.icon}
                  size={20}
                  color={isActive ? "#2563eb" : "#374151"}
                />
                <Text
                  className={`ml-3 text-base ${isActive ? "font-semibold text-blue-600" : "text-gray-700"}`}
                >
                  {link.label}
                </Text>
                {isActive && (
                  <View className="ml-auto h-2 w-2 rounded-full bg-blue-600" />
                )}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
};

export default NavDrawer;
