// context/CartContext.js
// Équivalent mobile de CartContext.jsx.
// IMPORTANT : ne charge plus le panier automatiquement à l'apparition de
// la session (changement structurel du web) — c'est Header.js qui doit
// appeler setCartToState() quand la session apparaît.

import { createContext, useCallback, useMemo, useState } from "react";
import { DECREASE, INCREASE } from "../helpers/constants";
import { authenticatedFetch } from "../lib/auth-client";
import { showToast } from "../lib/toast";
import { captureClientError } from "../lib/monitoring";

const CartContext = createContext();

// Cold start Vercel (auth + connexion Mongo) peut dépasser largement 5s
const REQUEST_TIMEOUT = 15000;

async function parseJsonSafely(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await res.json();
  } catch (parseError) {
    console.error(
      "[CartContext] Failed to parse JSON response:",
      parseError.message,
    );
    return null;
  }
}

export const CartProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [error, setError] = useState(null);

  const setCartToState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      let res;
      try {
        res = await authenticatedFetch("/api/v1/cart", {
          method: "GET",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        let errorMessage = data?.message;
        if (!errorMessage) {
          switch (res.status) {
            case 401:
              errorMessage = "Session expirée. Veuillez vous reconnecter";
              break;
            case 404:
              errorMessage = "Service indisponible (route introuvable)";
              break;
            case 429:
              errorMessage = "Trop de tentatives. Réessayez plus tard.";
              break;
            default:
              errorMessage = `Erreur lors de la récupération du panier (${res.status})`;
          }
        }

        const httpError = new Error(`HTTP ${res.status}: ${errorMessage}`);
        captureClientError(
          httpError,
          "CartContext",
          "setCartToState",
          res.status === 401,
        );

        setError(errorMessage);
        return;
      }

      if (!data) {
        setError("Réponse invalide du serveur");
        captureClientError(
          new Error("Réponse invalide du serveur"),
          "CartContext",
          "setCartToState",
          true,
        );
        return;
      }

      if (data.success) {
        remoteDataInState(data);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        setError("La requête a pris trop de temps");
        captureClientError(error, "CartContext", "setCartToState", false);
      } else {
        setError("Problème de connexion. Vérifiez votre connexion.");
        captureClientError(error, "CartContext", "setCartToState", true);
      }
      console.error("Cart retrieval error:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItemToCart = async ({ product, quantity = 1 }) => {
    try {
      if (!product) {
        captureClientError(
          new Error("Produit invalide"),
          "CartContext",
          "addItemToCart",
          false,
        );
        showToast("Produit invalide");
        return;
      }

      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      let res;
      try {
        res = await authenticatedFetch("/api/v1/cart", {
          method: "POST",
          body: JSON.stringify({
            productId: product,
            quantity: parseInt(quantity, 10),
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        let toastMessage = data?.message;
        if (!toastMessage) {
          switch (res.status) {
            case 400:
              toastMessage = "Stock insuffisant";
              break;
            case 401:
              toastMessage = "Veuillez vous connecter";
              break;
            case 404:
              toastMessage = "Service indisponible (route introuvable)";
              break;
            case 409:
              toastMessage = "Produit déjà dans le panier";
              break;
            default:
              toastMessage = `Erreur lors de l'ajout (${res.status})`;
          }
        }

        const httpError = new Error(`HTTP ${res.status}: ${toastMessage}`);
        captureClientError(
          httpError,
          "CartContext",
          "addItemToCart",
          res.status === 401,
        );

        showToast(toastMessage);
        return;
      }

      if (!data) {
        showToast("Réponse invalide du serveur");
        captureClientError(
          new Error("Réponse invalide du serveur"),
          "CartContext",
          "addItemToCart",
          true,
        );
        return;
      }

      if (data.success) {
        await setCartToState();
        showToast("Produit ajouté au panier");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        showToast("La connexion est trop lente");
        captureClientError(error, "CartContext", "addItemToCart", false);
      } else {
        showToast("Problème de connexion");
        captureClientError(error, "CartContext", "addItemToCart", true);
      }
      console.error("Add to cart error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCart = async (product, action) => {
    try {
      if (!product?.id || ![INCREASE, DECREASE].includes(action)) {
        captureClientError(
          new Error("Données invalides pour mise à jour panier"),
          "CartContext",
          "updateCart",
          false,
        );
        showToast("Données invalides");
        return;
      }

      if (action === DECREASE && product.quantity === 1) {
        showToast("Utilisez le bouton Supprimer pour retirer cet article");
        return;
      }

      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      let res;
      try {
        res = await authenticatedFetch("/api/v1/cart", {
          method: "PUT",
          body: JSON.stringify({ product, value: action }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        const errorMessage =
          data?.message ||
          (res.status === 404
            ? "Service indisponible (route introuvable)"
            : `Erreur de mise à jour (${res.status})`);

        const httpError = new Error(`HTTP ${res.status}: ${errorMessage}`);
        captureClientError(
          httpError,
          "CartContext",
          "updateCart",
          res.status === 401,
        );

        showToast(errorMessage);
        return;
      }

      if (!data) {
        showToast("Réponse invalide du serveur");
        captureClientError(
          new Error("Réponse invalide du serveur"),
          "CartContext",
          "updateCart",
          true,
        );
        return;
      }

      if (data.success) {
        await setCartToState();
        showToast(
          action === INCREASE ? "Quantité augmentée" : "Quantité diminuée",
        );
      }
    } catch (error) {
      if (error.name === "AbortError") {
        showToast("La connexion est trop lente");
        captureClientError(error, "CartContext", "updateCart", false);
      } else {
        showToast("Problème de connexion");
        captureClientError(error, "CartContext", "updateCart", true);
      }
      console.error("Update cart error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteItemFromCart = async (id) => {
    try {
      if (!id) {
        captureClientError(
          new Error("ID invalide pour suppression panier"),
          "CartContext",
          "deleteItemFromCart",
          false,
        );
        showToast("ID invalide");
        return;
      }

      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      let res;
      try {
        res = await authenticatedFetch(`/api/v1/cart/${id}`, {
          method: "DELETE",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        const errorMessage =
          data?.message ||
          (res.status === 404
            ? "Article ou service introuvable"
            : `Erreur de suppression (${res.status})`);

        const httpError = new Error(`HTTP ${res.status}: ${errorMessage}`);
        captureClientError(
          httpError,
          "CartContext",
          "deleteItemFromCart",
          [401, 404].includes(res.status),
        );

        showToast(errorMessage);
        return;
      }

      if (!data) {
        showToast("Réponse invalide du serveur");
        captureClientError(
          new Error("Réponse invalide du serveur"),
          "CartContext",
          "deleteItemFromCart",
          true,
        );
        return;
      }

      if (data.success) {
        await setCartToState();
        showToast("Article supprimé");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        showToast("La connexion est trop lente");
        captureClientError(error, "CartContext", "deleteItemFromCart", false);
      } else {
        showToast("Problème de connexion");
        captureClientError(error, "CartContext", "deleteItemFromCart", true);
      }
      console.error("Delete cart item error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const clearCartOnLogout = () => {
    setCart([]);
    setLoading(false);
    setCartCount(0);
    setCartTotal(0);
  };

  const remoteDataInState = (response) => {
    try {
      const normalizedCart =
        response.data.cart?.map((item) => ({
          ...item,
          quantity: parseInt(item.quantity, 10) || 1,
        })) || [];

      setCart(normalizedCart);
      setCartCount(response.data.cartCount || 0);
      setCartTotal(response.data.cartTotal || 0);
    } catch (error) {
      captureClientError(error, "CartContext", "remoteDataInState", true);
      console.error("Error normalizing cart data:", error.message);
      setCart([]);
      setCartCount(0);
      setCartTotal(0);
    }
  };

  const contextValue = useMemo(
    () => ({
      loading,
      cart,
      cartCount,
      cartTotal,
      error,
      setCartToState,
      addItemToCart,
      updateCart,
      deleteItemFromCart,
      clearError,
      clearCartOnLogout,
    }),
    [loading, cart, cartCount, cartTotal, error, setCartToState],
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};

export default CartContext;
