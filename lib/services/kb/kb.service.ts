import kbIndex from "@/kb/_index.json"

export interface KbArticleLink {
  label: string
  url: string
}

export interface KbArticleDto {
  id: string
  title: string
  category: string
  summary: string
  content: string
  links: KbArticleLink[]
}

export interface SearchKbOptions {
  role?: "mentee" | "mentor" | "admin" | "organization" | string
  limit?: number
}

/**
 * Service to search the Menvo Knowledge Base (KB).
 * Implements deterministic zero-token keyword matching with role-based audience filtering
 * and token scoring per docs/AI_PLATFORM_PLAN.md §6.2.
 */
export class KnowledgeBaseService {
  private articles: typeof kbIndex

  constructor(customArticles?: typeof kbIndex) {
    this.articles = customArticles || kbIndex
  }

  /**
   * Searches the Knowledge Base for articles matching the user query,
   * filtered by user role and ranked by keyword relevance.
   */
  search(query: string, options: SearchKbOptions = {}): KbArticleDto[] {
    const { role = "mentee", limit = 3 } = options
    const normalizedQuery = this.normalize(query)
    const queryTokens = normalizedQuery
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2)

    if (queryTokens.length === 0) {
      return []
    }

    const scored = this.articles
      .filter((article) => {
        // Audience filter: "all" or matching role
        if (!article.audience || article.audience.includes("all")) {
          return true
        }
        if (role === "admin") {
          return true // Admins have global access
        }
        return article.audience.includes(role)
      })
      .map((article) => {
        let score = 0
        const normTitle = this.normalize(article.title)
        const normSummary = this.normalize(article.summary)
        const normTags = article.tags.map((t) => this.normalize(t))
        const normContent = this.normalize(article.content)

        // Exact query / title match bonus
        if (normTitle === normalizedQuery) score += 40
        else if (normalizedQuery.includes(normTitle)) score += 30
        else if (normTitle.includes(normalizedQuery)) score += 25

        if (normSummary.includes(normalizedQuery)) score += 10
        if (normTags.some((t) => t === normalizedQuery)) score += 20
        else if (normTags.some((t) => normalizedQuery.includes(t) || t.includes(normalizedQuery))) score += 10

        // Stop words in Portuguese to avoid noisy matches on common prepositions
        const stopWords = new Set(["o", "a", "os", "as", "um", "uma", "de", "do", "da", "dos", "das", "e", "em", "para", "por", "com", "no", "na", "nos", "nas", "se", "que"])

        // Token matches
        for (const token of queryTokens) {
          if (stopWords.has(token)) continue
          if (normTitle.split(" ").includes(token)) score += 8
          else if (normTitle.includes(token)) score += 4

          if (normTags.includes(token)) score += 7
          else if (normTags.some((t) => t.includes(token))) score += 4

          if (normSummary.split(" ").includes(token)) score += 4
          else if (normSummary.includes(token)) score += 2

          if (normContent.includes(token)) score += 1
        }

        return { article, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)

    return scored.slice(0, limit).map(({ article }) => ({
      id: article.id,
      title: article.title,
      category: article.category,
      summary: article.summary,
      content: article.content,
      links: article.links || []
    }))
  }

  /**
   * Strips accents, lowercases and normalizes punctuation for token comparison.
   */
  private normalize(str: string): string {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
  }
}

export const kbService = new KnowledgeBaseService()
