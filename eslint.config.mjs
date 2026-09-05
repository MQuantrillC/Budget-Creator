import coreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**"],
  },
  ...coreWebVitals,
  {
    rules: {
      // This codebase deliberately loads async data (localStorage/Supabase)
      // into state from effects; flag new cases without failing the build.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
