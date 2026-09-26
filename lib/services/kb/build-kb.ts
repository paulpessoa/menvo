import fs from "fs"
import path from "path"

export interface KbArticleLink {
  label: string
  url: string
}

export interface KbIndexItem {
  id: string
  title: string
  category: string
  audience: string[]
  tags: string[]
  summary: string
  content: string
  links: KbArticleLink[]
  sourcePath: string
}

/**
 * Lightweight and robust parser for YAML frontmatter in Markdown files.
 * Avoids extra third-party dependencies while supporting arrays, strings, and key-values.
 */
function parseFrontmatterAndContent(fileContent: string): { data: Record<string, any>; content: string } {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    return { data: {}, content: fileContent.trim() }
  }

  const rawYaml = match[1]
  const markdownBody = match[2].trim()
  const data: Record<string, any> = {}

  let currentKey = ""

  for (const line of rawYaml.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    // Array item indented or dashed (e.g. - label: Foo / url: /bar or - mentee)
    if (trimmed.startsWith("- ")) {
      const itemVal = trimmed.replace(/^- \s*/, "").trim()
      if (currentKey) {
        if (!Array.isArray(data[currentKey])) {
          data[currentKey] = []
        }
        if (itemVal.includes(":") && !itemVal.startsWith("[")) {
          // Object item like label: Foo
          const [k, ...vParts] = itemVal.split(":")
          const subObj: Record<string, string> = { [k.trim()]: vParts.join(":").trim() }
          data[currentKey].push(subObj)
        } else {
          data[currentKey].push(itemVal.replace(/^["']|["']$/g, ""))
        }
      }
      continue
    }

    if (line.startsWith("  ") && currentKey && Array.isArray(data[currentKey]) && data[currentKey].length > 0) {
      // Continuation of object in array (e.g. url: /mentors)
      const [k, ...vParts] = trimmed.split(":")
      const lastObj = data[currentKey][data[currentKey].length - 1]
      if (typeof lastObj === "object" && lastObj !== null) {
        lastObj[k.trim()] = vParts.join(":").trim().replace(/^["']|["']$/g, "")
      }
      continue
    }

    // Key-value pair
    const colonIdx = line.indexOf(":")
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim()
      const value = line.slice(colonIdx + 1).trim()
      currentKey = key

      if (!value) {
        data[key] = []
        continue
      }

      // Inline array like [mentee, admin]
      if (value.startsWith("[") && value.endsWith("]")) {
        const items = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean)
        data[key] = items
        continue
      }

      // String value
      data[key] = value.replace(/^["']|["']$/g, "")
    }
  }

  return { data, content: markdownBody }
}

/**
 * Builds `kb/_index.json`, `public/llms.txt`, and `public/llms-full.txt`.
 */
export async function buildKnowledgeBase() {
  const rootDir = process.cwd()
  const kbDir = path.join(rootDir, "kb")
  const publicDir = path.join(rootDir, "public")
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br"

  if (!fs.existsSync(kbDir)) {
    console.warn("[build-kb] Diretório kb/ não encontrado.")
    return
  }

  const items: KbIndexItem[] = []

  function traverseDir(dir: string, category = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        traverseDir(fullPath, category ? `${category}/${entry.name}` : entry.name)
      } else if (entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_")) {
        const rawContent = fs.readFileSync(fullPath, "utf-8")
        const { data, content } = parseFrontmatterAndContent(rawContent)
        const relPath = path.relative(kbDir, fullPath).replace(/\\/g, "/")
        const cat = category || path.dirname(relPath)

        const id = data.id || path.basename(entry.name, ".md")
        const title = data.title || id
        const audience = Array.isArray(data.audience) ? data.audience : ["all"]
        const tags = Array.isArray(data.tags) ? data.tags : []
        const summary = data.summary || content.slice(0, 200).replace(/\n/g, " ")
        const links = Array.isArray(data.links) ? data.links : []

        items.push({
          id,
          title,
          category: cat,
          audience,
          tags,
          summary,
          content,
          links,
          sourcePath: relPath
        })
      }
    }
  }

  traverseDir(kbDir)

  // Sort items deterministically by category and title
  items.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title))

  // 1. Write kb/_index.json
  const indexPath = path.join(kbDir, "_index.json")
  fs.writeFileSync(indexPath, JSON.stringify(items, null, 2), "utf-8")
  console.info(`[build-kb] Gerado ${indexPath} com ${items.length} artigos indexados.`)

  // Ensure public/ directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  // 2. Write public/llms.txt (Standard summary format)
  let llmsTxt = `# Menvo — Plataforma de Mentores Voluntários e Carreira em Tecnologia\n\n`
  llmsTxt += `> A Menvo é a maior plataforma brasileira de mentores voluntários e gratuita 1-a-1 em tecnologia, dados, design e produtos.\n\n`
  llmsTxt += `## Base de Conhecimento e Guias\n\n`

  for (const item of items) {
    const primaryUrl = item.links[0]?.url ? `${baseUrl}${item.links[0].url}` : `${baseUrl}`
    llmsTxt += `- [${item.title}](${primaryUrl}): ${item.summary}\n`
  }

  const llmsTxtPath = path.join(publicDir, "llms.txt")
  fs.writeFileSync(llmsTxtPath, llmsTxt, "utf-8")
  console.info(`[build-kb] Gerado ${llmsTxtPath}`)

  // 3. Write public/llms-full.txt (Full text format for comprehensive context)
  let llmsFullTxt = `# Menvo — Base de Conhecimento Completa\n\n`
  llmsFullTxt += `plataforma brasileira de mentores voluntários 1-a-1 e diagnósticos de carreira.\nWebsite: ${baseUrl}\n\n`

  for (const item of items) {
    llmsFullTxt += `---\n\n## ${item.title}\n\n`
    llmsFullTxt += `**Categoria:** ${item.category} | **Público:** ${item.audience.join(", ")}\n`
    llmsFullTxt += `**Tags:** ${item.tags.join(", ")}\n\n`
    llmsFullTxt += `${item.content}\n\n`
    if (item.links.length > 0) {
      llmsFullTxt += `**Links Úteis:**\n`
      for (const l of item.links) {
        llmsFullTxt += `- ${l.label}: ${baseUrl}${l.url}\n`
      }
      llmsFullTxt += `\n`
    }
  }

  const llmsFullTxtPath = path.join(publicDir, "llms-full.txt")
  fs.writeFileSync(llmsFullTxtPath, llmsFullTxt, "utf-8")
  console.info(`[build-kb] Gerado ${llmsFullTxtPath}`)
}

// Run standalone if invoked via CLI
if (require.main === module || process.argv[1]?.endsWith("build-kb.ts")) {
  buildKnowledgeBase().catch((err) => {
    console.error("[build-kb] Erro na compilação da base de conhecimento:", err)
    process.exit(1)
  })
}
