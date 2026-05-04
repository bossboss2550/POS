import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "th" : "en";
    i18n.changeLanguage(newLang);
  };  return (
    <button
      onClick={toggleLanguage}
      className="relative z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      title={t("settings.language")}
    >
      <Globe className="w-4 h-4" />
      <span className="text-xs">{i18n.language === "en" ? "TH" : "EN"}</span>
    </button>
  );
}
