import { globalIgnores } from "eslint/config";

const eslintConfig = [
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
];

export default eslintConfig;
