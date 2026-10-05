// app/cart.js
// Équivalent mobile de app/cart/page.jsx.

import { useEffect } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../lib/auth-client";
import Cart from "../components/cart/Cart";
import CartSkeleton from "../components/skeletons/CartSkeleton";

export default function CartScreen() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace({ pathname: "/login", params: { callbackUrl: "/cart" } });
    }
  }, [isPending, session?.user, router]);

  if (isPending) {
    return <CartSkeleton />;
  }

  if (!session?.user) {
    // Redirection en cours (useEffect ci-dessus)
    return null;
  }

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="flex-1 bg-gray-50"
    >
      <Cart />
    </SafeAreaView>
  );
}
