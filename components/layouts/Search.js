// components/layouts/Search.js
// Équivalent mobile de Search.jsx.

import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { showToast } from "../../lib/toast";

const first = (value) => (Array.isArray(value) ? value[0] : value);

const Search = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [keyword, setKeyword] = useState(first(params.keyword) || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasActiveSearch = !!first(params.keyword);

  const submitHandler = () => {
    if (isSubmitting) return;

    if (!keyword || keyword.trim() === "") {
      showToast("Veuillez entrer un terme de recherche");
      return;
    }

    setIsSubmitting(true);
    router.push({ pathname: "/shop", params: { keyword: keyword.trim() } });
    setIsSubmitting(false);
  };

  // Revient à l'état normal (tous les produits), sans aucun filtre
  const clearSearch = () => {
    setKeyword("");
    router.push("/shop");
  };

  return (
    <View className="flex-row items-center">
      <View className="relative mr-2 flex-1">
        <TextInput
          className="rounded-md border border-gray-200 bg-gray-100 py-2 pl-3 pr-9 text-gray-900"
          placeholder="Rechercher..."
          placeholderTextColor="#9ca3af"
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={submitHandler}
          returnKeyType="search"
          editable={!isSubmitting}
          accessibilityLabel="Terme de recherche"
        />

        {(keyword.length > 0 || hasActiveSearch) && (
          <Pressable
            onPress={clearSearch}
            className="absolute right-2 top-0 h-full items-center justify-center px-1"
            accessibilityLabel="Effacer la recherche et afficher tous les produits"
          >
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={submitHandler}
        disabled={isSubmitting}
        className={`items-center justify-center rounded-md p-2.5 ${isSubmitting ? "bg-blue-400" : "bg-blue-600 active:bg-blue-700"}`}
        accessibilityLabel="Lancer la recherche"
      >
        <Ionicons name="search" size={20} color="#ffffff" />
      </Pressable>
    </View>
  );
};

export default Search;
