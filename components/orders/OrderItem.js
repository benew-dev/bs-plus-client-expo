// components/orders/OrderItem.js
// Équivalent mobile de OrderItem.jsx.
// Simplifié comme le web : plus de style spécial "pending_cash" sur le
// badge de statut, juste un badge ESPÈCES séparé quand isCashPayment.

import { memo, useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import OrderedProduct from "./OrderedProduct";

const formatDate = (dateString, format = "full") => {
  if (!dateString) return "Date non disponible";
  try {
    const date = new Date(dateString);
    if (format === "short") {
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString.substring(0, 10);
  }
};

const STATUS_STYLES = {
  paid: { bg: "bg-green-100", text: "text-green-600" },
  unpaid: { bg: "bg-red-100", text: "text-red-600" },
  processing: { bg: "bg-yellow-100", text: "text-yellow-600" },
  refunded: { bg: "bg-orange-100", text: "text-orange-600" },
  failed: { bg: "bg-gray-100", text: "text-gray-600" },
  default: { bg: "bg-gray-100", text: "text-gray-600" },
};

const getPaymentStatusLabel = (status) => {
  switch (status) {
    case "paid":
      return "PAYÉE";
    case "unpaid":
      return "NON PAYÉE";
    case "processing":
      return "EN TRAITEMENT";
    case "refunded":
      return "REMBOURSÉE";
    case "failed":
      return "ÉCHOUÉE";
    default:
      return status.toUpperCase();
  }
};

const OrderItem = memo(({ order }) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

  if (!order || typeof order !== "object" || !order._id) {
    return null;
  }

  const isCashPayment =
    order.paymentInfo?.typePayment === "CASH" ||
    order.paymentInfo?.isCashPayment === true;

  const orderNumber = order.orderNumber || `ORD-${order._id.substring(0, 8)}`;
  const updatedDate = order.updatedAt ? formatDate(order.updatedAt) : null;
  const paymentStatus = order.paymentStatus || "unpaid";
  const isCancelled = !!order.cancelledAt;
  const totalAmount = order.totalAmount || 0;
  const totalItems =
    order.orderItems?.reduce(
      (total, item) => total + (item.quantity || 0),
      0,
    ) || 0;

  const statusStyle = STATUS_STYLES[paymentStatus] || STATUS_STYLES.default;

  return (
    <View className="mb-5 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <View className="mb-4">
        <View className="mb-2 flex-row items-center">
          <Text className="flex-1 text-lg font-semibold">
            Commande :{" "}
            <Text className="font-mono text-gray-700">{orderNumber}</Text>
          </Text>
          <Pressable
            onPress={toggleExpanded}
            accessibilityLabel={
              expanded ? "Réduire les détails" : "Voir plus de détails"
            }
            className="rounded-full p-1 active:bg-gray-100"
          >
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#374151"
            />
          </Pressable>
        </View>

        <View className="flex-row flex-wrap items-center gap-2">
          <View className={`rounded-full px-2 py-1 ${statusStyle.bg}`}>
            <Text className={`text-xs font-semibold ${statusStyle.text}`}>
              {getPaymentStatusLabel(paymentStatus)}
            </Text>
          </View>

          {isCashPayment && (
            <View className="flex-row items-center rounded-full bg-emerald-100 px-2 py-1">
              <Ionicons name="cash-outline" size={12} color="#047857" />
              <Text className="ml-1 text-xs font-semibold text-emerald-700">
                ESPÈCES
              </Text>
            </View>
          )}

          {isCancelled && (
            <View className="rounded-full bg-gray-100 px-2 py-1">
              <Text className="text-xs font-semibold text-gray-600">
                ANNULÉE
              </Text>
            </View>
          )}

          <Text className="text-sm text-gray-500">
            {formatDate(order.createdAt, "short")}
          </Text>
          <Text className="text-sm text-gray-500">
            • {totalItems} article{totalItems > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      <View className="mb-4 items-end">
        <Text className="text-sm text-gray-600">Montant total</Text>
        <Text className="text-2xl font-bold text-blue-600">
          ${totalAmount.toFixed(2)}
        </Text>
      </View>

      <View className="gap-4">
        <View>
          <Text className="mb-1 text-sm font-medium text-gray-600">Client</Text>
          <Text className="text-sm font-medium text-gray-700">
            {order.user?.name || "Client"}
          </Text>
          {order.user?.phone && (
            <Text className="text-sm text-gray-600">{order.user.phone}</Text>
          )}
          <Text className="text-xs text-gray-600" numberOfLines={1}>
            {order.user?.email || "Email non disponible"}
          </Text>
        </View>

        <View>
          <Text className="mb-1 text-sm font-medium text-gray-600">
            Information de paiement
          </Text>
          {isCashPayment ? (
            <View className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <View className="flex-row items-start">
                <Ionicons name="cash-outline" size={18} color="#059669" />
                <View className="ml-2">
                  <Text className="text-sm font-semibold text-emerald-900">
                    Paiement en espèces
                  </Text>
                  <Text className="mt-0.5 text-xs text-emerald-700">
                    À la livraison
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="gap-1">
              <Text className="text-sm text-gray-700">
                <Text className="text-gray-600">Mode : </Text>
                {order.paymentInfo?.typePayment || "-"}
              </Text>
              <Text className="text-sm text-gray-700">
                <Text className="text-gray-600">Nom : </Text>
                {order.paymentInfo?.paymentAccountName || "-"}
              </Text>
              <Text className="font-mono text-xs text-gray-700">
                <Text className="font-sans text-gray-600">Numéro : </Text>
                {order.paymentInfo?.paymentAccountNumber || "••••••••"}
              </Text>
              {order.paymentInfo?.paymentDate && (
                <Text className="text-xs text-gray-700">
                  <Text className="text-gray-600">Date paiement : </Text>
                  {formatDate(order.paymentInfo.paymentDate, "short")}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {expanded && (
        <>
          <View className="my-4 border-t border-gray-200" />

          {isCashPayment && (
            <View className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <View className="flex-row items-start">
                <View className="rounded-full bg-emerald-100 p-2">
                  <Ionicons name="cash-outline" size={20} color="#059669" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="mb-1 font-semibold text-emerald-900">
                    Paiement en espèces à la livraison
                  </Text>
                  <Text className="text-sm text-emerald-700">
                    Le montant de{" "}
                    <Text className="font-bold">${totalAmount.toFixed(2)}</Text>{" "}
                    sera à régler en espèces au moment de la réception de votre
                    commande.
                  </Text>
                  {order.paymentInfo?.cashPaymentNote && (
                    <Text className="mt-2 text-xs italic text-emerald-600">
                      {order.paymentInfo.cashPaymentNote}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {(order.paidAt || order.cancelledAt || order.updatedAt) && (
            <View className="mb-4 rounded-lg bg-gray-50 p-3">
              <Text className="mb-2 text-sm font-medium text-gray-600">
                Historique de la commande
              </Text>
              <View className="gap-2">
                <View>
                  <Text className="text-sm font-medium text-gray-600">
                    Créée le :
                  </Text>
                  <Text className="text-sm text-gray-700">
                    {formatDate(order.createdAt)}
                  </Text>
                </View>
                {order.paidAt && (
                  <View>
                    <Text className="text-sm font-medium text-green-600">
                      Payée le :
                    </Text>
                    <Text className="text-sm text-gray-700">
                      {formatDate(order.paidAt)}
                    </Text>
                  </View>
                )}
                {order.cancelledAt && (
                  <View>
                    <Text className="text-sm font-medium text-red-600">
                      Annulée le :
                    </Text>
                    <Text className="text-sm text-gray-700">
                      {formatDate(order.cancelledAt)}
                    </Text>
                  </View>
                )}
                {updatedDate && order.updatedAt !== order.createdAt && (
                  <View>
                    <Text className="text-sm font-medium text-gray-600">
                      Dernière mise à jour :
                    </Text>
                    <Text className="text-sm text-gray-700">{updatedDate}</Text>
                  </View>
                )}
              </View>

              {order.cancelReason && (
                <View className="mt-3 rounded bg-red-50 p-2">
                  <Text className="text-sm font-medium text-red-600">
                    Raison d&apos;annulation :
                  </Text>
                  <Text className="mt-1 text-sm text-red-700">
                    {order.cancelReason}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View>
            <Text className="mb-3 font-medium text-gray-600">
              Articles commandés
            </Text>
            <View className="gap-3">
              {order.orderItems &&
              Array.isArray(order.orderItems) &&
              order.orderItems.length > 0 ? (
                order.orderItems.map((item, index) => (
                  <OrderedProduct
                    key={item._id || `item-${index}`}
                    item={item}
                  />
                ))
              ) : (
                <Text className="italic text-gray-500">
                  Aucun article dans cette commande
                </Text>
              )}
            </View>
          </View>
        </>
      )}

      <Pressable
        onPress={toggleExpanded}
        className="mt-4 flex-row items-center justify-center gap-1"
      >
        <Text className="text-sm font-medium text-blue-600">
          {expanded ? "Masquer les détails" : "Afficher les détails"}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color="#2563eb"
        />
      </Pressable>
    </View>
  );
});

OrderItem.displayName = "OrderItem";

export default OrderItem;
