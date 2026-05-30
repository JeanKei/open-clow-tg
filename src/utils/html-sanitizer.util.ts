export function sanitizeHtmlForTelegram(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<br>/gi, '\n');
}