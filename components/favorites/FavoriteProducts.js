// components/favorites/FavoriteProducts.js
// Équivalent mobile de FavoriteProducts.jsx.

import { useContext, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AuthContext from "../../context/AuthContext";
import CartContext from "../../context/CartContext";
import { showToast } from "../../lib/toast";

const FavoriteCard = ({ favorite, isRemoving, onRemove, onAddToCart }) => {
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);

  const addedDate = favorite.addedAt
    ? new Date(favorite.addedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Pressable
      onPress={() => router.push(`/product/${favorite.productId}`)}
      className={`flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white ${isRemoving ? "opacity-50" : ""}`}
    >
      <View className="h-40 w-full bg-gray-50">
        {favorite.productImage?.url && !imageFailed ? (
          <Image
            source={{ uri: favorite.productImage.url }}
            className="h-full w-full"
            resizeMode="contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="cube-outline" size={36} color="#d1d5db" />
          </View>
        )}
      </View>

      <View className="gap-2 p-3">
        <Text
          className="min-h-[36px] text-sm font-semibold text-gray-900"
          numberOfLines={2}
        >
          {favorite.productName}
        </Text>

        {addedDate && (
          <Text className="text-xs text-gray-500">Ajouté le {addedDate}</Text>
        )}

        <View className="flex-row items-center gap-2 pt-1">
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onAddToCart(favorite.productId);
            }}
            disabled={isRemoving}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 py-2 active:bg-blue-700"
            accessibilityLabel="Ajouter au panier"
          >
            <Ionicons name="cart-outline" size={15} color="#ffffff" />
            <Text className="text-xs font-medium text-white">Ajouter</Text>
          </Pressable>

          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onRemove(favorite.productId, favorite.productName);
            }}
            disabled={isRemoving}
            className="items-center justify-center rounded-lg border border-red-200 p-2.5 active:bg-red-50"
            accessibilityLabel="Retirer des favoris"
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <Ionicons name="trash-outline" size={17} color="#dc2626" />
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const FavoriteProducts = () => {
  const router = useRouter();
  const { user, toggleFavorite } = useContext(AuthContext);
  const { addItemToCart } = useContext(CartContext);

  const [removingIds, setRemovingIds] = useState(new Set());

  const handleRemoveFavorite = async (productId, productName) => {
    try {
      setRemovingIds((prev) => new Set(prev).add(productId));
      await toggleFavorite(productId, productName, null, "remove");
    } catch (error) {
      console.error("Error removing favorite:", error);
      showToast("Erreur lors de la suppression du favori");
    } finally {
      setRemovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleAddToCart = (productId) => {
    if (!user) {
      showToast("Connectez-vous pour ajouter au panier !");
      return;
    }

    try {
      addItemToCart({ product: productId });
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast("Erreur lors de l'ajout au panier");
    }
  };

  const favorites = Array.isArray(user?.favorites) ? user.favorites : [];
  const hasFavorites = favorites.length > 0;

  if (!hasFavorites) {
    return (
      <View className="items-center rounded-lg border border-gray-200 bg-white p-10">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-pink-50">
          <Ionicons name="heart-outline" size={40} color="#f472b6" />
        </View>
        <Text className="mb-3 text-xl font-semibold text-gray-900">
          Aucun favori pour le moment
        </Text>
        <Text className="mb-6 text-center text-gray-600">
          Découvrez nos produits et ajoutez vos coups de cœur à vos favoris en
          appuyant sur l&apos;icône ❤️
        </Text>
        <Pressable
          onPress={() => router.push("/shop")}
          className="flex-row items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 active:bg-blue-700"
        >
          <Ionicons name="cube-outline" size={18} color="#ffffff" />
          <Text className="font-medium text-white">Découvrir nos produits</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {/* En-tête résumé */}
      <View className="flex-row items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-pink-50">
          <Ionicons name="heart" size={22} color="#ec4899" />
        </View>
        <View>
          <Text className="text-xl font-bold text-gray-900">Mes Favoris</Text>
          <Text className="mt-0.5 text-sm text-gray-500">
            {favorites.length} produit{favorites.length > 1 ? "s" : ""} dans vos
            favoris
          </Text>
        </View>
      </View>

      {/* Grille */}
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.productId}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <FavoriteCard
            favorite={item}
            isRemoving={removingIds.has(item.productId)}
            onRemove={handleRemoveFavorite}
            onAddToCart={handleAddToCart}
          />
        )}
      />
    </View>
  );
};

export default FavoriteProducts;
