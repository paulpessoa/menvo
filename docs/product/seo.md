# 🚀 Menvo SEO & Image Optimization Guide

> **Comprehensive guide** covering traditional search engine optimization (SEO), LLM/AI engine discovery (Geo SEO), structured Schema.org data, and image asset standards.

---

## 1. Traditional SEO Architecture

### Next.js Metadata
- Configured dynamically per route using `generateMetadata()` in `app/[locale]/...`.
- `metadataBase` is set to `https://www.menvo.com.br`.
- Each page features unique title templates, descriptions, keywords, canonical URLs, and localized alternates (`pt-BR`, `en`, `es`).

### Sitemap & Robots
- **Sitemap:** Accessible at `public/sitemap.xml` with priority hierarchy:
  - Homepage (`1.0`, daily)
  - Mentors (`0.9`, daily)
  - How It Works (`0.8`, weekly)
  - FAQ (`0.7`, monthly)
- **Robots:** `public/robots.txt` permits indexing for Googlebot, Bingbot, and AI crawlers while protecting internal paths (`/admin`, `/api/`).

---

## 2. Structured Data (Schema.org JSON-LD)

Implemented across critical pages to generate Google Rich Snippets and improve CTR:

1. **Organization & WebSite Graph (`app/[locale]/layout.tsx`)**:
   - Declares Menvo as a nonprofit/volunteer educational initiative.
   - Includes `potentialAction` (`SearchAction`) targeting `/mentors?q={search_term_string}`.
2. **FAQPage Schema (`app/[locale]/faq/`)**:
   - Exposes questions and answers for Google FAQ rich snippet carousels.

---

## 3. LLM / AI Search Engine Optimization (Geo SEO)

To ensure visibility across AI engines (ChatGPT Search, Perplexity, Claude, Gemini, Kimi, Manus):

- **`public/llms.txt`**: Standardized high-level summary following the Answer.AI specification.
- **`public/llms-full.txt`**: Deep knowledge base containing:
  - Platform purpose, free volunteer model, and target audience.
  - Mentorship workflow (matching, quiz diagnostic, session scheduling).
  - Safety, code of conduct, and evaluation systems.
- **Robots.txt Crawler Whitelist:** Explicitly allows `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `Amazonbot`, `Applebot-Extended`, and `Bytespider`.

---

## 4. Image Optimization Standards

All public visual assets follow strict Core Web Vitals guidelines:

### Image Specifications
| Use Case | Display Size | Native Render (2x Retina) | Format | Max File Size |
|---|---|---|---|---|
| Hero Carousels | 450x450px | 900x900px | WebP / JPG | 120 KB |
| How It Works | 400x300px | 800x600px | WebP / JPG | 100 KB |
| Mentor Avatars | 120x120px | 240x240px | WebP / PNG | 50 KB |

### Performance Rules
1. **LCP Optimization:** The above-the-fold Hero image MUST have `priority={true}` to preload without lazy-load delays.
2. **Next.js `<Image>` Component:** Always use `next/image` with explicit `width`, `height`, and accessible `alt` text.
3. **Lazy Loading:** All images below the fold are lazy-loaded automatically by Next.js.
