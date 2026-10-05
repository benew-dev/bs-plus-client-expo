// components/cart/ItemCart.js
// Équivalent mobile de ItemCart.jsx.

import { memo, useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice } from "../../lib/format";

const ItemCart = memo(
  ({
    cartItem,
    deleteItemFromCart,
    decreaseQty,
    increaseQty,
    deleteInProgress,
  }) => {
    const router = useRouter();
    const [isStockLow, setIsStockLow] = useState(false);
    const [isOutOfStock, setIsOutOfStock] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
      setIsStockLow(cartItem?.stock <= 5 && cartItem?.stock > 0);
      setIsOutOfStock(cartItem?.stock === 0);
    }, [cartItem]);

    const handleDelete = async () => {
      if (deleteInProgress) return;
      setIsDeleting(true);
      await deleteItemFromCart(cartItem.id);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    };

    return (
      <View className="border-b border-gray-100 py-4">
        <View className="flex-row items-start gap-3">
          <Pressable
            onPress={() => router.push(`/product/${cartItem?.productId}`)}
          >
            <View className="h-20 w-20 overflow-hidden rounded border border-gray-200 bg-white">
              {cartItem?.imageUrl && !imageFailed ? (
                <Image
                  source={{ uri: cartItem.imageUrl }}
                  className="h-full w-full"
                  resizeMode="contain"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Ionicons name="image-outline" size={24} color="#d1d5db" />
                </View>
              )}
            </View>
          </Pressable>

          <View className="flex-1">
            <Pressable
              onPress={() => router.push(`/product/${cartItem?.productId}`)}
            >
              <Text
                className="text-sm font-semibold text-gray-800"
                numberOfLines={2}
              >
                {cartItem?.productName}
              </Text>
            </Pressable>

            <View
              className="mt-1 self-start rounded-full px-2 py-0.5"
              style={{
                backgroundColor: isOutOfStock
                  ? "#fee2e2"
                  : isStockLow
                    ? "#fef9c3"
                    : "#dcfce7",
              }}
            >
              <Text
                className="text-xs font-medium"
                style={{
                  color: isOutOfStock
                    ? "#991b1b"
                    : isStockLow
                      ? "#854d0e"
                      : "#166534",
                }}
              >
                {isOutOfStock
                  ? "Rupture de stock"
                  : isStockLow
                    ? `Stock limité: ${cartItem?.stock}`
                    : "En stock"}
              </Text>
            </View>

            {/* Contrôle de quantité */}
            <View className="mt-3 flex-row items-center self-start rounded-lg border border-gray-200 bg-gray-50">
              <Pressable
                onPress={() => decreaseQty(cartItem)}
                disabled={cartItem.quantity <= 1 || isOutOfStock}
                className="h-9 w-9 items-center justify-center rounded-l-lg active:bg-gray-100 disabled:opacity-40"
              >
                <Ionicons name="remove" size={16} color="#374151" />
              </Pressable>

              <Text className="w-10 text-center text-sm font-medium text-gray-900">
                {cartItem?.quantity}
              </Text>

              <Pressable
                onPress={() => increaseQty(cartItem)}
                disabled={cartItem.quantity >= cartItem?.stock || isOutOfStock}
                className="h-9 w-9 items-center justify-center rounded-r-lg active:bg-gray-100 disabled:opacity-40"
              >
                <Ionicons name="add" size={16} color="#374151" />
              </Pressable>
            </View>
          </View>

          <View className="items-end">
            <Text className="text-base font-medium text-blue-600">
              {formatPrice(cartItem?.subtotal)}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatPrice(cartItem?.price)} l&apos;unité
            </Text>

            <View className="mt-3">
              {showDeleteConfirm ? (
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={handleDelete}
                    disabled={isDeleting}
                    className="flex-row items-center rounded bg-red-600 px-2 py-1 active:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting && (
                      <ActivityIndicator
                        size="small"
                        color="#ffffff"
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text className="text-xs text-white">
                      {isDeleting ? "Suppression..." : "Confirmer"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setShowDeleteConfirm(false)}
                    className="rounded bg-gray-200 px-2 py-1 active:bg-gray-300"
                  >
                    <Text className="text-xs text-gray-800">Annuler</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="flex-row items-center disabled:opacity-50"
                >
                  <Ionicons
                    name="trash-outline"
                    size={14}
                    color="#dc2626"
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-xs text-red-600">Supprimer</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  },
);

ItemCart.displayName = "ItemCart";

export default ItemCart;
