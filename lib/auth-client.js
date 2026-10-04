// lib/auth-client.js
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { fetch as expoFetch } from "expo/fetch";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  // Nécessaire : le fetch de React Native masque l'en-tête Set-Cookie,
  // donc le plugin Expo ne peut jamais capturer le cookie de session avec
  // le fetch ambiant. expo/fetch l'expose correctement.
  fetchOptions: {
    customFetchImpl: expoFetch,
  },
  plugins: [
    expoClient({
      scheme: "bs-plus-client-expo", // doit être identique au "scheme" de app.json
      storagePrefix: "bs-plus-client-expo",
      storage: SecureStore,
      // Suppose que lib/auth.js (serveur) NE met PAS "__Secure-" dans
      // advanced.cookiePrefix (Better Auth l'ajoute déjà tout seul via
      // useSecureCookies). Sinon le cookie de prod devient
      // "__Secure-__Secure-..." et ne matche jamais — voir la correction
      // apportée à lib/auth.js.
      cookiePrefix: ["better-auth", "__Secure-better-auth"],
    }),
  ],
});

export const {
  useSession,
  signIn,
  signUp,
  signOut,
  updateUser,
  changePassword,
} = authClient;

/**
 * Pour appeler TES propres routes API (ex: /api/v1/cart), qui ne passent
 * pas par le fetch interne de Better Auth : il faut attacher le cookie de
 * session manuellement.
 *
 * Usage :
 *   const res = await authenticatedFetch("/api/v1/cart");
 */
export const authenticatedFetch = async (path, options = {}) => {
  const cookies = await authClient.getCookie();

  return fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
    ...options,
    credentials: "omit",
    headers: {
      ...(options.headers || {}),
      Cookie: cookies,
      "Content-Type": "application/json",
    },
  });
};
