// components/payment/Payment.js
// Équivalent mobile de Payment.jsx.
// CASH est géré en court-circuit avant toute validation de compte, comme
// sur le web — plus de détection isCashPayment, uniquement
// selectedPayment.platform === "CASH".

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CartContext from "../../context/CartContext";
import OrderContext from "../../context/OrderContext";
import { isArrayEmpty } from "../../helpers/helpers";
import { formatPrice } from "../../lib/format";
import { validateDjiboutiPayment } from "../../helpers/validation/schemas/payment";
import { showToast } from "../../lib/toast";
import { captureClientError } from "../../lib/monitoring";
import BreadCrumbs from "../layouts/BreadCrumbs";
import ItemShipping from "./ItemShipping";
import PaymentMethodCard from "./PaymentMethodCard";
import NoPaymentMethodsFound from "./NoPaymentMethodsFound";
import PaymentPageSkeleton from "../skeletons/PaymentPageSkeleton";

const Payment = ({ paymentTypes }) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [dataInitialized, setDataInitialized] = useState(false);

  const submitAttempts = useRef(0);

  const { cart, cartTotal, cartCount } = useContext(CartContext);
  const { orderInfo, setOrderInfo, setPaymentTypes, error, clearErrors } =
    useContext(OrderContext);

  const totalAmount = useMemo(
    () => Number((cartTotal || 0).toFixed(2)),
    [cartTotal],
  );

  const breadCrumbs = useMemo(
    () => [
      { name: "Accueil", url: "/" },
      { name: "Panier", url: "/cart" },
      { name: "Paiement", url: "/payment" },
    ],
    [],
  );

  const prepareOrderItems = useCallback(() => {
    if (!Array.isArray(cart)) return [];
    return cart.map((item) => ({
      cartId: item?.id,
      product: item?.productId,
      name: item?.productName || "Produit sans nom",
      category: "Non catégorisé",
      quantity: item?.quantity || 1,
      price: item?.price,
      image: item?.imageUrl || "",
      subtotal: Number(item?.subtotal),
    }));
  }, [cart]);

  useEffect(() => {
    const initializePaymentPage = async () => {
      try {
        setIsLoading(true);

        const orderItems = prepareOrderItems();
        setOrderInfo({ orderItems });

        if (!cartTotal || cartTotal < 0 || cartCount < 0) {
          showToast("Informations de commande incomplètes");
          router.replace("/cart");
          return;
        }

        if (isArrayEmpty(paymentTypes)) {
          showToast("Aucun moyen de paiement n'est disponible actuellement");
        }

        setDataInitialized(true);
      } catch (error) {
        console.error(
          "Erreur lors de l'initialisation de la page de paiement:",
          error,
        );
        captureClientError(error, "Payment", "initializePaymentPage", true);
        showToast(
          "Une erreur est survenue lors du chargement des options de paiement",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (!dataInitialized) {
      initializePaymentPage();
    }
  }, [
    paymentTypes,
    dataInitialized,
    cartTotal,
    cartCount,
    router,
    setOrderInfo,
  ]);

  useEffect(() => {
    if (error) {
      showToast(error);
      clearErrors();
    }
  }, [error, clearErrors]);

  const handlePaymentChange = useCallback(
    (payment) => setSelectedPayment(payment),
    [],
  );

  const handleAccountNumberChange = useCallback((text) => {
    setAccountNumber(text.replace(/[^\d]/g, ""));
  }, []);

  const mapToPaymentSchema = (platform, name, number) => ({
    paymentPlatform: platform?.toLowerCase().replace(/[\s-]/g, "-"),
    accountHolderName: name,
    phoneNumber: number,
  });

  const validatePaymentData = async () => {
    if (!selectedPayment || !accountName || !accountNumber) {
      return {
        isValid: false,
        errors: { general: "Tous les champs sont requis" },
      };
    }

    const nameWords = accountName.trim().split(/\s+/);
    if (nameWords.length < 2 || nameWords.some((w) => w.length < 2)) {
      return {
        isValid: false,
        errors: { accountName: "Prénom et nom complets requis" },
      };
    }

    const cleanNumber = accountNumber.replace(/\D/g, "");
    let validationPassed = false;

    if (cleanNumber.match(/^77[0-9]{6}$/)) {
      const paymentData = mapToPaymentSchema(
        selectedPayment.platform,
        accountName,
        cleanNumber,
      );
      const validationResult = await validateDjiboutiPayment(paymentData);

      if (!validationResult.isValid) {
        Object.values(validationResult.errors).forEach((msg) => showToast(msg));
        setIsSubmitting(false);
        submitAttempts.current = 0;
        return;
      }
      validationPassed = true;
    } else {
      if (cleanNumber.length < 4 || cleanNumber.length > 30) {
        showToast("Le numéro de compte doit contenir entre 4 et 30 chiffres");
        setIsSubmitting(false);
        submitAttempts.current = 0;
        return;
      }

      if (/^0+$/.test(cleanNumber) || /^(\d)\1+$/.test(cleanNumber)) {
        showToast("Numéro de compte invalide");
        setIsSubmitting(false);
        submitAttempts.current = 0;
        return;
      }

      const words = accountName.trim().split(/\s+/);
      if (words.length < 2 || words.some((w) => w.length < 2)) {
        showToast("Veuillez saisir votre prénom et nom complets");
        setIsSubmitting(false);
        submitAttempts.current = 0;
        return;
      }

      validationPassed = true;
    }

    if (!validationPassed) {
      showToast("Validation échouée");
      setIsSubmitting(false);
      submitAttempts.current = 0;
      return;
    }

    return { isValid: true, data: { accountName, accountNumber: cleanNumber } };
  };

  const handlePayment = useCallback(async () => {
    submitAttempts.current += 1;
    if (submitAttempts.current > 1) {
      setTimeout(() => {
        submitAttempts.current = 0;
      }, 5000);
      showToast("Traitement en cours, veuillez patienter...");
      return;
    }

    try {
      setIsSubmitting(true);

      if (!selectedPayment) {
        showToast("Veuillez sélectionner une méthode de paiement");
        setIsSubmitting(false);
        submitAttempts.current = 0;
        return;
      }

      // Court-circuit CASH : pas de validation de compte requise
      if (selectedPayment.platform === "CASH") {
        const paymentInfo = {
          typePayment: "CASH",
          paymentAccountNumber: "N/A",
          paymentAccountName: "Paiement en espèces",
          paymentDate: new Date().toISOString(),
          isCashPayment: true,
          cashPaymentNote:
            "Le paiement sera effectué en espèces à la livraison",
        };

        const finalOrderInfo = { ...orderInfo, paymentInfo, totalAmount };

        setOrderInfo(finalOrderInfo);
        router.replace("/review-order");

        setSelectedPayment(null);
        setAccountName("");
        setAccountNumber("");

        setIsSubmitting(false);
        submitAttempts.current = 0;
        return;
      }

      const validationResult = await validatePaymentData();
      if (!validationResult || !validationResult.isValid) {
        Object.values(validationResult?.errors || {}).forEach((msg) =>
          showToast(msg),
        );
        setIsSubmitting(false);
        submitAttempts.current = 0;
        return;
      }

      const paymentInfo = {
        typePayment: selectedPayment.platform,
        paymentAccountNumber: accountNumber,
        paymentAccountName: accountName,
        paymentDate: new Date().toISOString(),
        isCashPayment: false,
      };

      const finalOrderInfo = { ...orderInfo, paymentInfo, totalAmount };

      setPaymentTypes(paymentTypes);
      setOrderInfo(finalOrderInfo);
      router.replace("/review-order");

      setSelectedPayment(null);
      setAccountName("");
      setAccountNumber("");
    } catch (error) {
      console.error("Erreur lors du traitement du paiement:", error);
      captureClientError(error, "Payment", "handlePayment", true);
      showToast(
        error.message ||
          "Une erreur est survenue lors du traitement du paiement",
      );
    } finally {
      setIsSubmitting(false);
      submitAttempts.current = 0;
    }
  }, [
    selectedPayment,
    accountName,
    accountNumber,
    totalAmount,
    orderInfo,
    setOrderInfo,
    setPaymentTypes,
    paymentTypes,
    router,
  ]);

  if (isLoading) {
    return <PaymentPageSkeleton />;
  }

  if (!cart || !Array.isArray(cart) || cartCount === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6 py-16">
        <View className="mb-6 rounded-full bg-blue-50 p-6">
          <Ionicons name="cart-outline" size={56} color="#2563eb" />
        </View>
        <Text className="mb-3 text-xl font-semibold text-gray-800">
          Votre panier est vide
        </Text>
        <Text className="mb-6 text-center text-gray-600">
          Vous devez ajouter des produits à votre panier avant de procéder au
          paiement.
        </Text>
        <Pressable
          onPress={() => router.replace("/")}
          className="rounded-md bg-blue-600 px-6 py-3 active:bg-blue-700"
        >
          <Text className="font-semibold text-white">
            Découvrir nos produits
          </Text>
        </Pressable>
      </View>
    );
  }

  const isCashSelected = selectedPayment?.platform === "CASH";

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      keyboardShouldPersistTaps="handled"
    >
      <BreadCrumbs breadCrumbs={breadCrumbs} />

      <View className="p-4">
        <View className="mb-4 rounded-lg bg-white p-6">
          <Text className="mb-6 border-b border-gray-200 pb-2 text-xl font-semibold">
            Choisissez votre moyen de paiement
          </Text>

          {isArrayEmpty(paymentTypes) ? (
            <NoPaymentMethodsFound />
          ) : (
            <View className="gap-3">
              {paymentTypes.map((payment) => (
                <PaymentMethodCard
                  key={payment?._id}
                  payment={payment}
                  isSelected={selectedPayment?._id === payment?._id}
                  onSelect={handlePaymentChange}
                />
              ))}
            </View>
          )}

          <View className="mt-8 flex-row rounded-lg bg-blue-50 p-4">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#1d4ed8"
            />
            <Text className="ml-2 flex-1 text-sm text-blue-700">
              Cette transaction est sécurisée. Vos informations de paiement ne
              sont pas stockées et sont transmises de manière cryptée.
            </Text>
          </View>
        </View>

        <View className="rounded-lg bg-white p-6">
          <Text className="mb-6 border-b border-gray-200 pb-2 text-lg font-semibold">
            Finaliser votre paiement
          </Text>

          {!isCashSelected ? (
            <View className="mb-6 gap-4">
              <View>
                <Text className="mb-1 text-sm font-medium text-gray-700">
                  Nom sur le compte <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900"
                  placeholder="Nom complet sur le compte"
                  placeholderTextColor="#9ca3af"
                  value={accountName}
                  onChangeText={setAccountName}
                  accessibilityLabel="Nom sur le compte"
                />
              </View>

              <View>
                <Text className="mb-1 text-sm font-medium text-gray-700">
                  Numéro de compte <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900"
                  placeholder="Numéro de compte (chiffres uniquement)"
                  placeholderTextColor="#9ca3af"
                  value={accountNumber}
                  onChangeText={handleAccountNumberChange}
                  keyboardType="numeric"
                  maxLength={30}
                  accessibilityLabel="Numéro de compte"
                />
                <Text className="mt-1 text-xs text-gray-500">
                  Saisissez uniquement les chiffres, minimum 4 caractères
                </Text>
              </View>
            </View>
          ) : (
            <View className="mb-6 flex-row rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <Ionicons name="cash-outline" size={20} color="#059669" />
              <View className="ml-3 flex-1">
                <Text className="mb-1 font-semibold text-emerald-900">
                  Paiement en espèces
                </Text>
                <Text className="text-sm text-emerald-700">
                  Vous paierez en espèces au moment de la livraison de votre
                  commande.
                </Text>
              </View>
            </View>
          )}

          <View className="mb-6 flex-row justify-between border-t border-gray-200 pt-3">
            <Text className="text-lg font-bold text-gray-800">
              Total à payer :
            </Text>
            <Text className="text-lg font-bold text-blue-600">
              {formatPrice(totalAmount)}
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.push("/cart")}
              className="rounded-md border border-gray-300 bg-white px-4 py-3 active:bg-gray-50"
            >
              <Text className="text-gray-700">Retour</Text>
            </Pressable>

            <Pressable
              onPress={handlePayment}
              disabled={isSubmitting}
              className={`flex-1 flex-row items-center justify-center rounded-md px-5 py-3 ${
                isSubmitting
                  ? "bg-gray-400"
                  : "bg-green-600 active:bg-green-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="ml-2 text-white">Traitement...</Text>
                </>
              ) : (
                <Text className="font-medium text-white">Payer</Text>
              )}
            </Pressable>
          </View>

          <View className="mt-4 border-t border-gray-200 pt-4">
            <Text className="mb-3 font-medium text-gray-800">
              Produits ({Array.isArray(cart) ? cartCount : 0})
            </Text>

            {Array.isArray(cart) && cartCount > 0 ? (
              cart.map((item) => (
                <ItemShipping key={item.id || item._id} item={item} />
              ))
            ) : (
              <Text className="py-2 text-sm italic text-gray-500">
                Aucun produit dans votre panier
              </Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default Payment;
