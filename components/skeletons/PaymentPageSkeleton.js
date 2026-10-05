// components/skeletons/PaymentPageSkeleton.js
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Pulse from "./Pulse";

const PaymentPageSkeleton = () => (
  <SafeAreaView
    edges={["bottom", "left", "right"]}
    className="flex-1 bg-gray-50"
  >
    <Pulse className="mb-4 h-12" />
    <View className="p-4">
      <View className="mb-4 rounded-lg bg-white p-6">
        <Pulse className="mb-6 h-7 w-1/2" />
        <View className="gap-4">
          {[...Array(3)].map((_, i) => (
            <Pulse key={i} className="h-20 w-full" />
          ))}
        </View>
      </View>
      <View className="rounded-lg bg-white p-6">
        <Pulse className="mb-4 h-6 w-1/2" />
        {[...Array(2)].map((_, i) => (
          <View key={i} className="mb-4 gap-2">
            <Pulse className="h-4 w-1/4" />
            <Pulse className="h-10 w-full" />
          </View>
        ))}
        <Pulse className="my-4 h-6 w-full" />
        <View className="flex-row gap-3">
          <Pulse className="h-10 w-1/4" />
          <Pulse className="h-10 flex-1" />
        </View>
      </View>
    </View>
  </SafeAreaView>
);

export default PaymentPageSkeleton;
