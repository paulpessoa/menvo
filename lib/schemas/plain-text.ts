/**
 * Turns pasted rich text (Word, Google Docs, browser translators) into plain
 * text. The profile page renders `bio` as a text node, so any tag that reaches
 * the database shows up literally to the reader. Same rules as the one-off
 * cleanup in migrations 20261002000001/2, so stored data stays consistent.
 *
 * Runs twice because double-escaped input (`&lt;span&gt;`) only becomes a real
 * tag after the entities are decoded.
 */
export function toPlainText(value: string): string {
  const once = (text: string) =>
    text
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/\s*(div|p|li|h[1-7]|blockquote|ul|ol)\s*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  return once(once(value))
}
