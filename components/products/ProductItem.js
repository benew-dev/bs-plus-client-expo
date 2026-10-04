// components/products/ProductItem.js
// Équivalent mobile de ProductItem.jsx.

import { memo, useCallback, useContext, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CartContext from "../../context/CartContext";
import AuthContext from "../../context/AuthContext";
import { INCREASE } from "../../helpers/constants";
import { formatPrice } from "../../lib/format";
import { showToast } from "../../lib/toast";

const ProductItem = memo(({ product }) => {
  const router = useRouter();
  const { addItemToCart, updateCart, cart } = useContext(CartContext);
  const { user, toggleFavorite } = useContext(AuthContext);

  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  if (!product || typeof product !== "object") return null;

  const inStock = product.stock > 0;
  const productId = product._id || "";
  const productName = product.name || "Produit sans nom";
  const productPrice = product.price || 0;
  const productCategory = product.category?.categoryName || "Non catégorisé";
  const imageUrl = product.images?.[0]?.url;

  const isFavorite = useMemo(() => {
    if (!user?.favorites || !Array.isArray(user.favorites)) return false;
    return user.favorites.some(
      (fav) => fav.productId?.toString() === productId,
    );
  }, [user, productId]);

  const addToCartHandler = useCallback(
    (e) => {
      e?.stopPropagation?.();
      if (!user) {
        showToast("Connectez-vous pour ajouter des articles à votre panier !");
        return;
      }

      const isProductInCart = cart.find((i) => i?.productId === productId);
      if (isProductInCart) {
        updateCart(isProductInCart, INCREASE);
      } else {
        addItemToCart({ product: productId });
      }
    },
    [user, cart, productId, updateCart, addItemToCart],
  );

  const toggleFavoriteHandler = useCallback(
    async (e) => {
      e?.stopPropagation?.();
      if (favoriteLoading) return;

      if (!user) {
        showToast("Connectez-vous pour ajouter des produits à vos favoris !");
        return;
      }

      setFavoriteLoading(true);
      try {
        const productImage = product.images?.[0] || {
          public_id: null,
          url: null,
        };
        await toggleFavorite(productId, productName, productImage);
      } catch (error) {
        console.error("Error toggling favorite:", error);
        showToast("Erreur lors de la mise à jour des favoris");
      } finally {
        setFavoriteLoading(false);
      }
    },
    [
      user,
      productId,
      productName,
      product.images,
      toggleFavorite,
      favoriteLoading,
    ],
  );

  return (
    <Pressable
      onPress={() => router.push(`/product/${productId}`)}
      className="relative w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm active:opacity-90"
    >
      {/* Badge stock */}
      {!inStock && (
        <View className="absolute left-3 top-3 z-10 rounded-full bg-red-500 px-2.5 py-1 shadow">
          <Text className="text-xs font-semibold text-white">
            Rupture de stock
          </Text>
        </View>
      )}

      {/* Favoris */}
      <Pressable
        onPress={toggleFavoriteHandler}
        disabled={favoriteLoading}
        className={`absolute right-3 top-3 z-10 rounded-full p-2 shadow ${
          isFavorite ? "bg-pink-50" : "bg-white/90"
        } ${favoriteLoading ? "opacity-60" : ""}`}
        accessibilityLabel={
          isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
        }
      >
        {favoriteLoading ? (
          <ActivityIndicator size="small" color="#ec4899" />
        ) : (
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={18}
            color={isFavorite ? "#ec4899" : "#374151"}
          />
        )}
      </Pressable>

      {/* Image */}
      <View className="h-48 w-full bg-white p-2">
        {imageUrl && !imageFailed ? (
          <Image
            source={{ uri: imageUrl }}
            className="h-full w-full"
            resizeMode="contain"
            onError={() => setImageFailed(true)}
            accessibilityLabel={productName}
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-gray-50">
            <Ionicons name="image-outline" size={32} color="#9ca3af" />
          </View>
        )}
      </View>

      {/* Contenu */}
      <View className="gap-2 p-4">
        <View className="self-start rounded-full bg-blue-50 px-2 py-0.5">
          <Text className="text-xs font-medium text-blue-700">
            {productCategory}
          </Text>
        </View>

        <Text
          className="min-h-[40px] text-base font-semibold text-gray-900"
          numberOfLines={2}
        >
          {productName}
        </Text>

        <Text className="text-xl font-bold text-gray-900">
          {formatPrice(productPrice)}
        </Text>

        <Pressable
          onPress={addToCartHandler}
          disabled={!inStock}
          className={`mt-1 flex-row items-center justify-center gap-2 rounded-lg px-3 py-2.5 ${
            inStock ? "bg-blue-600 active:bg-blue-700" : "bg-gray-200"
          }`}
          accessibilityLabel={
            inStock ? "Ajouter au panier" : "Produit indisponible"
          }
        >
          <Ionicons
            name="cart-outline"
            size={16}
            color={inStock ? "#ffffff" : "#6b7280"}
          />
          <Text
            className={`text-sm font-medium ${inStock ? "text-white" : "text-gray-500"}`}
          >
            {inStock ? "Ajouter au panier" : "Indisponible"}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
});

ProductItem.displayName = "ProductItem";

export default ProductItem;
