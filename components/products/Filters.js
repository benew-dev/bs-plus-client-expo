// components/products/Filters.js
// Équivalent mobile de Filters.jsx.

import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { isArrayEmpty } from "../../helpers/helpers";
import { showToast } from "../../lib/toast";

const first = (value) => (Array.isArray(value) ? value[0] : value);

const Filters = ({ categories }) => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [min, setMin] = useState(first(params.min) || "");
  const [max, setMax] = useState(first(params.max) || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCategory = first(params.category) || "";

  useEffect(() => {
    setMin(first(params.min) || "");
    setMax(first(params.max) || "");
  }, [params.min, params.max]);

  const hasActiveFilters = useMemo(
    () => min || max || currentCategory,
    [min, max, currentCategory],
  );

  const handleCategoryPress = (categoryId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const newParams = { ...params };
    if (newParams.category === categoryId) {
      delete newParams.category;
    } else {
      newParams.category = categoryId;
    }

    router.push({ pathname: "/shop", params: newParams });
    setIsSubmitting(false);
  };

  const handlePriceFilter = () => {
    if (isSubmitting) return;

    if (min === "" && max === "") {
      showToast("Veuillez renseigner au moins un des deux champs de prix");
      return;
    }

    if (min !== "" && max !== "") {
      const minNum = Number(min);
      const maxNum = Number(max);
      if (isNaN(minNum) || isNaN(maxNum)) {
        showToast("Les valeurs de prix doivent être des nombres valides");
        return;
      }
      if (minNum > maxNum) {
        showToast("Le prix minimum doit être inférieur au prix maximum");
        return;
      }
    }

    setIsSubmitting(true);
    const newParams = { ...params };
    if (min !== "") newParams.min = min;
    else delete newParams.min;
    if (max !== "") newParams.max = max;
    else delete newParams.max;

    router.push({ pathname: "/shop", params: newParams });
    setIsSubmitting(false);
  };

  const resetFilters = () => {
    setMin("");
    setMax("");
    router.push("/shop");
  };

  return (
    <View className="gap-4">
      {hasActiveFilters && (
        <Pressable onPress={resetFilters} className="self-end">
          <Text className="text-sm text-blue-600">Réinitialiser</Text>
        </Pressable>
      )}

      {/* Prix */}
      <View className="rounded-lg border border-gray-200 bg-white p-4">
        <Text className="mb-3 font-semibold text-gray-700">Prix (Fdj)</Text>
        <View className="mb-3 flex-row gap-2">
          <View className="flex-1">
            <Text className="mb-1 text-xs text-gray-500">Min</Text>
            <TextInput
              className="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-900"
              placeholder="Min"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={min}
              onChangeText={setMin}
              editable={!isSubmitting}
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs text-gray-500">Max</Text>
            <TextInput
              className="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-900"
              placeholder="Max"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={max}
              onChangeText={setMax}
              editable={!isSubmitting}
            />
          </View>
        </View>

        <Pressable
          onPress={handlePriceFilter}
          disabled={isSubmitting}
          className={`items-center rounded-md py-2.5 ${isSubmitting ? "bg-blue-400" : "bg-blue-600 active:bg-blue-700"}`}
        >
          <Text className="font-medium text-white">Appliquer</Text>
        </Pressable>
      </View>

      {/* Catégories */}
      <View className="rounded-lg border border-gray-200 bg-white p-4">
        <Text className="mb-3 font-semibold text-gray-700">Catégories</Text>

        {isArrayEmpty(categories) ? (
          <Text className="py-2 text-center text-gray-500">
            Aucune catégorie disponible
          </Text>
        ) : (
          <View className="gap-1">
            {categories.map((category) => (
              <Pressable
                key={category?._id}
                onPress={() => handleCategoryPress(category?._id)}
                disabled={isSubmitting}
                className={`rounded-md p-2 ${currentCategory === category?._id ? "bg-blue-100" : "active:bg-gray-100"}`}
              >
                <Text
                  className={
                    currentCategory === category?._id
                      ? "text-blue-700"
                      : "text-gray-700"
                  }
                >
                  {category?.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default Filters;
