// context/OrderContext.js
// Équivalent mobile de OrderContext.jsx.
// NOTE (fidèle au web) : safeSetPaymentTypes est défini dans le fichier
// source mais jamais branché au contexte — c'est le setPaymentTypes brut
// qui est exposé. Code mort côté web, reproduit tel quel ici (pas corrigé
// sans ton accord).

import { createContext, useState } from "react";
import { useRouter } from "expo-router";
import { captureClientError } from "../lib/monitoring";
import { authenticatedFetch } from "../lib/auth-client";

const OrderContext = createContext();

async function parseJsonSafely(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await res.json();
  } catch (parseError) {
    console.error(
      "[OrderContext] Failed to parse JSON response:",
      parseError.message,
    );
    return null;
  }
}

export const OrderProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const [updated, setUpdated] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState(null);

  const [paymentTypes, setPaymentTypes] = useState([]);
  const [orderInfo, setOrderInfo] = useState(null);

  const router = useRouter();

  const addOrder = async (orderInfoToSend) => {
    try {
      setError(null);
      setUpdated(true);
      setLowStockProducts(null);

      if (!orderInfoToSend) {
        captureClientError(
          new Error("Données de commande manquantes"),
          "OrderContext",
          "addOrder",
          false,
        );
        setError("Données de commande manquantes");
        setUpdated(false);
        return;
      }

      if (
        !orderInfoToSend.orderItems ||
        orderInfoToSend.orderItems.length === 0
      ) {
        captureClientError(
          new Error("Panier vide lors de la création de commande"),
          "OrderContext",
          "addOrder",
          false,
        );
        setError("Votre panier est vide");
        setUpdated(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let res;
      try {
        res = await authenticatedFetch("/api/v1/orders/webhook", {
          method: "POST",
          body: JSON.stringify(orderInfoToSend),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        let errorMessage = data?.message || "";

        switch (res.status) {
          case 400:
            errorMessage = errorMessage || "Données de commande invalides";
            break;
          case 401:
            errorMessage = "Session expirée. Veuillez vous reconnecter.";
            setTimeout(() => router.replace("/login"), 2000);
            break;
          case 404:
            errorMessage = errorMessage || "Utilisateur non trouvé";
            setTimeout(() => router.replace("/login"), 2000);
            break;
          case 409:
            if (data?.unavailableProducts) {
              setLowStockProducts(data.unavailableProducts);
              errorMessage = "Produits indisponibles détectés";
              router.push("/error");
            } else {
              errorMessage =
                errorMessage || "Certains produits ne sont plus disponibles";
            }
            break;
          case 429:
            errorMessage =
              errorMessage || "Trop de tentatives. Réessayez plus tard.";
            break;
          default:
            errorMessage =
              errorMessage ||
              `Erreur lors du traitement de la commande (${res.status})`;
        }

        const httpError = new Error(`HTTP ${res.status}: ${errorMessage}`);
        captureClientError(
          httpError,
          "OrderContext",
          "addOrder",
          [401, 404, 409].includes(res.status),
        );

        setError(errorMessage);
        setUpdated(false);
        return;
      }

      if (!data) {
        captureClientError(
          new Error(
            "Réponse invalide du serveur lors de la création de commande",
          ),
          "OrderContext",
          "addOrder",
          true,
        );
        setError("Réponse invalide du serveur. Veuillez réessayer.");
        setUpdated(false);
        return;
      }

      if (data.success && data.id) {
        setOrderId(data.id);
        setError(null);
        // replace (et non push) : review-order reste sinon monté en
        // arrière-plan et réagit au panier qui se vide juste après,
        // redirigeant par-dessus la confirmation (bug déjà vu et corrigé
        // dans le premier projet).
        router.replace("/confirmation");
      } else {
        captureClientError(
          new Error("Réponse API malformée lors de la création de commande"),
          "OrderContext",
          "addOrder",
          true,
        );
        setError("Erreur lors de la création de la commande");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        setError("La requête a pris trop de temps. Veuillez réessayer.");
        captureClientError(error, "OrderContext", "addOrder", true);
      } else {
        setError("Problème de connexion. Vérifiez votre connexion.");
        captureClientError(error, "OrderContext", "addOrder", true);
      }
      console.error("Order creation error:", error.message);
    } finally {
      setUpdated(false);
    }
  };

  const clearErrors = () => setError(null);

  return (
    <OrderContext.Provider
      value={{
        error,
        updated,
        orderId,
        lowStockProducts,
        paymentTypes,
        orderInfo,
        setPaymentTypes,
        setOrderInfo,
        addOrder,
        setUpdated,
        clearErrors,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export default OrderContext;
