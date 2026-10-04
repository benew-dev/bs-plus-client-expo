// components/skeletons/ListProductsSkeleton.js
import { View } from "react-native";
import Pulse from "./Pulse";
import ProductItemSkeleton from "./ProductItemSkeleton";

const ListProductsSkeleton = () => (
  <View className="p-4">
    <Pulse className="mb-4 h-6 w-40" />
    <View className="gap-4">
      {[...Array(4)].map((_, i) => (
        <ProductItemSkeleton key={i} />
      ))}
    </View>
  </View>
);

export default ListProductsSkeleton;
