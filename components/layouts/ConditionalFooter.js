// components/layouts/ConditionalFooter.js
// Équivalent mobile de ConditionalFooter.jsx : masqué uniquement sur l'accueil.

import { usePathname } from "expo-router";
import Footer from "./Footer";

const ConditionalFooter = () => {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return <Footer />;
};

export default ConditionalFooter;
