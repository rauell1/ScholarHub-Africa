/**
 * i18n dictionary - ready for 35 languages, English by default.
 *
 * Languages marked "full" ship complete translations; any other locale
 * automatically falls back to English (configurable in the admin).
 * The admin Customization Engine can override any key per language,
 * and overrides live in the config object (`config.texts[locale]`).
 */
import type { ConsentTextKey } from './types';

export const SUPPORTED_LANGUAGES = [
  'en', // English (default)
  'fr', // French
  'de', // German
  'es', // Spanish
  'pt', // Portuguese
  'it', // Italian
  'nl', // Dutch
  'pl', // Polish
  'tr', // Turkish
  'sw', // Swahili
  // Extend-ready locales (fall back to English until translated):
  'sv', 'da', 'no', 'fi', 'cs', 'sk', 'hu', 'ro', 'bg', 'el', 'hr', 'sl',
  'et', 'lv', 'lt', 'mt', 'ga', 'uk', 'ru', 'ar', 'he', 'hi', 'zh', 'ja', 'ko',
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

type Dictionary = Record<ConsentTextKey, string>;

const en: Dictionary = {
  'banner.title': 'We value your privacy',
  'banner.message':
    'We use cookies to make ScholarHub work, understand how you use it, and show you relevant content. You can choose which categories to allow. Necessary cookies are always on.',
  'banner.acceptAll': 'Accept all',
  'banner.rejectAll': 'Reject non-essential',
  'banner.manage': 'Manage preferences',
  'banner.ccpaNotice': 'Do Not Sell or Share My Personal Information',
  'modal.title': 'Your privacy preferences',
  'modal.description':
    'Choose which cookie categories you allow. Your choice is stored locally and applied to every page.',
  'modal.save': 'Save preferences',
  'modal.cancel': 'Cancel',
  'modal.close': 'Close',
  'category.necessary': 'Necessary',
  'category.necessaryDesc': 'Required for the site to function. Always active.',
  'category.analytics': 'Analytics',
  'category.analyticsDesc': 'Helps us understand how visitors use the site.',
  'category.marketing': 'Marketing',
  'category.marketingDesc': 'Powers personalised ads and social tracking.',
  'category.preferences': 'Preferences',
  'category.preferencesDesc': 'Remembers choices like language and region.',
  'shield.aria': 'Open privacy preferences',
  'links.privacy': 'Privacy Policy',
  'links.cookiePolicy': 'Cookie Policy',
  'links.terms': 'Terms of Service',
};

const fr: Dictionary = {
  'banner.title': 'Nous respectons votre vie privée',
  'banner.message':
    'Nous utilisons des cookies pour faire fonctionner ScholarHub, comprendre son utilisation et vous montrer du contenu pertinent. Vous pouvez choisir les catégories autorisées. Les cookies nécessaires restent toujours actifs.',
  'banner.acceptAll': 'Tout accepter',
  'banner.rejectAll': 'Refuser les non essentiels',
  'banner.manage': 'Gérer les préférences',
  'banner.ccpaNotice': 'Ne pas vendre ni partager mes informations personnelles',
  'modal.title': 'Vos préférences de confidentialité',
  'modal.description':
    'Choisissez les catégories de cookies que vous autorisez. Votre choix est enregistré localement et appliqué sur chaque page.',
  'modal.save': 'Enregistrer',
  'modal.cancel': 'Annuler',
  'modal.close': 'Fermer',
  'category.necessary': 'Nécessaires',
  'category.necessaryDesc': 'Requis au fonctionnement du site. Toujours actifs.',
  'category.analytics': 'Analytique',
  'category.analyticsDesc': "Nous aide à comprendre comment les visiteurs utilisent le site.",
  'category.marketing': 'Marketing',
  'category.marketingDesc': 'Alimente les publicités personnalisées et le suivi social.',
  'category.preferences': 'Préférences',
  'category.preferencesDesc': 'Mémorise vos choix (langue, région, etc.).',
  'shield.aria': 'Ouvrir les préférences de confidentialité',
  'links.privacy': 'Politique de confidentialité',
  'links.cookiePolicy': 'Politique de cookies',
  'links.terms': "Conditions d'utilisation",
};

const de: Dictionary = {
  'banner.title': 'Ihre Privatsphäre ist uns wichtig',
  'banner.message':
    'Wir verwenden Cookies, damit ScholarHub funktioniert, um zu verstehen, wie Sie die Seite nutzen, und um Ihnen relevante Inhalte zu zeigen. Sie können wählen, welche Kategorien Sie erlauben. Notwendige Cookies sind immer aktiv.',
  'banner.acceptAll': 'Alle akzeptieren',
  'banner.rejectAll': 'Nicht notwendige ablehnen',
  'banner.manage': 'Einstellungen verwalten',
  'banner.ccpaNotice': 'Meine persönlichen Daten nicht verkaufen oder teilen',
  'modal.title': 'Ihre Datenschutzeinstellungen',
  'modal.description':
    'Wählen Sie, welche Cookie-Kategorien Sie erlauben. Ihre Wahl wird lokal gespeichert und auf jeder Seite angewendet.',
  'modal.save': 'Speichern',
  'modal.cancel': 'Abbrechen',
  'modal.close': 'Schließen',
  'category.necessary': 'Notwendig',
  'category.necessaryDesc': 'Erforderlich für den Betrieb der Website. Immer aktiv.',
  'category.analytics': 'Analyse',
  'category.analyticsDesc': 'Hilft uns zu verstehen, wie Besucher die Website nutzen.',
  'category.marketing': 'Marketing',
  'category.marketingDesc': 'Ermöglicht personalisierte Werbung und Social-Tracking.',
  'category.preferences': 'Präferenzen',
  'category.preferencesDesc': 'Speichert Einstellungen wie Sprache und Region.',
  'shield.aria': 'Datenschutzeinstellungen öffnen',
  'links.privacy': 'Datenschutzerklärung',
  'links.cookiePolicy': 'Cookie-Richtlinie',
  'links.terms': 'Nutzungsbedingungen',
};

const es: Dictionary = {
  'banner.title': 'Valoramos tu privacidad',
  'banner.message':
    'Usamos cookies para que ScholarHub funcione, entender cómo lo usas y mostrarte contenido relevante. Puedes elegir qué categorías permites. Las cookies necesarias siempre están activas.',
  'banner.acceptAll': 'Aceptar todo',
  'banner.rejectAll': 'Rechazar no esenciales',
  'banner.manage': 'Gestionar preferencias',
  'banner.ccpaNotice': 'No vender ni compartir mi información personal',
  'modal.title': 'Tus preferencias de privacidad',
  'modal.description':
    'Elige qué categorías de cookies permites. Tu elección se guarda localmente y se aplica en todas las páginas.',
  'modal.save': 'Guardar preferencias',
  'modal.cancel': 'Cancelar',
  'modal.close': 'Cerrar',
  'category.necessary': 'Necesarias',
  'category.necessaryDesc': 'Necesarias para el funcionamiento del sitio. Siempre activas.',
  'category.analytics': 'Analítica',
  'category.analyticsDesc': 'Nos ayuda a entender cómo usan el sitio los visitantes.',
  'category.marketing': 'Marketing',
  'category.marketingDesc': 'Permite anuncios personalizados y seguimiento social.',
  'category.preferences': 'Preferencias',
  'category.preferencesDesc': 'Recuerda opciones como idioma y región.',
  'shield.aria': 'Abrir preferencias de privacidad',
  'links.privacy': 'Política de privacidad',
  'links.cookiePolicy': 'Política de cookies',
  'links.terms': 'Términos del servicio',
};

const pt: Dictionary = {
  'banner.title': 'Valorizamos a sua privacidade',
  'banner.message':
    'Utilizamos cookies para o ScholarHub funcionar, perceber como o usa e mostrar conteúdo relevante. Pode escolher as categorias que permite. Os cookies necessários estão sempre ativos.',
  'banner.acceptAll': 'Aceitar tudo',
  'banner.rejectAll': 'Rejeitar não essenciais',
  'banner.manage': 'Gerir preferências',
  'banner.ccpaNotice': 'Não vender nem partilhar as minhas informações pessoais',
  'modal.title': 'As suas preferências de privacidade',
  'modal.description':
    'Escolha as categorias de cookies que permite. A sua escolha é guardada localmente e aplicada em todas as páginas.',
  'modal.save': 'Guardar preferências',
  'modal.cancel': 'Cancelar',
  'modal.close': 'Fechar',
  'category.necessary': 'Necessários',
  'category.necessaryDesc': 'Necessários ao funcionamento do site. Sempre ativos.',
  'category.analytics': 'Analítica',
  'category.analyticsDesc': 'Ajuda-nos a compreender como os visitantes usam o site.',
  'category.marketing': 'Marketing',
  'category.marketingDesc': 'Alimenta anúncios personalizados e rastreio social.',
  'category.preferences': 'Preferências',
  'category.preferencesDesc': 'Recorda opções como idioma e região.',
  'shield.aria': 'Abrir preferências de privacidade',
  'links.privacy': 'Política de privacidade',
  'links.cookiePolicy': 'Política de cookies',
  'links.terms': 'Termos de serviço',
};

const it: Dictionary = {
  'banner.title': 'Rispettiamo la tua privacy',
  'banner.message':
    'Usiamo i cookie per far funzionare ScholarHub, capire come lo usi e mostrarti contenuti pertinenti. Puoi scegliere quali categorie consentire. I cookie necessari sono sempre attivi.',
  'banner.acceptAll': 'Accetta tutti',
  'banner.rejectAll': 'Rifiuta non essenziali',
  'banner.manage': 'Gestisci preferenze',
  'banner.ccpaNotice': 'Non vendere o condividere le mie informazioni personali',
  'modal.title': 'Le tue preferenze sulla privacy',
  'modal.description':
    'Scegli quali categorie di cookie consentire. La tua scelta viene salvata localmente e applicata a ogni pagina.',
  'modal.save': 'Salva preferenze',
  'modal.cancel': 'Annulla',
  'modal.close': 'Chiudi',
  'category.necessary': 'Necessari',
  'category.necessaryDesc': 'Necessari al funzionamento del sito. Sempre attivi.',
  'category.analytics': 'Analitica',
  'category.analyticsDesc': 'Ci aiuta a capire come i visitatori usano il sito.',
  'category.marketing': 'Marketing',
  'category.marketingDesc': 'Alimenta annunci personalizzati e tracciamento social.',
  'category.preferences': 'Preferenze',
  'category.preferencesDesc': 'Ricorda scelte come lingua e regione.',
  'shield.aria': 'Apri le preferenze sulla privacy',
  'links.privacy': 'Informativa sulla privacy',
  'links.cookiePolicy': 'Informativa sui cookie',
  'links.terms': 'Termini di servizio',
};

const nl: Dictionary = {
  'banner.title': 'Wij respecteren uw privacy',
  'banner.message':
    'Wij gebruiken cookies om ScholarHub te laten werken, te begrijpen hoe u het gebruikt en relevante inhoud te tonen. U kunt kiezen welke categorieën u toestaat. Noodzakelijke cookies zijn altijd aan.',
  'banner.acceptAll': 'Alles accepteren',
  'banner.rejectAll': 'Niet-noodzakelijke weigeren',
  'banner.manage': 'Voorkeuren beheren',
  'banner.ccpaNotice': 'Verkoop of deel mijn persoonlijke gegevens niet',
  'modal.title': 'Uw privacyvoorkeuren',
  'modal.description':
    'Kies welke cookiecategorieën u toestaat. Uw keuze wordt lokaal opgeslagen en op elke pagina toegepast.',
  'modal.save': 'Voorkeuren opslaan',
  'modal.cancel': 'Annuleren',
  'modal.close': 'Sluiten',
  'category.necessary': 'Noodzakelijk',
  'category.necessaryDesc': 'Vereist voor de werking van de site. Altijd actief.',
  'category.analytics': 'Analytics',
  'category.analyticsDesc': 'Helpt ons begrijpen hoe bezoekers de site gebruiken.',
  'category.marketing': 'Marketing',
  'category.marketingDesc': 'Zorgt voor gepersonaliseerde advertenties en sociale tracking.',
  'category.preferences': 'Voorkeuren',
  'category.preferencesDesc': 'Onthoudt keuzes zoals taal en regio.',
  'shield.aria': 'Privacyvoorkeuren openen',
  'links.privacy': 'Privacybeleid',
  'links.cookiePolicy': 'Cookiebeleid',
  'links.terms': 'Servicevoorwaarden',
};

const pl: Dictionary = {
  'banner.title': 'Szanujemy Twoją prywatność',
  'banner.message':
    'Używamy plików cookie, aby ScholarHub działał, rozumieć sposób korzystania z niego i pokazywać odpowiednie treści. Możesz wybrać, które kategorie pozwolisz. Niezbędne pliki cookie są zawsze włączone.',
  'banner.acceptAll': 'Zaakceptuj wszystkie',
  'banner.rejectAll': 'Odrzuć zbędne',
  'banner.manage': 'Zarządzaj preferencjami',
  'banner.ccpaNotice': 'Nie sprzedawaj ani nie udostępniaj moich danych osobowych',
  'modal.title': 'Twoje preferencje prywatności',
  'modal.description':
    'Wybierz, które kategorie plików cookie zezwalasz. Twój wybór jest zapisywany lokalnie i stosowany na każdej stronie.',
  'modal.save': 'Zapisz preferencje',
  'modal.cancel': 'Anuluj',
  'modal.close': 'Zamknij',
  'category.necessary': 'Niezbędne',
  'category.necessaryDesc': 'Wymagane do działania witryny. Zawsze aktywne.',
  'category.analytics': 'Analityka',
  'category.analyticsDesc': 'Pomaga nam zrozumieć, jak odwiedzający korzystają z witryny.',
  'category.marketing': 'Marketing',
  'category.marketingDesc': 'Zasila spersonalizowane reklamy i śledzenie społecznościowe.',
  'category.preferences': 'Preferencje',
  'category.preferencesDesc': 'Zapamiętuje wybory, takie jak język i region.',
  'shield.aria': 'Otwórz preferencje prywatności',
  'links.privacy': 'Polityka prywatności',
  'links.cookiePolicy': 'Polityka plików cookie',
  'links.terms': 'Warunki korzystania',
};

const tr: Dictionary = {
  'banner.title': 'Gizliliğinize değer veriyoruz',
  'banner.message':
    'ScholarHub\'un çalışması, nasıl kullandığınızı anlamamız ve size ilgili içerik göstermemiz için çerezler kullanıyoruz. Hangi kategorilere izin vereceğinizi seçebilirsiniz. Zorunlu çerezler her zaman açıktır.',
  'banner.acceptAll': 'Tümünü kabul et',
  'banner.rejectAll': 'Zorunlu olmayanları reddet',
  'banner.manage': 'Tercihleri yönet',
  'banner.ccpaNotice': 'Kişisel bilgilerimi satmayın veya paylaşmayın',
  'modal.title': 'Gizlilik tercihleriniz',
  'modal.description':
    'Hangi çerez kategorilerine izin vereceğinizi seçin. Seçiminiz yerel olarak saklanır ve her sayfada uygulanır.',
  'modal.save': 'Tercihleri kaydet',
  'modal.cancel': 'İptal',
  'modal.close': 'Kapat',
  'category.necessary': 'Zorunlu',
  'category.necessaryDesc': 'Sitenin çalışması için gereklidir. Her zaman aktiftir.',
  'category.analytics': 'Analitik',
  'category.analyticsDesc': 'Ziyaretçilerin siteyi nasıl kullandığını anlamamıza yardımcı olur.',
  'category.marketing': 'Pazarlama',
  'category.marketingDesc': 'Kişiselleştirilmiş reklamları ve sosyal takibi destekler.',
  'category.preferences': 'Tercihler',
  'category.preferencesDesc': 'Dil ve bölge gibi seçimleri hatırlar.',
  'shield.aria': 'Gizlilik tercihlerini aç',
  'links.privacy': 'Gizlilik Politikası',
  'links.cookiePolicy': 'Çerez Politikası',
  'links.terms': 'Kullanım Koşulları',
};

const sw: Dictionary = {
  'banner.title': 'Tunathamini faragha yako',
  'banner.message':
    'Tunatumia vidakuzi kufanya ScholarHub ifanye kazi, kuelewa jinsi unavyotumia na kukuonyesha maudhui yanayokufaa. Unaweza kuchagua ni kategoria gani za kuruhusu. Vidakuzi muhimu daima vimewashwa.',
  'banner.acceptAll': 'Kubali Yote',
  'banner.rejectAll': 'Kataa Visivyo Muhimu',
  'banner.manage': 'Simamia Mapendeleo',
  'banner.ccpaNotice': 'Usiuze au Kushiriki Taarifa Zangu za Kibinafsi',
  'modal.title': 'Mapendeleo yako ya faragha',
  'modal.description':
    'Chagua ni kategoria gani za vidakuzi unazoruhusu. Chaguo lako linahifadhiwa kwenye kifaa chako na kutumika kwenye kila ukurasa.',
  'modal.save': 'Hifadhi Mapendeleo',
  'modal.cancel': 'Ghairi',
  'modal.close': 'Funga',
  'category.necessary': 'Muhimu',
  'category.necessaryDesc': 'Inahitajika kwa tovuti kufanya kazi. Daima imewashwa.',
  'category.analytics': 'Uchambuzi',
  'category.analyticsDesc': 'Hutusaidia kuelewa jinsi wageni wanavyotumia tovuti.',
  'category.marketing': 'Uuzaji',
  'category.marketingDesc': 'Huwezesha matangazo yaliyobinafsishwa na ufuatiliaji wa mitandao.',
  'category.preferences': 'Mapendeleo',
  'category.preferencesDesc': 'Hukumbuka chaguo kama lugha na eneo.',
  'shield.aria': 'Fungua mipangilio ya faragha',
  'links.privacy': 'Sera ya Faragha',
  'links.cookiePolicy': 'Sera ya Vidakuzi',
  'links.terms': 'Masharti ya Matumizi',
};

const DICTIONARIES: Record<string, Dictionary> = {
  en, fr, de, es, pt, it, nl, pl, tr, sw,
};

/**
 * Resolve a string for `locale`. Admin overrides (`overrides`) win,
 * then the built-in dictionary, then English.
 */
export function t(
  locale: string,
  key: ConsentTextKey,
  overrides?: Record<string, Partial<Record<ConsentTextKey, string>>>,
): string {
  const override = overrides?.[locale]?.[key];
  if (override) return override;
  return DICTIONARIES[locale]?.[key] ?? DICTIONARIES.en[key];
}

export function getAvailableLanguages(): string[] {
  return [...SUPPORTED_LANGUAGES];
}

/** Language display names for the admin language selector. */
export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', fr: 'Français', de: 'Deutsch', es: 'Español', pt: 'Português',
  it: 'Italiano', nl: 'Nederlands', pl: 'Polski', tr: 'Türkçe', sw: 'Kiswahili',
  sv: 'Svenska', da: 'Dansk', no: 'Norsk', fi: 'Suomi', cs: 'Čeština',
  sk: 'Slovenčina', hu: 'Magyar', ro: 'Română', bg: 'Български', el: 'Ελληνικά',
  hr: 'Hrvatski', sl: 'Slovenščina', et: 'Eesti', lv: 'Latviešu', lt: 'Lietuvių',
  mt: 'Malti', ga: 'Gaeilge', uk: 'Українська', ru: 'Русский', ar: 'العربية',
  he: 'עברית', hi: 'हिन्दी', zh: '中文', ja: '日本語', ko: '한국어',
};
