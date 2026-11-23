import * as fs from "node:fs";
function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
}
const inRoot = process.env.MAKEFUN_INPUT_DIR || flag("--input") || process.argv[2] || "/input";
const outRoot = process.env.MAKEFUN_OUTPUT_DIR || flag("--output") || process.argv[3] || "/output";
function run(p: Buffer, inp: Buffer): [Buffer, number] {
  const s: number[] = [];
  const c: number[] = [];
  const m = new Int32Array(256);
  const out: number[] = [];
  let pc = 0, steps = 0, ip = 0;
  const pop = (): number => s.pop() as number;
  const push = (v: number): void => { if (s.length >= 256) throw 3; s.push(v | 0); };
  const need = (n: number): void => { if (s.length < n) throw 2; };
  const u16 = (o: number): number => p[o] | (p[o + 1] << 8);
  const s16 = (o: number): number => { const v = u16(o); return v >= 32768 ? v - 65536 : v; };
  const bin = (f: (a: number, b: number) => number): void => { need(2); const b = pop(); push(f(pop(), b)); };
  const wstr = (t: string): void => { if (out.length + t.length > 65536) throw 11; for (let i = 0; i < t.length; i++) out.push(t.charCodeAt(i) & 255); };
  try {
    for (;;) {
      if (steps >= 1000000) throw 10;
      if (pc < 0 || pc >= p.length) throw 9;
      const op = p[pc];
      let il = 0;
      if (op === 1) il = 1;
      else if (op === 2) il = 4;
      else if (op >= 0x30 && op <= 0x33) il = 2;
      else if (!(op <= 7 || (op >= 0x10 && op <= 0x22) || op === 0x34 || (op >= 0x40 && op <= 0x41) || (op >= 0x50 && op <= 0x53))) throw 5;
      if (pc + 1 + il > p.length) throw 9;
      const nx = pc + 1 + il;
      steps++;
      switch (op) {
        case 0: return [Buffer.from(out), 0];
        case 1: { const b = p[pc + 1]; push(b >= 128 ? b - 256 : b); break; }
        case 2: push(p.readInt32LE(pc + 1)); break;
        case 3: need(1); pop(); break;
        case 4: need(1); push(s[s.length - 1]); break;
        case 5: { need(2); const n = s.length, t = s[n - 1]; s[n - 1] = s[n - 2]; s[n - 2] = t; break; }
        case 6: need(2); push(s[s.length - 2]); break;
        case 7: { need(3); const n = s.length, a = s[n - 3]; s[n - 3] = s[n - 2]; s[n - 2] = s[n - 1]; s[n - 1] = a; break; }
        case 0x10: bin((a, b) => (a + b) | 0); break;
        case 0x11: bin((a, b) => (a - b) | 0); break;
        case 0x12: bin((a, b) => Math.imul(a, b)); break;
        case 0x13: need(2); { const b = pop(); if (b === 0) throw 4; push(Math.trunc(pop() / b)); } break;
        case 0x14: need(2); { const b = pop(); if (b === 0) throw 4; push(pop() % b); } break;
        case 0x15: need(2); { const b = pop(); if (b === 0) throw 4; push(Math.trunc((pop() >>> 0) / (b >>> 0))); } break;
        case 0x16: need(2); { const b = pop(); if (b === 0) throw 4; push((pop() >>> 0) % (b >>> 0)); } break;
        case 0x17: need(1); push(-pop()); break;
        case 0x18: bin((a, b) => a & b); break;
        case 0x19: bin((a, b) => a | b); break;
        case 0x1a: bin((a, b) => a ^ b); break;
        case 0x1b: need(1); push(~pop()); break;
        case 0x1c: bin((a, b) => a << (b & 31)); break;
        case 0x1d: bin((a, b) => a >> (b & 31)); break;
        case 0x1e: bin((a, b) => a >>> (b & 31)); break;
        case 0x20: bin((a, b) => (a === b ? 1 : 0)); break;
        case 0x21: bin((a, b) => (a < b ? 1 : 0)); break;
        case 0x22: bin((a, b) => ((a >>> 0) < (b >>> 0) ? 1 : 0)); break;
        case 0x30: pc = nx + s16(pc + 1); continue;
        case 0x31: need(1); if (pop() === 0) { pc = nx + s16(pc + 1); continue; } break;
        case 0x32: need(1); if (pop() !== 0) { pc = nx + s16(pc + 1); continue; } break;
        case 0x33: if (c.length >= 64) throw 7; c.push(nx); pc = u16(pc + 1); continue;
        case 0x34: if (!c.length) throw 8; pc = c.pop() as number; continue;
        case 0x40: need(1); { const a = pop(); if (a < 0 || a > 255) throw 6; push(m[a]); } break;
        case 0x41: need(2); { const a = pop(), v = pop(); if (a < 0 || a > 255) throw 6; m[a] = v | 0; } break;
        case 0x50: need(1); wstr(String(pop())); break;
        case 0x51: need(1); { const v = pop(); if (out.length + 1 > 65536) throw 11; out.push(v & 255); } break;
        case 0x52: push(ip < inp.length ? inp[ip++] : -1); break;
        case 0x53: need(1); return [Buffer.from(out), pop() & 255];
      }
      pc = nx;
    }
  } catch (e) {
    if (typeof e === "number") return [Buffer.from(out), e];
    throw e;
  }
}
const ids = fs.readdirSync(inRoot).filter((d) => /^i\d{3}$/.test(d)).sort();
for (const id of ids) {
  const dir = inRoot + "/" + id;
  const prog = fs.readFileSync(dir + "/program.bin");
  let inp = Buffer.alloc(0);
  try { inp = fs.readFileSync(dir + "/input.bin"); } catch { inp = Buffer.alloc(0); }
  const [out, exit] = run(prog, inp);
  const od = outRoot + "/" + id;
  fs.mkdirSync(od, { recursive: true });
  fs.writeFileSync(od + "/stdout.bin", out);
  fs.writeFileSync(od + "/exit.txt", exit + "\n");
}
