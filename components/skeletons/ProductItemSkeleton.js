// components/skeletons/ProductItemSkeleton.js
import { View } from "react-native";
import Pulse from "./Pulse";

const ProductItemSkeleton = () => (
  <View className="w-full overflow-hidden rounded-lg border border-gray-100 bg-white">
    <Pulse className="h-48 w-full rounded-none" />
    <View className="gap-2 p-4">
      <Pulse className="h-4 w-20 rounded-full" />
      <Pulse className="h-5 w-3/4" />
      <Pulse className="h-6 w-24" />
      <Pulse className="mt-1 h-10 w-full" />
    </View>
  </View>
);

export default ProductItemSkeleton;
