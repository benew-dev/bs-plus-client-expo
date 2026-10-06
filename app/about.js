// app/about.js
// Équivalent mobile de app/about/page.jsx. Route publique, sans garde-fou
// de session (accessible à tous, connecté ou non).

import { SafeAreaView } from "react-native-safe-area-context";
import AboutContent from "../components/about/AboutContent";

export default function AboutScreen() {
  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="flex-1 bg-blue-50"
    >
      <AboutContent />
    </SafeAreaView>
  );
}
