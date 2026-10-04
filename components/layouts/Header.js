// components/layouts/Header.js
// Équivalent mobile de Header.jsx.
// Icônes toujours visibles (pas de distinction desktop/mobile, l'app est
// "mobile" par nature) : cœur (favoris, si connecté), panier, avatar/login,
// hamburger. Les liens de navigation (Accueil/Boutique/À propos/Contact)
// vivent dans NavDrawer, ouvert par le hamburger — pas dans le dropdown
// avatar, qui garde seulement Mon profil/Mes commandes/Déconnexion.
//
// IMPORTANT : c'est ICI (pas dans CartContext) que le panier est chargé
// dès qu'une session apparaît — changement structurel du web à reproduire.

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AuthContext from "../../context/AuthContext";
import CartContext from "../../context/CartContext";
import { signOut, useSession } from "../../lib/auth-client";
import NavDrawer from "./NavDrawer";

const Avatar = ({ user, size = 32 }) => {
  const [failed, setFailed] = useState(false);
  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  if (user?.image && !failed) {
    return (
      <Image
        source={{ uri: user.image }}
        style={{ width: size, height: size }}
        className="rounded-full"
        onError={() => setFailed(true)}
        accessibilityLabel={`Photo de profil de ${user?.name || "utilisateur"}`}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center rounded-full bg-blue-100"
    >
      <Text className="text-xs font-semibold text-blue-700">{initial}</Text>
    </View>
  );
};

const IconBadge = ({ count, className = "bg-red-500" }) => {
  if (!count || count <= 0) return null;
  return (
    <View
      className={`absolute -right-1.5 -top-1.5 h-5 min-w-[20px] items-center justify-center rounded-full px-1 ${className}`}
    >
      <Text className="text-xs font-medium text-white">{count}</Text>
    </View>
  );
};

const Header = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user } = useContext(AuthContext);
  const { data: session } = useSession();

  const { setCartToState, cartCount, clearCartOnLogout } =
    useContext(CartContext);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isCartLoadingRef = useRef(false);

  const loadCart = useCallback(async () => {
    if (isCartLoadingRef.current) return;
    try {
      isCartLoadingRef.current = true;
      await setCartToState();
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      isCartLoadingRef.current = false;
    }
  }, [setCartToState]);

  // Charger le panier dès qu'une session est présente
  useEffect(() => {
    if (session) {
      loadCart();
    }
  }, [session, loadCart]);

  const favoritesCount = user?.favorites?.length || 0;

  const closeUserMenu = () => setUserMenuOpen(false);

  const goTo = (href) => {
    closeUserMenu();
    router.push(href);
  };

  const handleSignOut = useCallback(async () => {
    closeUserMenu();
    try {
      clearCartOnLogout();
      await signOut();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      router.replace("/login");
    }
  }, [clearCartOnLogout, router]);

  return (
    <>
      <View
        style={{ paddingTop: insets.top }}
        className="border-b border-gray-200 bg-white"
      >
        <View className="flex-row items-center justify-between px-4 py-2">
          {/* Logo */}
          <Pressable
            onPress={() => {
              closeUserMenu();
              router.replace("/");
            }}
            accessibilityLabel="Accueil Buy It Now"
          >
            <Text className="text-xl font-extrabold text-blue-600">
              BuyItNow
            </Text>
          </Pressable>

          {/* Icônes */}
          <View className="flex-row items-center gap-1">
            {user && (
              <Pressable
                onPress={() => goTo("/favorites")}
                accessibilityLabel="Mes favoris"
                className="relative rounded-full p-2 active:bg-gray-100"
              >
                <Ionicons name="heart-outline" size={22} color="#374151" />
                <IconBadge count={favoritesCount} className="bg-pink-500" />
              </Pressable>
            )}

            <Pressable
              onPress={() => goTo("/cart")}
              accessibilityLabel="Panier"
              className="relative rounded-full p-2 active:bg-gray-100"
            >
              <Ionicons name="cart-outline" size={22} color="#374151" />
              <IconBadge count={cartCount} className="bg-red-500" />
            </Pressable>

            {user ? (
              <Pressable
                onPress={() => setUserMenuOpen((open) => !open)}
                accessibilityLabel={
                  userMenuOpen ? "Fermer le menu" : "Ouvrir le menu"
                }
                accessibilityState={{ expanded: userMenuOpen }}
                className="rounded-full border-2 border-gray-200 p-0.5 active:border-blue-400"
              >
                <Avatar user={user} size={28} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => goTo("/login")}
                accessibilityLabel="Connexion"
                className="rounded-full p-2 active:bg-gray-100"
              >
                <Ionicons name="person-outline" size={22} color="#374151" />
              </Pressable>
            )}

            <Pressable
              onPress={() => setDrawerOpen(true)}
              accessibilityLabel="Ouvrir le menu de navigation"
              className="rounded-full p-2 active:bg-gray-100"
            >
              <Ionicons name="menu" size={24} color="#374151" />
            </Pressable>
          </View>
        </View>

        {/* Menu utilisateur (Mon profil / Mes commandes / Déconnexion) */}
        {userMenuOpen && user && (
          <Pressable
            onPress={closeUserMenu}
            className="absolute inset-0 z-40"
            style={{ top: insets.top + 48 }}
          >
            <View className="absolute right-4 top-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
              <Pressable
                onPress={() => goTo("/me")}
                className="px-4 py-3 active:bg-blue-50"
              >
                <Text className="text-sm text-gray-700">Mon profil</Text>
              </Pressable>
              <Pressable
                onPress={() => goTo("/me/orders")}
                className="px-4 py-3 active:bg-blue-50"
              >
                <Text className="text-sm text-gray-700">Mes commandes</Text>
              </Pressable>
              <Pressable
                onPress={handleSignOut}
                className="px-4 py-3 active:bg-red-50"
              >
                <Text className="text-sm text-red-600">Déconnexion</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      </View>

      <NavDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};

export default Header;
