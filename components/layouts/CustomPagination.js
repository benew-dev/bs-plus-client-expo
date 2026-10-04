// components/layouts/CustomPagination.js
// Pagination auto-suffisante : lit/écrit le paramètre "page" de la route
// courante elle-même (router.setParams), pas de props currentPage/onPageChange
// à fournir par le parent.

import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const first = (value) => (Array.isArray(value) ? value[0] : value);

const CustomPagination = ({ totalPages }) => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const currentPage = parseInt(first(params.page) || "1", 10);

  if (!totalPages || totalPages <= 1) return null;

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    router.setParams({ page: String(page) });
  };

  // Fenêtre de pages visibles autour de la page courante
  const pages = [];
  const windowSize = 1;
  for (
    let p = Math.max(1, currentPage - windowSize);
    p <= Math.min(totalPages, currentPage + windowSize);
    p++
  ) {
    pages.push(p);
  }

  return (
    <View className="flex-row items-center justify-center gap-2">
      <Pressable
        onPress={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className={`rounded-md border border-gray-300 p-2 ${currentPage === 1 ? "opacity-40" : "active:bg-gray-50"}`}
      >
        <Ionicons name="chevron-back" size={18} color="#374151" />
      </Pressable>

      {pages[0] > 1 && (
        <>
          <Pressable
            onPress={() => goToPage(1)}
            className="h-9 w-9 items-center justify-center rounded-md border border-gray-300"
          >
            <Text className="text-sm text-gray-700">1</Text>
          </Pressable>
          {pages[0] > 2 && <Text className="text-gray-400">…</Text>}
        </>
      )}

      {pages.map((p) => (
        <Pressable
          key={p}
          onPress={() => goToPage(p)}
          className={`h-9 w-9 items-center justify-center rounded-md border ${
            p === currentPage
              ? "border-blue-600 bg-blue-600"
              : "border-gray-300"
          }`}
        >
          <Text
            className={`text-sm ${p === currentPage ? "font-semibold text-white" : "text-gray-700"}`}
          >
            {p}
          </Text>
        </Pressable>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <Text className="text-gray-400">…</Text>
          )}
          <Pressable
            onPress={() => goToPage(totalPages)}
            className="h-9 w-9 items-center justify-center rounded-md border border-gray-300"
          >
            <Text className="text-sm text-gray-700">{totalPages}</Text>
          </Pressable>
        </>
      )}

      <Pressable
        onPress={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`rounded-md border border-gray-300 p-2 ${currentPage === totalPages ? "opacity-40" : "active:bg-gray-50"}`}
      >
        <Ionicons name="chevron-forward" size={18} color="#374151" />
      </Pressable>
    </View>
  );
};

export default CustomPagination;
