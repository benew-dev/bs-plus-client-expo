// components/skeletons/FavoritesSkeleton.js
import { View } from "react-native";
import Pulse from "./Pulse";

const FavoriteCardSkeleton = () => (
  <View className="flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white">
    <Pulse className="h-40 w-full rounded-none" />
    <View className="gap-2 p-3">
      <Pulse className="h-4 w-full" />
      <Pulse className="h-3 w-2/3" />
      <View className="flex-row gap-2 pt-1">
        <Pulse className="h-9 flex-1" />
        <Pulse className="h-9 w-9" />
      </View>
    </View>
  </View>
);

const FavoritesSkeleton = () => (
  <View className="p-4">
    <View className="mb-4 flex-row items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <Pulse className="h-12 w-12 rounded-full" />
      <View className="flex-1 gap-2">
        <Pulse className="h-5 w-1/3" />
        <Pulse className="h-3 w-1/5" />
      </View>
    </View>

    <View className="flex-row flex-wrap gap-3">
      {[...Array(4)].map((_, i) => (
        <View key={i} style={{ width: "48%" }}>
          <FavoriteCardSkeleton />
        </View>
      ))}
    </View>
  </View>
);

export default FavoritesSkeleton;
