// components/layouts/BreadCrumbs.js
// Équivalent mobile de BreadCrumbs.jsx.

import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { isArrayEmpty } from "../../helpers/helpers";

const BreadCrumbs = ({ breadCrumbs }) => {
  const router = useRouter();

  if (isArrayEmpty(breadCrumbs)) return null;

  return (
    <View className="bg-blue-100 px-4 py-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row items-center">
          {breadCrumbs.map((crumb, index) => (
            <View
              key={`${crumb.url}-${index}`}
              className="flex-row items-center"
            >
              <Pressable onPress={() => router.push(crumb.url)}>
                <Text className="text-sm text-gray-600">{crumb.name}</Text>
              </Pressable>
              {breadCrumbs.length - 1 !== index && (
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="#9ca3af"
                  style={{ marginHorizontal: 6 }}
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default BreadCrumbs;
