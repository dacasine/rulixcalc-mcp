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

## Why this makes an agent *fast*, not just correct

An LLM asked to compute has two classical paths, and both are slow or unsafe:

1. **Mental arithmetic** — instantaneous but unverifiable. Hallucinated numbers look exactly like correct ones; calendar math (day-of-week, month lengths, leap years) and multi-digit multiplication are documented weak spots.
2. **Write-and-run code** — a Python/Node snippet in a sandbox: generate the script, execute, read the output, often fix a bug and re-run. That is 2–5 round-trips and several seconds — and the *script itself* inherits the classic traps: binary floats (`0.1+0.2`), the machine's timezone in `datetime.now()`, naive date libs, and zero knowledge of the Jeûne genevois.

With this plugin the same work is **one tool call, milliseconds, pre-verified**:

| Task | Classical path | With `calculate` |
|---|---|---|
| `aujourd'hui + 45 jours ouvrables` (canton GE) | script: enumerate days, skip weekends, *know* Geneva's holidays incl. computing Easter and the Jeûne genevois — 4 distinct failure points | one line, one call: `28.9.2026` |
| `CHF 1'250.50 + 1.000,50 EUR` — Swiss apostrophes, EU decimal comma | mentally re-parse ambiguous separators (`1.234`: thousands or decimal?) then normalize before any code — the #1 source of silent errors | pass the text **verbatim**; the locale grammar is explicit, never guessed |
| `31.01.2025 + 1 mois`, `vendredi prochain + 2 semaines`, `2h30 + 1h45`, `0xFF + 1` | each format needs its own parsing/handling code | native tokens of the language |
| `43 CHF in EUR` at official rates | find a rate API, call it, hope it's the *right* (fiscal) rate, no provenance | OFDF/ECB snapshot, dated + sourced in the reply |
| `100 CHF + 5 km` (nonsense input) | a script happily returns `105` | typed error `unit-mismatch` — the agent *knows* to ask instead of inventing |

Three structural reasons this holds up:

- **The messy input goes in untouched.** No normalization step by the model = no tokens spent rewriting, and no opportunity to mis-rewrite. The engine's lexer owns `1'250.50` vs `1.250,50`, `43×2`, `2h30`, prefix `CHF 120.00`.
- **The engine is pure and pre-verified.** Clock, timezone, FX rates and holidays are injected parameters (reported back in the provenance block), so results are replayable — unlike ad-hoc scripts that silently depend on the sandbox's clock and locale. Behind the call sit ~250 spec-traced conformance cases and a generative battery (~1.6M cases in deep mode) proving, among others, that unknown vocabulary can never silently alter a result.
- **Errors are data, not vibes.** A wrong script and a right script both print a number. Here the impossible returns a typed code (`unit-mismatch`, `rates-unavailable`, `holidays-unavailable`, `anchor-required`) that the agent can act on — retry with context, or ask the user — instead of shipping a confident guess.

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
