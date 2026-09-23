import { readFileSync } from "fs"
import { join } from "path"
import { readdirSync } from "fs"

/**
 * `lib/ai/` is the reusable core (AI_PLATFORM_PLAN.md §1 principle 6, §10):
 * it must not import anything from `lib/services/*` or `lib/ai-menvo/*`
 * (Menvo's own domain code) — that's what makes it exportable as a template
 * for client projects. This walks every .ts file under `lib/ai/` and fails
 * if any import crosses that boundary.
 */
function listTsFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return listTsFiles(full)
    return entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts") ? [full] : []
  })
}

describe("lib/ai/ boundaries", () => {
  it("never imports lib/services/* or lib/ai-menvo/*", () => {
    const root = join(__dirname, "..")
    const files = listTsFiles(root)
    expect(files.length).toBeGreaterThan(0)

    const offenders: string[] = []
    for (const file of files) {
      const content = readFileSync(file, "utf8")
      if (/from\s+["']@\/lib\/services\//.test(content) || /from\s+["']@\/lib\/ai-menvo\//.test(content)) {
        offenders.push(file)
      }
    }

    expect(offenders).toEqual([])
  })
})
