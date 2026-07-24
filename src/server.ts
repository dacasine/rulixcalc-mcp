#!/usr/bin/env node
/**
 * RulixCalc MCP server — exact, typed, auditable calculation for AI agents.
 *
 * Why an agent should delegate arithmetic here instead of doing it inline:
 * - exact decimal arithmetic (40 significant digits) + exact rationals:
 *   0.1 + 0.2 is 0.3, 10/3 × 3 is 10 — never float noise;
 * - typed values: percentages, units (dimensional algebra), currencies,
 *   dates (true calendar math), clock times, Swiss workdays with public
 *   holidays — and typed ERRORS instead of confident wrong answers;
 * - auditability: every response reports the injected clock and the FX
 *   rate provenance (source + as-of date) used for conversions. Same
 *   inputs + same context ⇒ same results, replayable.
 *
 * The engine itself is pure; THIS server is the impure boundary that
 * injects the clock and fetches official FX snapshots (OFDF/ECB).
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createEngine, type EngineContext, type SheetResult } from '@rulixcalc/engine';
import {
  createSnapshotProvider,
  fetchRateSnapshot,
  type RateProviderId,
  type RateSnapshot,
} from '@rulixcalc/rates';
import { createSwissHolidayProvider } from '@rulixcalc/holidays-ch';

const holidays = createSwissHolidayProvider();

// -- FX snapshot cache: one per source(+date), refreshed daily ---------------
const snapshotCache = new Map<string, { snapshot: RateSnapshot; day: string }>();

async function getSnapshot(source: RateProviderId, date?: string): Promise<RateSnapshot> {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${source}:${date ?? 'latest'}`;
  const hit = snapshotCache.get(key);
  if (hit && hit.day === day) return hit.snapshot;
  const snapshot = await fetchRateSnapshot(source, date !== undefined ? { date } : undefined);
  snapshotCache.set(key, { snapshot, day });
  return snapshot;
}

// -- formatting helpers ------------------------------------------------------

function renderLines(text: string, sheet: SheetResult): string {
  const sources = text.split('\n');
  const width = Math.min(48, Math.max(10, ...sources.map((l) => l.length)));
  return sheet.lines
    .map((line, i) => {
      const src = (sources[i] ?? '').padEnd(width);
      const error = line.diagnostics.find((d) => d.severity === 'error');
      if (error) return `${src} │ ⚠ ${error.code}: ${error.message}`;
      if (line.display !== null) return `${src} │ ${line.display}`;
      return src.trimEnd();
    })
    .join('\n');
}

// -- server ------------------------------------------------------------------

const server = new McpServer({ name: 'rulixcalc', version: '0.1.0' });

const RATE_SOURCES = ['swiss-fiscal', 'ecb', 'none'] as const;

server.registerTool(
  'calculate',
  {
    title: 'RulixCalc — exact natural-language calculation',
    description: [
      'Evaluate a multi-line natural-language calculation sheet with EXACT decimal arithmetic.',
      'Use this for ANY arithmetic instead of computing inline: percentages with contextual',
      'semantics (100 + 10% + 10% = 121; 20% de 300; 15% on/off), units with dimensional',
      'algebra (2 km + 500 m; 500 kcal in kJ; 120 km/h * 2 h), currency conversion at official',
      'rates (43 CHF in EUR — OFDF Swiss fiscal or ECB, dated, provenance reported), true',
      'calendar math in FR/EN/DE (25 décembre - aujourd\'hui; vendredi prochain + 2 semaines;',
      'dans 3 semaines), SWISS WORKDAYS with cantonal public holidays (aujourd\'hui + 45 jours',
      'ouvrables, region CH/CH-GE/CH-VD/CH-ZH), clock times (14:30 + 2h; time in Tokyo),',
      'math functions (sqrt, log, round(x, 2), 5!, 17 mod 5), finance phrases (intérêts de',
      '100000 CHF à 4% sur 10 ans; mensualité de 500000 à 2% sur 20 ans), variables (x = 30),',
      'line references (line(1) + 5 jours) and section aggregates (total, moyenne, median).',
      'Lines of prose are comments; results carry TYPED errors instead of wrong numbers.',
      'The response includes the clock and FX-rate provenance actually used — quote them',
      'when the user needs auditability.',
    ].join(' '),
    inputSchema: {
      text: z.string().describe('The calculation sheet: one expression per line; markdown headings (#) start sections; prose lines are comments.'),
      locale: z.string().optional().describe('BCP 47 locale driving number grammar and date order (default fr-CH: apostrophe groups, dot/comma decimal, d/m/y).'),
      languages: z.array(z.string()).optional().describe("Lexicon packs, additive (default ['fr','en','de'])."),
      timezone: z.string().optional().describe('IANA timezone for today/aujourd\'hui and clock words (default Europe/Zurich).'),
      financial: z.boolean().optional().describe('Financial mode: bare numbers are presumed money (exactly one factor per product carries the currency — never CHF²). Default false.'),
      currency: z.string().optional().describe('Default currency for financial mode (default CHF).'),
      region: z.string().optional().describe('Public-holiday region for workday arithmetic: CH, CH-GE, CH-VD, CH-ZH (default CH).'),
      rateSource: z.enum(RATE_SOURCES).optional().describe('FX rates: swiss-fiscal (OFDF/AFC daily, default), ecb (eurofxref), or none (conversions become typed errors).'),
      rateDate: z.string().optional().describe('ISO date for historical rates (OFDF: any past day; ECB: ~90-day window).'),
      monthlyAverage: z.boolean().optional().describe('Use the OFDF MONTHLY AVERAGE rates (currently published month) instead of daily rates. swiss-fiscal only.'),
    },
  },
  async (args) => {
    const now = new Date().toISOString();
    const rateSource = args.rateSource ?? 'swiss-fiscal';

    let snapshot: RateSnapshot | null = null;
    let ratesNote = 'rates disabled — currency conversions yield typed errors';
    if (rateSource !== 'none') {
      try {
        if (args.monthlyAverage) {
          if (rateSource !== 'swiss-fiscal') throw new Error('monthly averages are OFDF-only');
          snapshot = await getSnapshot('swiss-fiscal-monthly');
        } else {
          snapshot = await getSnapshot(rateSource, args.rateDate);
        }
        ratesNote = `${snapshot.source} · ${snapshot.asOf}`;
      } catch (cause) {
        ratesNote = `rate fetch FAILED (${cause instanceof Error ? cause.message : String(cause)}) — conversions yield typed errors`;
      }
    }

    const context: EngineContext = {
      locale: args.locale ?? 'fr-CH',
      languages: args.languages ?? ['fr', 'en', 'de'],
      now,
      timezone: args.timezone ?? 'Europe/Zurich',
      holidays,
      region: args.region ?? 'CH',
      ...(args.financial && { financial: { currency: args.currency ?? 'CHF' } }),
      ...(snapshot !== null && { rates: createSnapshotProvider(snapshot) }),
    };

    const t0 = performance.now();
    const sheet = createEngine(context).evaluateSheet(args.text);
    const engineMs = performance.now() - t0;
    const hasError = sheet.lines.some((l) => l.diagnostics.some((d) => d.severity === 'error'));

    const provenance = [
      `clock: ${now} (${context.timezone})`,
      `fx: ${ratesNote}`,
      `holidays: ${context.region}`,
      ...(args.financial ? [`financial mode: ${args.currency ?? 'CHF'}`] : []),
      `engine: ${engineMs.toFixed(1)} ms`,
    ].join(' | ');

    return {
      content: [
        {
          type: 'text' as const,
          text: `${renderLines(args.text, sheet)}\n\n[${provenance}]`,
        },
      ],
      structuredContent: {
        lines: sheet.lines.map((l) => ({
          value: l.value,
          display: l.display,
          diagnostics: l.diagnostics,
          references: l.references,
        })),
        provenance: { now, timezone: context.timezone, rates: ratesNote, region: context.region, engineMs },
      },
      isError: false,
      _meta: { hasLineErrors: hasError },
    };
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('rulixcalc MCP server running on stdio'); // stderr only — stdout is JSON-RPC
}

main().catch((error) => {
  console.error('rulixcalc MCP fatal:', error);
  process.exit(1);
});
