// components/cart/Cart.js
// Équivalent mobile de Cart.jsx.
// Comme sur le web, cet écran charge le panier lui-même au montage
// (indépendamment du Header, qui le fait déjà à l'apparition de la
// session) — garantit des données fraîches à chaque visite de l'écran.

import { useContext, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import CartContext from "../../context/CartContext";
import useCartOperations from "../../hooks/useCartOperations";
import { showToast } from "../../lib/toast";
import CartItemSkeleton from "../skeletons/CartItemSkeleton";
import CartSkeleton from "../skeletons/CartSkeleton";
import EmptyCart from "./EmptyCart";
import CartSummary from "./CartSummary";
import ItemCart from "./ItemCart";
import ConditionalFooter from "../layouts/ConditionalFooter";

const Cart = () => {
  const {
    loading,
    cart,
    cartCount,
    setCartToState,
    cartTotal,
    error,
    clearError,
  } = useContext(CartContext);

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const isLoadingCartRef = useRef(false);

  const {
    deleteInProgress,
    itemBeingRemoved,
    increaseQty,
    decreaseQty,
    handleDeleteItem,
  } = useCartOperations();

  useEffect(() => {
    if (error) {
      clearError();
      showToast("Une erreur est survenue lors du chargement du panier.");
    }
  }, [error, clearError]);

  useEffect(() => {
    let isMounted = true;

    const loadCart = async () => {
      if (isLoadingCartRef.current || !isMounted) return;

      try {
        isLoadingCartRef.current = true;
        await setCartToState();
      } catch (error) {
        console.error("Erreur lors du chargement du panier:", error);
        showToast("Impossible de charger votre panier. Veuillez réessayer.");
      } finally {
        if (isMounted) {
          isLoadingCartRef.current = false;
          setInitialLoadComplete(true);
        }
      }
    };

    if (!initialLoadComplete && !isLoadingCartRef.current) {
      loadCart();
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCartToState, initialLoadComplete]);

  if (!initialLoadComplete) {
    return <CartSkeleton />;
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* En-tête */}
      <View className="bg-blue-50 px-4 py-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-semibold text-gray-800">
            Mon Panier
          </Text>
          <View className="rounded-full bg-blue-100 px-3 py-1">
            <Text className="text-sm font-medium text-blue-800">
              {cartCount || 0} produit{cartCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </View>

      <View className="p-4">
        {!loading && cart?.length === 0 ? (
          <EmptyCart />
        ) : (
          <View className="gap-4">
            <View className="rounded-lg bg-white p-4">
              {loading
                ? [...Array(3)].map((_, index) => (
                    <CartItemSkeleton key={index} />
                  ))
                : cart?.map((cartItem) => (
                    <ItemCart
                      key={cartItem.id}
                      cartItem={cartItem}
                      deleteItemFromCart={handleDeleteItem}
                      decreaseQty={decreaseQty}
                      increaseQty={increaseQty}
                      deleteInProgress={deleteInProgress}
                    />
                  ))}
            </View>

            {cart?.length > 0 && (
              <CartSummary cartItems={cart} amount={cartTotal} />
            )}
          </View>
        )}
      </View>

      <ConditionalFooter />
    </ScrollView>
  );
};

export default Cart;
