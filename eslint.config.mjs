/**
 * Tooling · ESLint (flat config, ESLint 10)
 *
 * Ratchet strategy: rules with a large pre-existing backlog (578 `any`, 214
 * unused vars on 2026-10-03) are warnings in legacy code so CI can block on
 * everything else today. In the reference-architecture folders (ADR 0006)
 * they are errors, so new code never adds to the debt. When a legacy folder
 * is migrated to the blueprint, it moves into STRICT_PATHS.
 */
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const LEGACY_BACKLOG_RULES = [
  "@typescript-eslint/no-explicit-any",
  "@typescript-eslint/no-unused-vars",
  "@typescript-eslint/no-require-imports",
  "@typescript-eslint/ban-ts-comment",
  "@typescript-eslint/no-wrapper-object-types",
  "@typescript-eslint/no-empty-object-type",
  "@next/next/no-html-link-for-pages",
  "react/no-unescaped-entities",
  "react-hooks/set-state-in-effect",
  "react-hooks/immutability",
  "react-hooks/purity",
  "react-hooks/preserve-manual-memoization",
  "react-hooks/refs",
  "prefer-const",
]

const STRICT_PATHS = [
  "lib/domain/**",
  "lib/repositories/**",
  "lib/ports/**",
  "lib/query/**",
  "lib/openapi/**",
  "lib/agents/**",
  "lib/errors/**",
  "e2e/**",
]

const unusedVarsOptions = { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", "node_modules/**", ".worktrees/**", "public/**", "coverage/**", "playwright-report/**", "test-results/**"],
  },
  {
    // eslint-plugin-react's "detect" calls an API removed in ESLint 10.
    settings: { react: { version: "19" } },
    rules: {
      "no-unused-vars": "off",
      ...Object.fromEntries(LEGACY_BACKLOG_RULES.map((rule) => [rule, "warn"])),
      "@typescript-eslint/no-unused-vars": ["warn", unusedVarsOptions],
    },
  },
  {
    files: STRICT_PATHS,
    rules: {
      ...Object.fromEntries(LEGACY_BACKLOG_RULES.map((rule) => [rule, "error"])),
      "@typescript-eslint/no-unused-vars": ["error", unusedVarsOptions],
    },
  },
]

export default config
