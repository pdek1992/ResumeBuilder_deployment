import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      "assets/**",
      "gh-pages/**",
      "templates/**",
      "public/**",
      "node_modules/**",
      ".next/**",
    ],
  },
  ...nextVitals,
];

export default config;
