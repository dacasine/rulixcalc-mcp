/**
 * Smoke test: drive the built server over real stdio JSON-RPC —
 * initialize, list tools, and run a battery of calculate calls.
 */
import { spawn } from 'node:child_process';

const child = spawn('node', ['dist/server.js'], { stdio: ['pipe', 'pipe', 'inherit'] });
const send = (msg) => child.stdin.write(JSON.stringify(msg) + '\n');

let buffer = '';
const responses = [];
child.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (line) responses.push(JSON.parse(line));
  }
});

send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'smoke', version: '0' } } });
send({ jsonrpc: '2.0', method: 'notifications/initialized' });
send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });

const CALLS = [
  { text: '2*25*15%', financial: true },
  { text: '43 CHF in EUR' },
  { text: "aujourd'hui + 45 jours ouvrables", region: 'CH-GE' },
  { text: '# Devis\n12.5 h * 350 CHF/h\n8.1% sur line(2)\ntotal' },
  { text: 'sqrt(-1)' },
];
CALLS.forEach((args, i) => send({ jsonrpc: '2.0', id: 10 + i, method: 'tools/call', params: { name: 'calculate', arguments: args } }));

setTimeout(() => {
  child.kill();
  const tools = responses.find((r) => r.id === 2)?.result?.tools ?? [];
  console.log('tools:', tools.map((t) => t.name).join(', ') || 'NONE');
  let failed = false;
  for (let i = 0; i < CALLS.length; i++) {
    const r = responses.find((x) => x.id === 10 + i);
    const text = r?.result?.content?.[0]?.text;
    if (!text) { failed = true; console.log(`call ${i}: NO RESPONSE`); continue; }
    console.log(`--- ${JSON.stringify(CALLS[i].text)}`);
    console.log(text.split('\n').map((l) => '    ' + l).join('\n'));
  }
  process.exit(failed || tools.length === 0 ? 1 : 0);
}, 5000);
