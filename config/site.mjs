export const site = Object.freeze({
  brand: "Visa Service Phuket",
  origin: "https://phuketvisaservice.com",
  phoneE164: "+66948293074",
  phoneDisplay: "+66 94 829 3074",
  whatsappNumber: "66948293074",
  email: "office@visaservicephuket.com",
  ga4MeasurementId: "G-GEGPEWNRDN",
  adsConversionId: "",
  metaPixelId: "",
  trackingEndpoint: "/api/track",
  logo: "/assets/img/logo.png",
  image: "/assets/img/og-image.jpg",
  address: Object.freeze({
    addressLocality: "Wichit",
    addressRegion: "Phuket",
    addressCountry: "TH"
  }),
  openingHours: Object.freeze([
    Object.freeze({ days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" }),
    Object.freeze({ days: ["Saturday"], opens: "09:00", closes: "14:00" })
  ]),
  social: Object.freeze({
    facebook: "https://www.facebook.com/visaservicephuket365/",
    instagram: "https://www.instagram.com/visaservicephuket365/",
    linkedin: "https://www.linkedin.com/company/visaservicephuket365/"
  })
});

export const locales = Object.freeze({
  en: Object.freeze({
    home: "/", servicesLabel: "Services", languageLabel: "Language",
    menuLabel: "Open menu", closeMenuLabel: "Close menu", mobileNavigationLabel: "Mobile navigation", about: "About Us", allServices: "All services",
    contact: "Contact", more: "More", privacy: "Privacy Policy", terms: "Terms",
    office: "Office in Wichit, Phuket, full address shared on WhatsApp",
    hours: "Hours: Mon–Fri 9:00–18:00 · Sat 9:00–14:00 · Sun: WhatsApp only",
    disclaimer: "Visa requirements may vary depending on personal situation, visa type and current rules. We provide document and process guidance but do not make immigration decisions.",
    independent: "Independent visa support service · Phuket, Thailand",
    caseCheck: Object.freeze({
      eyebrow: "Free case check", title: "Know your next step before you apply",
      text: "Send three details on WhatsApp. We review your situation and tell you which documents or next step fit your case.",
      items: ["Nationality", "Current visa or entry stamp", "Expiry date or preferred timeline"],
      button: "Check my case on WhatsApp",
      note: "No obligation · English, German & Russian",
      message: "Hello, I need help with {service}. Nationality: ___, current visa or entry stamp: ___, expiry date or preferred timeline: ___."
    }),
    nav: [["/visa-extension-phuket/","Visa Extension Phuket"],["/retirement-visa-phuket/","Retirement Visa Phuket"],["/non-immigrant-visa-phuket/","Non-Immigrant Visa"],["/dtv-visa-phuket/","DTV Visa Phuket"],["/90-day-report-phuket/","90-Day Report"],["/re-entry-permit-phuket/","Re-Entry Permit"],["/thai-driving-license-phuket/","Thai Driving License"],["/tm30-phuket/","TM30 Phuket"]]
  }),
  de: Object.freeze({
    home: "/de/", servicesLabel: "Leistungen", languageLabel: "Sprache",
    menuLabel: "Menü öffnen", closeMenuLabel: "Menü schließen", mobileNavigationLabel: "Mobile Navigation", about: "Über uns", allServices: "Alle Leistungen",
    contact: "Kontakt", more: "Mehr", privacy: "Datenschutz", terms: "Nutzungsbedingungen",
    office: "Büro in Wichit, Phuket; vollständige Adresse per WhatsApp",
    hours: "Öffnungszeiten: Mo–Fr 9:00–18:00 · Sa 9:00–14:00 · So: nur WhatsApp",
    disclaimer: "Visabestimmungen können je nach persönlicher Situation, Visumtyp und aktuellen Vorschriften variieren. Wir unterstützen bei Dokumenten und Abläufen, treffen jedoch keine Entscheidungen der Einwanderungsbehörde.",
    independent: "Unabhängiger Visa-Service · Phuket, Thailand",
    caseCheck: Object.freeze({
      eyebrow: "Kostenlose Ersteinschätzung", title: "Klären Sie den nächsten Schritt vor dem Antrag",
      text: "Senden Sie uns drei Angaben per WhatsApp. Wir prüfen Ihre Situation und nennen die passenden Unterlagen oder den nächsten Schritt.",
      items: ["Staatsangehörigkeit", "Aktuelles Visum oder Einreisestempel", "Ablaufdatum oder gewünschter Zeitplan"],
      button: "Fall per WhatsApp prüfen lassen",
      note: "Unverbindlich · Deutsch, Englisch & Russisch",
      message: "Hallo, ich benötige Hilfe bei {service}. Staatsangehörigkeit: ___, aktuelles Visum oder Einreisestempel: ___, Ablaufdatum oder gewünschter Zeitplan: ___."
    }),
    nav: [["/de/visa-extension-phuket/","Visumverlängerung Phuket"],["/de/retirement-visa-phuket/","Retirement Visa Phuket"],["/de/non-immigrant-visa-phuket/","Non-Immigrant Visa"],["/de/dtv-visa-phuket/","DTV Visa Phuket"],["/de/90-day-report-phuket/","90-Tage-Meldung"],["/de/re-entry-permit-phuket/","Re-Entry Permit"],["/de/thai-driving-license-phuket/","Thai-Führerschein"],["/de/tm30-phuket/","TM30 Phuket"]]
  }),
  ru: Object.freeze({
    home: "/ru/", servicesLabel: "Услуги", languageLabel: "Язык",
    menuLabel: "Открыть меню", closeMenuLabel: "Закрыть меню", mobileNavigationLabel: "Мобильная навигация", about: "О нас", allServices: "Все услуги",
    contact: "Контакты", more: "Дополнительно", privacy: "Конфиденциальность", terms: "Условия",
    office: "Офис в Вичите, Пхукет; полный адрес отправим в WhatsApp",
    hours: "Часы работы: Пн–Пт 9:00–18:00 · Сб 9:00–14:00 · Вс: только WhatsApp",
    disclaimer: "Визовые требования зависят от личной ситуации, типа визы и действующих правил. Мы помогаем с документами и процессом, но не принимаем решения иммиграционной службы.",
    independent: "Независимый визовый сервис · Пхукет, Таиланд",
    caseCheck: Object.freeze({
      eyebrow: "Бесплатная проверка", title: "Узнайте следующий шаг до подачи документов",
      text: "Отправьте нам три пункта в WhatsApp. Мы проверим вашу ситуацию и подскажем подходящие документы или следующий шаг.",
      items: ["Гражданство", "Текущая виза или штамп о въезде", "Дата окончания или желаемые сроки"],
      button: "Проверить мой случай в WhatsApp",
      note: "Без обязательств · Русский, английский и немецкий",
      message: "Здравствуйте, мне нужна помощь с {service}. Гражданство: ___, текущая виза или штамп о въезде: ___, дата окончания или желаемые сроки: ___."
    }),
    nav: [["/ru/visa-extension-phuket/","Продление визы"],["/ru/retirement-visa-phuket/","Пенсионная виза"],["/ru/non-immigrant-visa-phuket/","Неиммиграционная виза"],["/ru/dtv-visa-phuket/","Виза DTV"],["/ru/90-day-report-phuket/","90-дневный отчёт"],["/ru/re-entry-permit-phuket/","Разрешение на повторный въезд"],["/ru/thai-driving-license-phuket/","Тайские водительские права"],["/ru/tm30-phuket/","TM30 Пхукет"]]
  })
});
