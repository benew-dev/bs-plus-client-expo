// components/contact/PublicContact.js
// Équivalent mobile de PublicContact.jsx.
// Accessible sans connexion — AuthContext.sendEmail transmet désormais
// name/email comme attendu (corrigé par rapport au web, voir AuthContext.js).

import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AuthContext from "../../context/AuthContext";
import { showToast } from "../../lib/toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PublicContact = () => {
  const { sendEmail, error, clearErrors } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (error) {
      showToast(error);
      clearErrors();
    }
  }, [error, clearErrors]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis";
    } else if (formData.name.length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = "Email invalide";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Le sujet est requis";
    } else if (formData.subject.length < 5) {
      newErrors.subject = "Le sujet doit contenir au moins 5 caractères";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Le message est requis";
    } else if (formData.message.length < 20) {
      newErrors.message = "Le message doit contenir au moins 20 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await sendEmail({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      if (result?.success) {
        setIsSuccess(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
      }
      // Sinon, l'erreur est déjà affichée via le useEffect qui écoute "error"
    } catch (error) {
      console.error("Error:", error);
      showToast("Impossible d'envoyer le message. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `rounded-lg border px-4 py-3 text-gray-900 ${errors[field] ? "border-red-500" : "border-gray-300"}`;

  if (isSuccess) {
    return (
      <View className="flex-1 items-center justify-center px-6 py-16">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
        </View>
        <Text className="mb-3 text-center text-2xl font-bold text-gray-800">
          Message envoyé !
        </Text>
        <Text className="mb-8 text-center text-gray-600">
          Merci de nous avoir contactés. Notre équipe vous répondra dans les
          plus brefs délais.
        </Text>
        <Pressable
          onPress={() => setIsSuccess(false)}
          className="rounded-lg bg-blue-600 px-6 py-3 active:bg-blue-700"
        >
          <Text className="font-semibold text-white">
            Envoyer un autre message
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-8 items-center">
        <Text className="mb-3 text-center text-3xl font-bold text-gray-800">
          Contactez-nous
        </Text>
        <Text className="text-center text-gray-600">
          Une question ? Un problème ? Notre équipe est là pour vous aider.
          Remplissez le formulaire ci-dessous et nous vous répondrons
          rapidement.
        </Text>
      </View>

      <View className="rounded-2xl bg-white p-6 shadow">
        <View className="gap-5">
          <View>
            <View className="mb-2 flex-row items-center">
              <Ionicons name="person-outline" size={16} color="#2563eb" />
              <Text className="ml-2 text-sm font-semibold text-gray-700">
                Nom complet
              </Text>
            </View>
            <TextInput
              className={inputClass("name")}
              placeholder="Jean Dupont"
              placeholderTextColor="#9ca3af"
              value={formData.name}
              onChangeText={(v) => handleChange("name", v)}
              maxLength={50}
              editable={!isSubmitting}
              accessibilityLabel="Nom complet"
            />
            {errors.name && (
              <Text className="mt-1 text-sm text-red-600">{errors.name}</Text>
            )}
          </View>

          <View>
            <View className="mb-2 flex-row items-center">
              <Ionicons name="mail-outline" size={16} color="#2563eb" />
              <Text className="ml-2 text-sm font-semibold text-gray-700">
                Adresse email
              </Text>
            </View>
            <TextInput
              className={inputClass("email")}
              placeholder="jean.dupont@example.com"
              placeholderTextColor="#9ca3af"
              value={formData.email}
              onChangeText={(v) => handleChange("email", v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={100}
              editable={!isSubmitting}
              accessibilityLabel="Adresse email"
            />
            {errors.email && (
              <Text className="mt-1 text-sm text-red-600">{errors.email}</Text>
            )}
          </View>

          <View>
            <View className="mb-2 flex-row items-center">
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={16}
                color="#2563eb"
              />
              <Text className="ml-2 text-sm font-semibold text-gray-700">
                Sujet
              </Text>
            </View>
            <TextInput
              className={inputClass("subject")}
              placeholder="De quoi souhaitez-vous parler ?"
              placeholderTextColor="#9ca3af"
              value={formData.subject}
              onChangeText={(v) => handleChange("subject", v)}
              maxLength={100}
              editable={!isSubmitting}
              accessibilityLabel="Sujet"
            />
            {errors.subject && (
              <Text className="mt-1 text-sm text-red-600">
                {errors.subject}
              </Text>
            )}
          </View>

          <View>
            <View className="mb-2 flex-row items-center">
              <Ionicons name="send-outline" size={16} color="#2563eb" />
              <Text className="ml-2 text-sm font-semibold text-gray-700">
                Message
              </Text>
            </View>
            <TextInput
              className={`${inputClass("message")} min-h-[140px]`}
              placeholder="Décrivez votre demande en détail..."
              placeholderTextColor="#9ca3af"
              value={formData.message}
              onChangeText={(v) => handleChange("message", v)}
              multiline
              textAlignVertical="top"
              maxLength={1000}
              editable={!isSubmitting}
              accessibilityLabel="Message"
            />
            <View className="mt-1 flex-row items-center justify-between">
              {errors.message ? (
                <Text className="text-sm text-red-600">{errors.message}</Text>
              ) : (
                <View />
              )}
              <Text
                className={`text-xs ${formData.message.length > 900 ? "text-orange-500" : "text-gray-500"}`}
              >
                {formData.message.length}/1000
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`flex-row items-center justify-center rounded-lg px-6 py-4 ${
              isSubmitting ? "bg-blue-400" : "bg-blue-600 active:bg-blue-700"
            }`}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="ml-2 font-semibold text-white">
                  Envoi en cours...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={18} color="#ffffff" />
                <Text className="ml-2 font-semibold text-white">
                  Envoyer le message
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

export default PublicContact;
