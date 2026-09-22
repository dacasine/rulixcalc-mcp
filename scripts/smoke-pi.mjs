/** Real stdio JSON-RPC checks for the exact Π delivery. No network rates. */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Decimal from 'decimal.js';

const D = Decimal.clone({ precision: 360 });
const pi = D.acos(-1), x = new D(180).div(pi);
const scalar = n => new D(n).toSignificantDigits(40).toFixed();
const cases = [
  ['root', '(90° in rad) - (pi/2)*1 rad', '0'],
  ['root-scaled', '((90° in rad) - (pi/2)*1 rad)*1e40', '0'],
  ['roundtrip', '(90° in rad) in °', '90'],
  ['half-turn', '180° in rad', scalar(pi)],
  ['sin-pi', 'sin(pi)', '0'],
  ['cos-pi', 'cos(pi)', '-1'],
  ['sin-half', 'sin(pi/2)', '1'],
  ['sin-three-halves', 'sin(3*pi/2)', '-1'],
  ['cos-half', 'cos(pi/2)', '0'],
  ['tau', '2*pi-tau', '0'],
  ['radian-cancellation', '(1 rad/1°)*pi', '180'],
  ['power', '(2*pi)^2-4*pi^2', '0'],
  ['tail', '((1 rad/1°)-57.29577951308232087679815481410517033241)*1e38',
    scalar(x.sub('57.29577951308232087679815481410517033241').mul('1e38'))],
  ['alias', 'angle = 90° in rad\nangle - (pi/2)*1 rad', '0'],
  ['line', '90° in rad\nline(1) - (pi/2)*1 rad', '0'],
  ['inverse-zero', '1/((90° in rad)-(pi/2)*1 rad)', { code: 'division-by-zero' }],
  ['order-refusal', 'abs(1 m)', { code: 'unsupported-pair' }],
];

const server = process.argv[2] ?? fileURLToPath(new URL('../dist/server.js', import.meta.url));
const child = spawn(process.execPath, [server], { stdio: ['pipe', 'pipe', 'inherit'] });
let text = '', id = 0;
const awaiting = new Map();
child.stdout.on('data', b => {
  text += b;
  let end;
  while ((end = text.indexOf('\n')) >= 0) {
    const line = text.slice(0, end); text = text.slice(end + 1);
    if (!line.trim()) continue;
    const message = JSON.parse(line);
    awaiting.get(message.id)?.(message); awaiting.delete(message.id);
  }
});
const timer = setTimeout(() => {
  child.kill(); process.exitCode = 1; throw new Error('MCP_SMOKE_TIMEOUT');
}, 30_000);
const call = (method, params) => new Promise(resolve => {
  const n = ++id; awaiting.set(n, resolve);
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: n, method, params }) + '\n');
});
try {
  const init = await call('initialize', { protocolVersion: '2025-06-18', capabilities: {},
    clientInfo: { name: 'pi-symbolic-smoke', version: '1' } });
  if (init.error) throw new Error('INITIALIZE');
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  const tools = await call('tools/list', {});
  if (!tools.result?.tools?.some(t => t.name === 'calculate')) throw new Error('MISSING_CALCULATE');
  let passed = 0;
  for (const [name, input, expected] of cases) {
    const response = await call('tools/call', { name: 'calculate', arguments: {
      text: input, rateSource: 'none', locale: 'fr-CH', languages: ['fr', 'en', 'de'],
    } });
    const value = response.result?.structuredContent?.lines?.at(-1)?.value;
    const ok = typeof expected === 'string'
      ? typeof value?.value === 'string' && value.value === expected
      : value?.code === expected.code;
    if (!ok) throw new Error(JSON.stringify({ name, expected, actual: value, responseError: response.error }));
    passed++;
  }
  console.log(JSON.stringify({ verdict: 'PASS', passed, total: cases.length, server }));
} finally {
  clearTimeout(timer); child.stdin.end(); child.kill();
}
