// app/contact.js
// Équivalent mobile de app/contact/page.jsx. Route publique (accessible
// sans connexion), contrairement à /me/contact (si construit plus tard).

import { SafeAreaView } from "react-native-safe-area-context";
import PublicContact from "../components/contact/PublicContact";

export default function ContactScreen() {
  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="flex-1 bg-blue-50"
    >
      <PublicContact />
    </SafeAreaView>
  );
}
