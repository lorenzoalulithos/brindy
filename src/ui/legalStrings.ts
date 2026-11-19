import type { Loc } from '../core/i18n'

/** Strings for the "Privacy & legal" section and the legal screens. Use with `L()` from `useT()`. */
export const LS = {
  section: { it: 'Privacy e note legali', en: 'Privacy & legal', es: 'Privacidad y legal', fr: 'Confidentialité et mentions légales', de: 'Datenschutz & Rechtliches' },
  privacy: { it: 'Informativa privacy', en: 'Privacy policy', es: 'Política de privacidad', fr: 'Politique de confidentialité', de: 'Datenschutzerklärung' },
  terms: { it: 'Termini e condizioni', en: 'Terms of use', es: 'Términos de uso', fr: "Conditions d'utilisation", de: 'Nutzungsbedingungen' },
  adPrivacy: { it: 'Privacy pubblicità', en: 'Ad privacy', es: 'Privacidad de anuncios', fr: 'Confidentialité des pubs', de: 'Werbe-Datenschutz' },
  adPrivacyWeb: {
    it: 'La versione web non usa pubblicità di terze parti: non c’è nessun consenso da gestire.',
    en: 'The web version shows no third-party ads, so there is no consent to manage.',
    es: 'La versión web no muestra anuncios de terceros: no hay ningún consentimiento que gestionar.',
    fr: 'La version web n’affiche aucune pub tierce : aucun consentement à gérer.',
    de: 'Die Web-Version zeigt keine Werbung von Drittanbietern, es gibt also keine Einwilligung zu verwalten.',
  },
  adPrivacyNotRequired: {
    it: 'Nel tuo paese non serve un consenso per la pubblicità.',
    en: 'No ad consent is required in your region.',
    es: 'En tu región no hace falta consentimiento para los anuncios.',
    fr: 'Aucun consentement publicitaire n’est requis dans ta région.',
    de: 'In deiner Region ist keine Werbe-Einwilligung nötig.',
  },
  genericError: {
    it: 'Qualcosa è andato storto. Riprova tra poco.',
    en: 'Something went wrong. Please try again in a moment.',
    es: 'Algo ha fallado. Inténtalo de nuevo en un momento.',
    fr: 'Un problème est survenu. Réessaie dans un instant.',
    de: 'Etwas ist schiefgelaufen. Bitte versuch es gleich noch einmal.',
  },
  restore: { it: 'Ripristina acquisti', en: 'Restore purchases', es: 'Restaurar compras', fr: 'Restaurer les achats', de: 'Käufe wiederherstellen' },
  restoreWeb: {
    it: 'Gli acquisti si ripristinano dall’app per iOS o Android.',
    en: 'Purchases can be restored in the iOS or Android app.',
    es: 'Las compras se restauran desde la app de iOS o Android.',
    fr: 'Les achats se restaurent depuis l’app iOS ou Android.',
    de: 'Käufe lassen sich in der iOS- oder Android-App wiederherstellen.',
  },
  restoreNone: { it: 'Nessun acquisto da ripristinare.', en: 'No purchases to restore.', es: 'No hay compras que restaurar.', fr: 'Aucun achat à restaurer.', de: 'Keine Käufe zum Wiederherstellen.' },
  restoreDone: { it: 'Acquisti ripristinati: {n}', en: 'Purchases restored: {n}', es: 'Compras restauradas: {n}', fr: 'Achats restaurés : {n}', de: 'Wiederhergestellte Käufe: {n}' },
  contact: { it: 'Contatti', en: 'Contact', es: 'Contacto', fr: 'Contact', de: 'Kontakt' },
  version: { it: 'Versione', en: 'Version', es: 'Versión', fr: 'Version', de: 'Version' },
  submitPrivacy: {
    it: 'Come usiamo questi dati: informativa privacy',
    en: 'How we use this data: privacy policy',
    es: 'Cómo usamos estos datos: política de privacidad',
    fr: 'Comment nous utilisons ces données : politique de confidentialité',
    de: 'Wie wir diese Daten nutzen: Datenschutzerklärung',
  },
  onlyItEn: {
    it: '',
    en: '',
    es: 'Este documento está disponible en inglés.',
    fr: 'Ce document est disponible en anglais.',
    de: 'Dieses Dokument ist auf Englisch verfügbar.',
  },
} satisfies Record<string, Loc>
