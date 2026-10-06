// components/orders/ListOrders.js
// Équivalent mobile de ListOrders.jsx.
// Filtres : chips défilantes au lieu de <select> (pas d'équivalent natif).
// Pagination : réutilise CustomPagination (auto-géré via les paramètres de
// route), donc currentPage/onPageChange du web ne sont pas nécessaires ici.
// cashCount remplace pendingCashCount (nouveau schéma, cf. route v1).

import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import OrderItem from "./OrderItem";
import CustomPagination from "../layouts/CustomPagination";

const STATUS_FILTERS = [
  { value: "all", label: "Tous les statuts" },
  { value: "paid", label: "Payées" },
  { value: "unpaid", label: "Non payées" },
  { value: "processing", label: "En traitement" },
  { value: "refunded", label: "Remboursées" },
  { value: "failed", label: "Échouées" },
  { value: "cancelled", label: "Annulées" },
  { value: "cash", label: "💰 Paiement espèces" },
];

const SORT_OPTIONS = [
  { value: "desc", label: "Plus récentes" },
  { value: "asc", label: "Plus anciennes" },
];

const Chip = ({ label, selected, onPress }) => (
  <Pressable
    onPress={onPress}
    className={`mr-2 rounded-full border px-3 py-1.5 ${
      selected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
    }`}
  >
    <Text
      className={`text-xs font-medium ${selected ? "text-white" : "text-gray-700"}`}
    >
      {label}
    </Text>
  </Pressable>
);

const StatCard = ({ label, value, className = "" }) => (
  <View className={`flex-1 rounded-md border p-3 ${className}`}>
    <Text className="text-xs text-gray-600">{label}</Text>
    <Text className="text-lg font-bold">{value}</Text>
  </View>
);

const ListOrders = ({ orders }) => {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");

  const hasOrders = useMemo(
    () =>
      orders?.orders &&
      Array.isArray(orders.orders) &&
      orders.orders.length > 0,
    [orders],
  );

  const totalPages = useMemo(
    () =>
      orders?.totalPages && !isNaN(parseInt(orders.totalPages))
        ? parseInt(orders.totalPages)
        : 1,
    [orders],
  );

  const filteredAndSortedOrders = useMemo(() => {
    if (!hasOrders) return [];

    let filtered = [...orders.orders];

    if (filterStatus !== "all") {
      filtered = filtered.filter((order) => {
        if (filterStatus === "paid") return order.paymentStatus === "paid";
        if (filterStatus === "unpaid") return order.paymentStatus === "unpaid";
        if (filterStatus === "processing")
          return order.paymentStatus === "processing";
        if (filterStatus === "refunded")
          return order.paymentStatus === "refunded";
        if (filterStatus === "failed") return order.paymentStatus === "failed";
        if (filterStatus === "cancelled") return !!order.cancelledAt;
        if (filterStatus === "cash")
          return (
            order.paymentInfo?.typePayment === "CASH" ||
            order.paymentInfo?.isCashPayment === true
          );
        return true;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [hasOrders, orders?.orders, filterStatus, sortOrder]);

  return (
    <View>
      <Text className="mb-4 text-xl font-semibold">
        Historique de vos commandes
      </Text>

      {hasOrders && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-2"
          >
            {STATUS_FILTERS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={filterStatus === opt.value}
                onPress={() => setFilterStatus(opt.value)}
              />
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            {SORT_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={sortOrder === opt.value}
                onPress={() => setSortOrder(opt.value)}
              />
            ))}
          </ScrollView>

          <View className="mb-3 flex-row gap-2">
            <StatCard
              label="Total commandes"
              value={orders.count}
              className="border-gray-200 bg-gray-50"
            />
            <StatCard
              label="Payées"
              value={orders.paidCount}
              className="border-green-200 bg-green-50"
            />
          </View>
          <View className="mb-3 flex-row gap-2">
            <StatCard
              label="Non payées"
              value={orders.unpaidCount}
              className="border-red-200 bg-red-50"
            />
            <StatCard
              label="Espèces"
              value={orders.cashCount || 0}
              className="border-emerald-200 bg-emerald-50"
            />
          </View>
          <View className="mb-6">
            <StatCard
              label="Montant total"
              value={`$${orders.totalAmountOrders?.totalAmount?.toFixed(2) || "0.00"}`}
              className="border-purple-200 bg-purple-50"
            />
          </View>
        </>
      )}

      {!hasOrders ? (
        <View className="items-center rounded-lg border border-gray-200 bg-gray-50 p-8">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Ionicons name="bag-outline" size={32} color="#2563eb" />
          </View>
          <Text className="mb-2 text-lg font-semibold">Aucune commande</Text>
          <Text className="mb-4 text-center text-gray-600">
            Vous n&apos;avez pas encore effectué de commande.
          </Text>
          <Pressable
            onPress={() => router.replace("/")}
            className="rounded-md bg-blue-600 px-4 py-2 active:bg-blue-700"
          >
            <Text className="text-white">Découvrir nos produits</Text>
          </Pressable>
        </View>
      ) : filteredAndSortedOrders.length === 0 ? (
        <View className="items-center rounded-md border border-yellow-200 bg-yellow-50 p-6">
          <Text className="text-yellow-800">
            Aucune commande ne correspond à vos filtres.
          </Text>
          <Pressable onPress={() => setFilterStatus("all")} className="mt-3">
            <Text className="text-blue-600 underline">
              Réinitialiser les filtres
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredAndSortedOrders}
            keyExtractor={(order) => order._id}
            renderItem={({ item }) => <OrderItem order={item} />}
            scrollEnabled={false}
          />

          {totalPages > 1 && filterStatus === "all" && (
            <View className="mt-4">
              <CustomPagination totalPages={totalPages} />
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default ListOrders;
