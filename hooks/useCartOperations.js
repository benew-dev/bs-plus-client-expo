// hooks/useCartOperations.js
// Équivalent mobile de useCartOperations.js.
// NOTE (fidèle au web) : checkoutHandler référence saveOnCheckout, absent
// de CartContext — code mort, jamais appelé par l'écran panier actuel
// (CartSummary navigue directement vers /payment via un lien).

import { useContext, useState } from "react";
import { captureClientError } from "../lib/monitoring";
import CartContext from "../context/CartContext";
import { DECREASE, INCREASE } from "../helpers/constants";

const useCartOperations = () => {
  const { updateCart, deleteItemFromCart, saveOnCheckout, cartTotal } =
    useContext(CartContext);

  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [itemBeingRemoved, setItemBeingRemoved] = useState(null);

  const increaseQty = async (cartItem) => {
    try {
      await updateCart(cartItem, INCREASE);
    } catch (error) {
      console.error("Erreur lors de l'augmentation de la quantité:", error);
      captureClientError(error, "Cart", "increaseQty", false);
    }
  };

  const decreaseQty = async (cartItem) => {
    try {
      await updateCart(cartItem, DECREASE);
    } catch (error) {
      console.error("Erreur lors de la diminution de la quantité:", error);
      captureClientError(error, "Cart", "decreaseQty", false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      setDeleteInProgress(true);
      setItemBeingRemoved(itemId);
      await deleteItemFromCart(itemId);
    } catch (error) {
      console.error("Erreur lors de la suppression d'un article:", error);
      captureClientError(error, "Cart", "deleteItem", false);
    } finally {
      setDeleteInProgress(false);
      setItemBeingRemoved(null);
    }
  };

  // Jamais appelé dans le flux actuel (voir note en tête de fichier)
  const checkoutHandler = () => {
    const checkoutData = {
      amount: cartTotal.toFixed(2),
      tax: 0,
      totalAmount: cartTotal.toFixed(2),
    };
    saveOnCheckout(checkoutData);
  };

  return {
    deleteInProgress,
    itemBeingRemoved,
    increaseQty,
    decreaseQty,
    handleDeleteItem,
    checkoutHandler,
  };
};

export default useCartOperations;
