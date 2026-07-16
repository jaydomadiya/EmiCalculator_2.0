export type LanguageOption = {
  code: string;
  nativeName: string;
  flag: string;
};

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'zh', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ru', nativeName: 'Русский', flag: '🇷🇺' },
];

export const DEFAULT_LANGUAGE_CODE = 'en';
