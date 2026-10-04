// components/skeletons/ProductDetailsSkeleton.js
import { View } from "react-native";
import Pulse from "./Pulse";

const ProductDetailsSkeleton = () => (
  <View className="p-4">
    <Pulse className="mb-4 h-8 w-2/3" />
    <Pulse className="mb-6 h-72 w-full rounded-lg" />
    <View className="mb-4 flex-row gap-2">
      {[...Array(4)].map((_, i) => (
        <Pulse key={i} className="h-16 w-16 rounded-md" />
      ))}
    </View>
    <Pulse className="mb-2 h-7 w-1/3" />
    <Pulse className="mb-4 h-5 w-1/4" />
    <View className="gap-2">
      <Pulse className="h-4 w-full" />
      <Pulse className="h-4 w-full" />
      <Pulse className="h-4 w-2/3" />
    </View>
    <Pulse className="mt-6 h-12 w-full rounded-lg" />
  </View>
);

export default ProductDetailsSkeleton;
