# rulixcalc-mcp

**Exact, typed, auditable calculation for Claude** — a Claude plugin exposing the [RulixCalc](https://github.com/dacasine/rulixcalc) engine as an MCP tool, so agents delegate arithmetic instead of hallucinating it.

```
2*25*15%                          │ 7.50 CHF        (financial mode)
43 CHF in EUR                     │ 45.80 EUR       (OFDF fiscal rates, dated)
aujourd'hui + 45 jours ouvrables  │ 28.9.2026       (Swiss holidays, canton-aware)
12.5 h * 350 CHF/h                │ 4'375.00 CHF
8.1% sur line(2)                  │ 4'729.38 CHF
sqrt(-1)                          │ ⚠ inexact: square root of a negative number

[clock: 2026-07-24T20:00Z (Europe/Zurich) | fx: OFDF/AFC · 2026-07-24 | holidays: CH]
```

## Why

- **Exact decimal arithmetic** (40 significant digits) + exact rationals: `0.1 + 0.2` is `0.3`, `10/3 × 3` is `10`.
- **Typed values**: contextual percentages (`100 + 10% + 10% = 121`), units with dimensional algebra, currencies, true calendar math (FR/EN/DE), clock times, **Swiss workdays with cantonal public holidays**, finance phrases.
- **Typed errors, never a confident wrong number**: unknown vocabulary, unit mismatches and impossible operations fail loudly.
- **Auditable**: every response reports the injected clock and the FX-rate provenance (source + as-of date) actually used. Same inputs + same context ⇒ same results.

## Install (Claude Code)

```bash
claude plugin marketplace add dacasine/rulixcalc-mcp
claude plugin install rulixcalc@rulixcalc
```

Local test without installing:

```bash
git clone https://github.com/dacasine/rulixcalc-mcp
claude --plugin-dir ./rulixcalc-mcp
```

Any other MCP client: run `node dist/server.js` as a stdio server — `dist/` is committed and fully self-contained (no `npm install` needed at runtime).

## The tool

One tool, `calculate`. Input: a multi-line sheet (`text`), plus optional context — `locale` (default `fr-CH`), `languages` (`['fr','en','de']`), `timezone` (`Europe/Zurich`), `financial` + `currency` (bare numbers presumed money, default CHF), `region` for holidays (`CH`, `CH-GE`, `CH-VD`, `CH-ZH`), `rateSource` (`swiss-fiscal` default / `ecb` / `none`), `rateDate` (historical), `monthlyAverage` (OFDF monthly average rates).

Output: per-line results (text table + structured JSON with typed values, diagnostics and resolved line references) and the provenance block.

## Development

`dist/server.js` is a single-file bundle (engine + rates + holidays + MCP SDK). To rebuild you need a sibling checkout of [`dacasine/rulixcalc`](https://github.com/dacasine/rulixcalc) (npm publication of `@rulixcalc/*` is pending):

```bash
npm install
npm run build     # bundles ../textual-calculator/core/packages/* into dist/
npm run smoke     # drives the built server over real stdio JSON-RPC
```

## License

MIT — engine, data adapters (OFDF/ECB rates, Swiss holidays) and this plugin.
