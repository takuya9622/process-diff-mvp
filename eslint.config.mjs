import { defineConfig, globalIgnores } from "eslint/config";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import prettier from "eslint-config-prettier/flat";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const generatedFileGlobs = [".next/**", "out/**", "build/**", "next-env.d.ts"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    plugins: {
      "@eslint-community/eslint-comments": eslintComments,
    },
    rules: {
      "@eslint-community/eslint-comments/require-description": "error",
      "@typescript-eslint/no-explicit-any": [
        "error",
        {
          fixToUnknown: true,
          ignoreRestArgs: false,
        },
      ],
    },
  },
  prettier,
  globalIgnores(generatedFileGlobs),
]);

export default eslintConfig;
