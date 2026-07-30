export type CharterLocale = 'ru' | 'ua' | 'en';

const MONTHS: Record<CharterLocale, string[]> = {
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  ua: ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/**
 * Pure, deterministic date formatter for charter offer dates.
 * Avoids Intl so tests are stable across Node ICU builds.
 */
export function formatCharterDate(date: string, locale: CharterLocale): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = String(d.getUTCDate());
  const months = MONTHS[locale] ?? MONTHS.en;
  return `${day} ${months[d.getUTCMonth()]}`;
}
