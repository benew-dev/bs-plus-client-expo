// context/AuthContext.js
// Équivalent mobile de AuthContext.jsx.
// user dérive de useSession() (plus de state local dupliqué), favoris
// gérés en optimistic update séparé, updatePassword via l'API native
// Better Auth (authClient.changePassword).

import { createContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  authClient,
  authenticatedFetch,
  changePassword as authChangePassword,
  useSession,
} from "../lib/auth-client";
import { showToast } from "../lib/toast";
import { captureClientError } from "../lib/monitoring";

const AuthContext = createContext();

// Parsing JSON défensif : ne tente .json() que si le content-type l'indique
// (évite qu'une réponse HTML/vide ne remonte comme une fausse erreur réseau)
async function parseJsonSafely(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await res.json();
  } catch (parseError) {
    console.error(
      "[AuthContext] Failed to parse JSON response:",
      parseError.message,
    );
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const { data: session, refetch: refetchSession } = useSession();
  const sessionUser = session?.user ?? null;

  // Favoris optimistes séparés de la session (évite le souci de cookieCache stale)
  const [optimisticFavorites, setOptimisticFavorites] = useState(null);

  // Resynchroniser avec la session dès qu'elle change côté serveur
  useEffect(() => {
    setOptimisticFavorites(null);
  }, [sessionUser?.favorites]);

  const user = sessionUser
    ? {
        ...sessionUser,
        favorites: optimisticFavorites ?? sessionUser.favorites ?? [],
      }
    : null;

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);

  const router = useRouter();

  /**
   * Force un refetch de la session en contournant le cookieCache
   * (maxAge 5min côté serveur peut renvoyer une session périmée)
   */
  const forceRefreshSession = async () => {
    try {
      await authClient.getSession({ query: { disableCookieCache: true } });
      await refetchSession();
    } catch (err) {
      console.warn("[AuthContext] Failed to refresh session:", err);
    }
  };

  /**
   * Met à jour le profil utilisateur (phone + adresse) via /api/v1/me/update
   */
  const updateProfile = async ({ phone, address }) => {
    try {
      setLoading(true);
      setError(null);

      const payload = { phone: phone.trim(), address };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let res;
      try {
        res = await authenticatedFetch("/api/v1/me/update", {
          method: "PUT",
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        let errorMessage = data?.message || "Données de profil invalides";
        if (res.status === 400 && data?.errors) {
          const firstErrorKey = Object.keys(data.errors)[0];
          errorMessage = data.errors[firstErrorKey] || errorMessage;
        } else if (res.status === 401) {
          errorMessage = "Session expirée. Veuillez vous reconnecter";
          setTimeout(() => router.replace("/login"), 2000);
        } else if (res.status === 429) {
          errorMessage = "Trop de tentatives. Réessayez plus tard.";
        }

        const httpError = new Error(`HTTP ${res.status}: ${errorMessage}`);
        captureClientError(
          httpError,
          "AuthContext",
          "updateProfile",
          res.status === 401,
        );

        setError(errorMessage);
        return;
      }

      if (!data) {
        setError("Réponse invalide du serveur");
        return;
      }

      if (data.success && data.data?.updatedUser) {
        showToast("Profil mis à jour avec succès!");
        await forceRefreshSession();
        setUpdated(true);

        const sessionUpdated = res.headers.get("X-Session-Updated");
        return { success: true, sessionUpdated };
      }
    } catch (error) {
      if (error.name === "AbortError") {
        setError("La requête a pris trop de temps");
        captureClientError(error, "AuthContext", "updateProfile", false);
      } else {
        setError("Problème de connexion. Vérifiez votre connexion.");
        captureClientError(error, "AuthContext", "updateProfile", true);
      }
      console.error("Profile update error:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Met à jour le mot de passe via l'API native Better Auth
   */
  const updatePassword = async ({
    currentPassword,
    newPassword,
    confirmPassword,
  }) => {
    try {
      setLoading(true);
      setError(null);

      if (!currentPassword || !newPassword) {
        setError("Tous les champs sont obligatoires");
        return;
      }
      if (currentPassword === newPassword) {
        setError("Le nouveau mot de passe doit être différent");
        return;
      }
      if (newPassword.length < 8) {
        setError("Minimum 8 caractères pour le nouveau mot de passe");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError(
          "Le nouveau mot de passe et la confirmation ne correspondent pas",
        );
        return;
      }

      const { error: changeError } = await authChangePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (changeError) {
        const errorMessage =
          changeError.message || "Mot de passe actuel incorrect";
        captureClientError(
          new Error(errorMessage),
          "AuthContext",
          "updatePassword",
          false,
        );
        setError(errorMessage);
        return;
      }

      showToast("Mot de passe mis à jour avec succès!");
      setTimeout(() => router.replace("/me"), 1000);
    } catch (error) {
      setError("Problème de connexion. Vérifiez votre connexion.");
      captureClientError(error, "AuthContext", "updatePassword", true);
      console.error("Password update error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ajoute/retire un produit des favoris — optimistic update + rollback
   */
  const toggleFavorite = async (
    productId,
    productName,
    productImage,
    action = "toggle",
  ) => {
    try {
      setError(null);

      if (!productId) {
        captureClientError(
          new Error("L'ID du produit est obligatoire"),
          "AuthContext",
          "toggleFavorite",
          false,
        );
        setError("L'ID du produit est obligatoire");
        return { success: false };
      }

      // Diagnostic temporaire : confirme la forme réelle de user.favorites
      console.log(
        "[toggleFavorite] typeof user.favorites:",
        typeof user?.favorites,
        "isArray:",
        Array.isArray(user?.favorites),
        "value:",
        JSON.stringify(user?.favorites),
      );

      // Durci : si user.favorites existe mais n'est pas un vrai tableau
      // (ex: objet malformé renvoyé par la session), on ne plante pas
      const currentFavorites = Array.isArray(user?.favorites)
        ? user.favorites
        : [];
      const backupFavorites = JSON.parse(JSON.stringify(currentFavorites));

      const favoriteIndex = currentFavorites.findIndex(
        (fav) => fav.productId?.toString() === productId,
      );
      const isCurrentlyInFavorites = favoriteIndex !== -1;

      let actionToPerform = action;
      if (action === "toggle") {
        actionToPerform = isCurrentlyInFavorites ? "remove" : "add";
      }

      let updatedFavorites;
      if (actionToPerform === "add") {
        updatedFavorites = [
          ...currentFavorites,
          {
            productId,
            productName: productName.trim(),
            productImage: productImage || { public_id: null, url: null },
            addedAt: new Date(),
          },
        ];
      } else if (actionToPerform === "remove") {
        updatedFavorites = currentFavorites.filter(
          (fav) => fav.productId?.toString() !== productId,
        );
      } else {
        updatedFavorites = currentFavorites;
      }

      setOptimisticFavorites(updatedFavorites);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      let res;
      try {
        res = await authenticatedFetch("/api/v1/me/favorites", {
          method: "POST",
          body: JSON.stringify({
            productId,
            productName,
            productImage,
            action: actionToPerform,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        let errorMessage = data?.message;
        if (!errorMessage) {
          switch (res.status) {
            case 400:
              errorMessage = "Données invalides";
              break;
            case 401:
              errorMessage = "Session expirée. Veuillez vous reconnecter";
              setTimeout(() => router.replace("/login"), 2000);
              break;
            case 404:
              errorMessage = "Service indisponible (route introuvable)";
              break;
            case 429:
              errorMessage = "Trop de tentatives. Réessayez plus tard.";
              break;
            default:
              errorMessage = `Erreur lors de l'opération (${res.status})`;
          }
        }

        setOptimisticFavorites(backupFavorites);

        const httpError = new Error(`HTTP ${res.status}: ${errorMessage}`);
        captureClientError(
          httpError,
          "AuthContext",
          "toggleFavorite",
          res.status === 401,
        );

        setError(errorMessage);
        showToast(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (!data) {
        setOptimisticFavorites(backupFavorites);
        const errorMessage = "Réponse invalide du serveur";
        captureClientError(
          new Error(errorMessage),
          "AuthContext",
          "toggleFavorite",
          true,
        );
        setError(errorMessage);
        showToast(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (data.success && data.data?.favorites) {
        setOptimisticFavorites(data.data.favorites);
        forceRefreshSession();

        const isAdded = data.data.action === "added";
        showToast(
          isAdded
            ? `${productName} ajouté aux favoris`
            : `${productName} retiré des favoris`,
        );

        return {
          success: true,
          isFavorite: isAdded,
          favorites: data.data.favorites,
        };
      }

      setOptimisticFavorites(backupFavorites);
      return { success: false, error: "Réponse inattendue du serveur" };
    } catch (error) {
      console.error("[toggleFavorite] Error:", error.message);
      setOptimisticFavorites(null);

      let errorMessage = "Problème de connexion. Vérifiez votre connexion.";
      if (error.name === "AbortError") {
        errorMessage = "La requête a pris trop de temps";
        captureClientError(error, "AuthContext", "toggleFavorite", false);
      } else {
        captureClientError(error, "AuthContext", "toggleFavorite", true);
      }

      setError(errorMessage);
      showToast(errorMessage);
      return { success: false, error: error.message };
    }
  };

  /**
   * Envoie un email de contact via /api/v1/emails
   */
  const sendEmail = async ({ subject, message }) => {
    try {
      setLoading(true);
      setError(null);

      if (!subject || !subject.trim()) {
        setError("Le sujet est obligatoire");
        return;
      }
      if (!message || !message.trim()) {
        setError("Le message est obligatoire");
        return;
      }
      if (subject.length > 200) {
        setError("Le sujet est trop long (max 200 caractères)");
        return;
      }
      if (message.length > 5000) {
        setError("Le message est trop long (max 5000 caractères)");
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let res;
      try {
        res = await authenticatedFetch("/api/v1/emails", {
          method: "POST",
          body: JSON.stringify({ subject, message }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        let errorMessage = data?.message;
        if (!errorMessage) {
          switch (res.status) {
            case 400:
              errorMessage = "Données invalides";
              break;
            case 401:
              errorMessage = "Session expirée. Veuillez vous reconnecter";
              setTimeout(() => router.replace("/login"), 2000);
              break;
            case 404:
              errorMessage = "Utilisateur non trouvé";
              break;
            case 429:
              errorMessage = "Trop de tentatives. Réessayez plus tard.";
              break;
            case 503:
              errorMessage = "Service d'email temporairement indisponible";
              break;
            default:
              errorMessage = "Erreur lors de l'envoi";
          }
        }

        const httpError = new Error(`HTTP ${res.status}: ${errorMessage}`);
        captureClientError(
          httpError,
          "AuthContext",
          "sendEmail",
          [401, 503].includes(res.status),
        );

        setError(errorMessage);
        return;
      }

      if (data?.success) {
        showToast("Message envoyé avec succès!");
        router.replace("/me");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        setError("La requête a pris trop de temps");
        captureClientError(error, "AuthContext", "sendEmail", false);
      } else {
        setError("Problème de connexion. Vérifiez votre connexion.");
        captureClientError(error, "AuthContext", "sendEmail", true);
      }
      console.error("Email send error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearUser = () => {
    setOptimisticFavorites(null);
    setError(null);
    setUpdated(false);
  };

  const clearErrors = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        error,
        loading,
        updated,
        setUpdated,
        setLoading,
        updateProfile,
        updatePassword,
        toggleFavorite,
        sendEmail,
        clearUser,
        clearErrors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
