// app/payment.js
// Équivalent mobile de app/payment/page.jsx.

import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useSession } from "../lib/auth-client";
import Payment from "../components/payment/Payment";
import PaymentPageSkeleton from "../components/skeletons/PaymentPageSkeleton";
import { showToast } from "../lib/toast";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function PaymentScreen() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [paymentTypes, setPaymentTypes] = useState([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace({
        pathname: "/login",
        params: { callbackUrl: "/payment" },
      });
    }
  }, [isPending, session?.user, router]);

  useEffect(() => {
    if (isPending || !session?.user) return;

    let cancelled = false;

    const load = async () => {
      setLoadingPlatforms(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${API_URL}/api/v1/paymentPlatform`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          if (!cancelled) setPaymentTypes([]);
          return;
        }

        const json = await res.json();
        if (!cancelled) setPaymentTypes(json?.data?.platforms || []);
      } catch (err) {
        if (!cancelled) {
          console.error("Payment platforms fetch error:", err.message);
          showToast(
            "Erreur lors de la récupération des plateformes de paiement",
          );
          setPaymentTypes([]);
        }
      } finally {
        if (!cancelled) setLoadingPlatforms(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isPending, session?.user]);

  if (isPending || loadingPlatforms) {
    return <PaymentPageSkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  return <Payment paymentTypes={paymentTypes} />;
}
