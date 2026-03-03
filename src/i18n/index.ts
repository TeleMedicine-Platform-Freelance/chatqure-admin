import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en_common from "@/i18n/locales/en/common.json";
import en_dashboard from "@/i18n/locales/en/home.json";
import en_auth from "@/i18n/locales/en/auth.json";
import en_settings from "@/i18n/locales/en/settings.json";
import en_notifications from "@/i18n/locales/en/notifications.json";
import en_system from "@/i18n/locales/en/system.json";
import en_guidedSetup from "@/i18n/locales/en/guidedSetup.json";
import en_activityHub from "@/i18n/locales/en/activityHub.json";
import en_pricing from "@/i18n/locales/en/pricing.json";
import en_errors from "@/i18n/locales/en/errors.json";
import en_layouts from "@/i18n/locales/en/layouts.json";
import en_navigation from "@/i18n/locales/en/navigation.json";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    resources: {
      en: {
        common: en_common,
        dashboard: en_dashboard,
        home: en_dashboard,
        auth: en_auth,
        settings: en_settings,
        notifications: en_notifications,
        system: en_system,
        guidedSetup: en_guidedSetup,
        activityHub: en_activityHub,
        pricing: en_pricing,
        errors: en_errors,
        layouts: en_layouts,
        navigation: en_navigation,
      },
    },
    defaultNS: "common",
    ns: [
      "common",
      "dashboard",
      "home",
      "users",
      "auth",
      "settings",
      "calendar",
      "chat",
      "email",
      "dashboards",
      "kanban",
      "notifications",
      "teams",
      "invoices",
      "system",
      "guidedSetup",
      "activityHub",
      "integrations",
      "pricing",
      "errors",
      "layouts",
      "navigation",
      "inbox",
    ],
  });

export default i18n;
