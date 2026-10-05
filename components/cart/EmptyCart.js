// components/cart/EmptyCart.js
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const EmptyCart = () => {
  const router = useRouter();

  return (
    <View className="items-center px-6 py-12">
      <View className="mb-6 rounded-full bg-gray-100 p-6">
        <Ionicons name="cart-outline" size={56} color="#6b7280" />
      </View>
      <Text className="mb-3 text-xl font-semibold text-gray-800">
        Votre panier est vide
      </Text>
      <Text className="mb-6 text-center text-gray-600">
        Il semble que vous n&apos;ayez pas encore ajouté d&apos;articles à votre
        panier.
      </Text>
      <Pressable
        onPress={() => router.replace("/")}
        className="rounded-md bg-blue-600 px-6 py-3 active:bg-blue-700"
      >
        <Text className="font-semibold text-white">Découvrir nos produits</Text>
      </Pressable>
    </View>
  );
};

export default EmptyCart;
