import { defineConfig } from 'tsup';
import { fileURLToPath } from 'node:url';

/**
 * The dist is fully SELF-CONTAINED (engine, rates, holidays, MCP SDK all
 * inlined): Claude Code does not run npm install for plugin MCP servers,
 * so `node dist/server.js` must work from a bare git clone.
 *
 * The @rulixcalc/* sources are resolved from the sibling checkout of
 * github.com/dacasine/rulixcalc (they will move to npm once published).
 */
const rulix = (pkg: string): string =>
  fileURLToPath(new URL(`../textual-calculator/core/packages/${pkg}/src/index.ts`, import.meta.url));

export default defineConfig({
  entry: { server: 'src/server.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node18',
  noExternal: [/.*/],
  clean: true,
  esbuildOptions(options) {
    options.alias = {
      '@rulixcalc/engine': rulix('engine'),
      '@rulixcalc/rates': rulix('rates'),
      '@rulixcalc/holidays-ch': rulix('holidays-ch'),
    };
  },
});
