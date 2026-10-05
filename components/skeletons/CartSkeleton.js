// components/skeletons/CartSkeleton.js
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Pulse from "./Pulse";
import CartItemSkeleton from "./CartItemSkeleton";

const CartSkeleton = () => (
  <SafeAreaView
    edges={["bottom", "left", "right"]}
    className="flex-1 bg-gray-50"
  >
    <View className="bg-blue-50 px-4 py-5">
      <View className="flex-row items-center justify-between">
        <Pulse className="h-7 w-32" />
        <Pulse className="h-6 w-20 rounded-full" />
      </View>
    </View>

    <View className="p-4">
      <View className="mb-4 rounded-lg bg-white p-4">
        {[...Array(3)].map((_, index) => (
          <CartItemSkeleton key={index} />
        ))}
      </View>

      <View className="rounded-lg border border-gray-200 bg-white p-4">
        <Pulse className="mb-4 h-6 w-32" />
        <View className="mb-5 gap-3">
          <View className="flex-row justify-between">
            <Pulse className="h-4 w-32" />
            <Pulse className="h-4 w-10" />
          </View>
          <View className="flex-row justify-between border-t border-gray-200 pt-4">
            <Pulse className="h-6 w-16" />
            <Pulse className="h-6 w-24" />
          </View>
        </View>
        <View className="gap-3">
          <Pulse className="h-12 w-full" />
          <Pulse className="h-12 w-full" />
        </View>
      </View>
    </View>
  </SafeAreaView>
);

export default CartSkeleton;
