import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "prisma/seed.js",   // plain JS seed file — allow require()
  ]),
  {
    rules: {
      // `any` is unavoidable in auth callbacks, Prisma dynamic where clauses,
      // and NextAuth session typing — downgrade from error to off.
      "@typescript-eslint/no-explicit-any": "off",
      // seed.js uses CommonJS require — excluded via globalIgnores above,
      // but belt-and-suspenders disable here too.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
