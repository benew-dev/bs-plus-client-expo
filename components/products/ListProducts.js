// components/products/ListProducts.js
// Équivalent mobile de ListProducts.jsx.
// FlatList en grille (2 colonnes) comme conteneur de défilement principal,
// avec recherche/filtres/titre en ListHeaderComponent et pagination+footer
// en ListFooterComponent (pour éviter d'imbriquer un ScrollView dans une
// liste, source d'avertissements React Native).

import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { isArrayEmpty } from "../../helpers/helpers";
import ProductItem from "./ProductItem";
import ProductItemSkeleton from "../skeletons/ProductItemSkeleton";
import Filters from "./Filters";
import Search from "../layouts/Search";
import CustomPagination from "../layouts/CustomPagination";
import ConditionalFooter from "../layouts/ConditionalFooter";

const ListProducts = ({ data, categories, loading, searchParams }) => {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  const keyword = searchParams?.keyword;
  const category = searchParams?.category;
  const minPrice = searchParams?.min;
  const maxPrice = searchParams?.max;
  const page = searchParams?.page;

  const filterSummary = useMemo(() => {
    const summary = [];
    if (keyword) summary.push(`Recherche: "${keyword}"`);
    if (category) {
      const categoryName = categories?.find((c) => c._id === category)?.name;
      if (categoryName) summary.push(`Catégorie: ${categoryName}`);
    }
    if (minPrice && maxPrice)
      summary.push(`Prix: ${minPrice} - ${maxPrice} Fdj`);
    else if (minPrice) summary.push(`Prix min: ${minPrice} Fdj`);
    else if (maxPrice) summary.push(`Prix max: ${maxPrice} Fdj`);
    if (page) summary.push(`Page: ${page}`);
    return summary.length > 0 ? summary.join(" | ") : null;
  }, [keyword, category, minPrice, maxPrice, page, categories]);

  const hasValidData = data && typeof data === "object";
  const hasValidCategories = categories && Array.isArray(categories);

  if (!hasValidData) {
    return (
      <View className="m-4 rounded-md border border-yellow-200 bg-yellow-50 p-4">
        <Text className="font-medium text-yellow-700">
          Les données des produits ne sont pas disponibles pour le moment.
        </Text>
      </View>
    );
  }

  const products = data?.products || [];
  const isEmpty = isArrayEmpty(products);

  const Header = (
    <View className="p-4 pb-0">
      <View className="mb-4 flex-row items-center gap-2">
        <Pressable
          onPress={() => setShowFilters((v) => !v)}
          className="rounded-md border border-gray-200 bg-white p-2.5 shadow-sm active:bg-gray-50"
          accessibilityLabel="Afficher/Masquer les filtres"
          accessibilityState={{ expanded: showFilters }}
        >
          <Ionicons name="options-outline" size={20} color="#374151" />
        </Pressable>
        <View className="flex-1">
          <Search />
        </View>
      </View>

      {showFilters && (
        <View className="mb-4">
          {hasValidCategories ? (
            <Filters categories={categories} />
          ) : (
            <View className="rounded-md bg-gray-100 p-4">
              <Text>Chargement des filtres...</Text>
            </View>
          )}
        </View>
      )}

      {filterSummary && (
        <View className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <Text className="text-sm font-medium text-blue-800">
            {filterSummary}
          </Text>
        </View>
      )}

      <Text className="mb-4 text-xl font-bold text-gray-800">
        {products.length > 0
          ? `${products.length} produit${products.length > 1 ? "s" : ""} trouvé${products.length > 1 ? "s" : ""}`
          : "Produits"}
      </Text>

      {loading && (
        <View className="mb-4 gap-4">
          {[...Array(2)].map((_, i) => (
            <ProductItemSkeleton key={i} />
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return <View>{Header}</View>;
  }

  if (isEmpty) {
    return (
      <View>
        {Header}
        <View className="items-center px-6 py-10">
          <Ionicons name="search-outline" size={48} color="#d1d5db" />
          <Text className="mb-2 mt-4 text-xl font-semibold text-gray-800">
            Aucun produit trouvé
          </Text>
          <Text className="text-center text-gray-600">
            {keyword
              ? `Aucun résultat pour "${keyword}". Essayez d'autres termes de recherche.`
              : "Aucun produit ne correspond aux filtres sélectionnés. Essayez de modifier vos critères."}
          </Text>
          <Pressable
            onPress={() => router.push("/shop")}
            className="mt-6 rounded-md bg-blue-600 px-4 py-2 active:bg-blue-700"
          >
            <Text className="text-white">Voir tous les produits</Text>
          </Pressable>
        </View>
        <ConditionalFooter />
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item, index) => item?._id || `product-${index}`}
      numColumns={2}
      contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}
      ListHeaderComponent={Header}
      renderItem={({ item }) => (
        <View style={{ width: "50%", padding: 4 }}>
          <ProductItem product={item} />
        </View>
      )}
      ListFooterComponent={
        <View>
          {data?.totalPages > 1 && (
            <View className="mt-4">
              <CustomPagination totalPages={data.totalPages} />
            </View>
          )}
          <View className="mt-6">
            <ConditionalFooter />
          </View>
        </View>
      }
    />
  );
};

export default ListProducts;
