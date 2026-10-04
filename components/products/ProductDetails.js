// components/products/ProductDetails.js
// Équivalent mobile de ProductDetails.jsx.
// Simplifié : pas de zoom d'image ni de defilement auto du carrousel de
// produits similaires (timer + librairie de swipe), remplacé par un
// ScrollView horizontal classique. dangerouslySetInnerHTML (description)
// n'a pas d'équivalent RN : le HTML est dépouillé de ses balises avant
// affichage en texte brut.

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AuthContext from "../../context/AuthContext";
import CartContext from "../../context/CartContext";
import { INCREASE } from "../../helpers/constants";
import { formatPrice } from "../../lib/format";
import { showToast } from "../../lib/toast";
import BreadCrumbs from "../layouts/BreadCrumbs";
import ConditionalFooter from "../layouts/ConditionalFooter";

const stripHtml = (html) => (html ? html.replace(/<[^>]*>/g, "").trim() : "");

const ProductImageGallery = ({ product, selectedImage, onImageSelect }) => {
  const [mainFailed, setMainFailed] = useState(false);
  const productImages = product?.images?.length > 0 ? product.images : [];

  return (
    <View>
      <View className="mb-4 h-72 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white p-3">
        {selectedImage && !mainFailed ? (
          <Image
            source={{ uri: selectedImage }}
            className="h-full w-full"
            resizeMode="contain"
            onError={() => setMainFailed(true)}
            accessibilityLabel={product?.name || "Image du produit"}
          />
        ) : (
          <Ionicons name="image-outline" size={64} color="#d1d5db" />
        )}
      </View>

      {productImages.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {productImages.map((img, index) => (
            <Pressable
              key={img?.url || `img-${index}`}
              onPress={() => onImageSelect(img?.url)}
              className={`mr-2 h-16 w-16 items-center justify-center rounded-md border p-1 ${
                selectedImage === img?.url
                  ? "border-blue-500"
                  : "border-gray-200"
              }`}
            >
              <Image
                source={{ uri: img?.url }}
                className="h-full w-full"
                resizeMode="contain"
              />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const RelatedProducts = ({ products, currentProductId }) => {
  const router = useRouter();
  const filtered = useMemo(
    () => products?.filter((p) => p?._id !== currentProductId) || [],
    [products, currentProductId],
  );

  if (filtered.length === 0) return null;

  return (
    <View className="mt-8">
      <Text className="mb-4 text-xl font-bold text-gray-800">
        Produits similaires
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filtered.map((product) => (
          <Pressable
            key={product?._id}
            onPress={() => router.push(`/product/${product?._id}`)}
            className="mr-3 w-40 rounded-lg border border-gray-200 bg-white p-3"
          >
            <View className="mb-2 h-28 w-full items-center justify-center bg-gray-50">
              {product?.images?.[0]?.url ? (
                <Image
                  source={{ uri: product.images[0].url }}
                  className="h-full w-full"
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name="image-outline" size={28} color="#d1d5db" />
              )}
            </View>
            <Text
              className="mb-1 text-sm font-medium text-gray-800"
              numberOfLines={2}
            >
              {product?.name || "Produit sans nom"}
            </Text>
            <Text className="font-bold text-blue-600">
              {formatPrice(product?.price)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const ProductDetails = ({ product, sameCategoryProducts }) => {
  const router = useRouter();
  const { user, toggleFavorite } = useContext(AuthContext);
  const { addItemToCart, updateCart, cart, error, clearError } =
    useContext(CartContext);

  const [selectedImage, setSelectedImage] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    setSelectedImage(product?.images?.[0]?.url || null);
  }, [product]);

  useEffect(() => {
    if (error) {
      showToast(error);
      clearError();
    }
  }, [error, clearError]);

  const inStock = useMemo(() => (product?.stock ?? 0) >= 1, [product]);

  const breadCrumbs = useMemo(() => {
    if (!product) return null;
    return [
      { name: "Accueil", url: "/" },
      { name: "Boutique", url: "/shop" },
      {
        name: product.category?.categoryName || "Catégorie",
        url: `/shop?category=${product.category?._id || ""}`,
      },
      {
        name:
          product.name?.length > 40
            ? `${product.name.substring(0, 40)}...`
            : product.name || "Produit",
        url: `/product/${product._id}`,
      },
    ];
  }, [product]);

  const isFavorite = useMemo(() => {
    if (!user?.favorites || !Array.isArray(user.favorites)) return false;
    return user.favorites.some(
      (fav) => fav.productId?.toString() === product?._id,
    );
  }, [user, product?._id]);

  const handleToggleFavorite = useCallback(async () => {
    if (favoriteLoading) return;

    if (!user) {
      showToast("Connectez-vous pour ajouter des produits à vos favoris !");
      return;
    }
    if (!product?._id) {
      showToast("Produit invalide");
      return;
    }

    setFavoriteLoading(true);
    try {
      const productImage = product.images?.[0] || {
        public_id: null,
        url: null,
      };
      await toggleFavorite(
        product._id,
        product.name,
        productImage,
        isFavorite ? "remove" : "add",
      );
    } catch (error) {
      console.error("Error toggling favorite:", error);
      showToast("Erreur lors de la mise à jour des favoris");
    } finally {
      setFavoriteLoading(false);
    }
  }, [user, product, toggleFavorite, favoriteLoading, isFavorite]);

  const handleAddToCart = useCallback(() => {
    if (!product?._id) {
      showToast("Produit invalide");
      return;
    }
    if (!user) {
      showToast(
        "Veuillez vous connecter pour ajouter des articles à votre panier",
      );
      return;
    }
    if (!inStock) {
      showToast("Ce produit est en rupture de stock");
      return;
    }
    if (isAddingToCart) return;

    setIsAddingToCart(true);
    try {
      const isProductInCart = cart.find((i) => i?.productId === product._id);
      if (isProductInCart) {
        updateCart(isProductInCart, INCREASE);
      } else {
        addItemToCart({ product: product._id });
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
      showToast("Erreur lors de l'ajout au panier. Veuillez réessayer.");
    } finally {
      setTimeout(() => setIsAddingToCart(false), 500);
    }
  }, [product, user, cart, inStock, addItemToCart, updateCart, isAddingToCart]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: product?.name || "Découvrez ce produit",
        message: `Découvrez ${product?.name} sur Buy It Now`,
      });
    } catch (error) {
      console.error("Erreur lors du partage:", error);
    }
  }, [product?.name]);

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center px-6 py-16">
        <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
        <Text className="mb-2 mt-4 text-xl font-semibold text-gray-700">
          Produit non disponible
        </Text>
        <Text className="mb-6 text-center text-gray-600">
          Le produit demandé n&apos;existe pas ou a été retiré de notre
          catalogue.
        </Text>
        <Pressable
          onPress={() => router.replace("/")}
          className="rounded-lg bg-blue-600 px-6 py-3 active:bg-blue-700"
        >
          <Text className="font-semibold text-white">
            Retour à l&apos;accueil
          </Text>
        </Pressable>
      </View>
    );
  }

  const description = stripHtml(product.description);
  const isNew =
    product.createdAt &&
    new Date(product.createdAt) >
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const isPopular = product.sold > 10;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {breadCrumbs && <BreadCrumbs breadCrumbs={breadCrumbs} />}

      <View className="p-4">
        <View className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <ProductImageGallery
            product={product}
            selectedImage={selectedImage}
            onImageSelect={setSelectedImage}
          />

          {/* Titre + favoris */}
          <View className="mb-2 flex-row items-start justify-between">
            <Text className="mr-3 flex-1 text-xl font-semibold text-gray-800">
              {product.name}
            </Text>
            <Pressable
              onPress={handleToggleFavorite}
              disabled={favoriteLoading}
              className={`rounded-full p-2.5 shadow ${isFavorite ? "bg-pink-50" : "bg-gray-50"} ${favoriteLoading ? "opacity-60" : ""}`}
              accessibilityLabel={
                isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
              }
            >
              {favoriteLoading ? (
                <ActivityIndicator size="small" color="#ec4899" />
              ) : (
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={20}
                  color={isFavorite ? "#ec4899" : "#374151"}
                />
              )}
            </Pressable>
          </View>

          {product.verified && (
            <View className="mb-2 flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color="#15803d" />
              <Text className="ml-1 text-sm text-green-700">Vérifié</Text>
            </View>
          )}

          {/* Prix */}
          <View className="mb-4 flex-row items-baseline gap-3">
            <Text className="text-2xl font-semibold text-blue-600">
              {formatPrice(product.price)}
            </Text>
            {product.oldPrice ? (
              <Text className="text-base text-gray-500 line-through">
                {formatPrice(product.oldPrice)}
              </Text>
            ) : null}
          </View>

          {/* Description */}
          <Text className="mb-6 leading-relaxed text-gray-600">
            {description || "Aucune description disponible pour ce produit."}
          </Text>

          {/* Actions */}
          <View className="mb-6 flex-row gap-3">
            <Pressable
              onPress={handleAddToCart}
              disabled={!inStock || isAddingToCart}
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-lg px-4 py-3 ${
                inStock ? "bg-blue-600 active:bg-blue-700" : "bg-gray-400"
              }`}
            >
              {isAddingToCart ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="cart-outline" size={18} color="#ffffff" />
              )}
              <Text className="font-medium text-white">
                {inStock ? "Ajouter au panier" : "Indisponible"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              className="flex-row items-center justify-center gap-2 rounded-lg border border-blue-600 px-4 py-3 active:bg-blue-50"
            >
              <Ionicons name="share-social-outline" size={18} color="#2563eb" />
              <Text className="font-medium text-blue-600">Partager</Text>
            </Pressable>
          </View>

          {/* Détails */}
          <View className="gap-2">
            <View className="flex-row">
              <Text className="w-32 font-medium text-gray-600">
                Disponibilité :
              </Text>
              <View className="flex-row items-center">
                <Ionicons
                  name={inStock ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={inStock ? "#16a34a" : "#dc2626"}
                />
                <Text
                  className={`ml-1 font-medium ${inStock ? "text-green-600" : "text-red-600"}`}
                >
                  {inStock ? "En stock" : "Rupture de stock"}
                </Text>
              </View>
            </View>
            <View className="flex-row">
              <Text className="w-32 font-medium text-gray-600">Quantité :</Text>
              <Text className="text-gray-700">
                {product.stock || 0} unité(s)
              </Text>
            </View>
            <View className="flex-row">
              <Text className="w-32 font-medium text-gray-600">
                Catégorie :
              </Text>
              <Text className="text-gray-700">
                {product.category?.categoryName || "Non catégorisé"}
              </Text>
            </View>
            <View className="flex-row">
              <Text className="w-32 font-medium text-gray-600">
                Référence :
              </Text>
              <Text className="font-mono text-xs text-gray-700">
                {product._id || "N/A"}
              </Text>
            </View>
          </View>

          {isPopular && (
            <View className="mt-4 flex-row items-center rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
              <Ionicons name="trending-up-outline" size={16} color="#b45309" />
              <Text className="ml-2 text-sm text-amber-700">
                {product.sold > 100 ? "Très populaire" : "Populaire"}
              </Text>
            </View>
          )}

          {isNew && (
            <View className="mt-3 flex-row items-center rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
              <Ionicons name="star-outline" size={16} color="#1d4ed8" />
              <Text className="ml-2 text-sm text-blue-700">Nouveau</Text>
            </View>
          )}

          {product.specifications && (
            <View className="mt-6 border-t border-gray-200 pt-6">
              <Text className="mb-3 text-lg font-semibold">Spécifications</Text>
              {Object.entries(product.specifications).map(([key, value]) => (
                <View key={key} className="mb-1 flex-row">
                  <Text className="w-32 font-medium text-gray-700">
                    {key} :
                  </Text>
                  <Text className="flex-1 text-gray-700">{String(value)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <RelatedProducts
          products={sameCategoryProducts}
          currentProductId={product._id}
        />
      </View>

      <ConditionalFooter />
    </ScrollView>
  );
};

export default ProductDetails;
