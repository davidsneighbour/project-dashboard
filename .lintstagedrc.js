/**
 * @see https://github.com/lint-staged/lint-staged
 * @type {import('lint-staged').Configuration}
 */
export default {
  '.github/workflows/*.{yml,yaml}': ['zizmor'],

  '!(CHANGELOG)**/*.{md,mdx}': [
    'markdownlint-cli2 --config ./node_modules/@dnbhq/markdownlint-config/.markdownlint-cli2.jsonc',
    'cspell',
  ],

  '*.{js,jsx,mjs,cjs,json,jsonc,css}': [
    'biome check --write --no-errors-on-unmatched',
  ],

  // dnb-secretlint requires --no-glob so it scans exactly the staged files
  // lint-staged passes it, instead of re-expanding its own "**/*" default.
  '*.{js,jsx,mjs,cjs,ts,json,jsonc,json5,md,mdx,yml,yaml,toml,txt,html,css}': [
    'dnb-secretlint --no-glob',
  ],
  '.{npmrc,ncurc,nvmrc,gitignore,dockerignore}': ['dnb-secretlint --no-glob'],
  '.env*': ['dnb-secretlint --no-glob'],
};
