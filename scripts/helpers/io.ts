import fs from "fs-extra";
import { resolve } from "path";

export function printTable(rows: Array<Record<string, any>>) {
  if (!rows || rows.length === 0) return console.log("(no rows)");
  const headers = Object.keys(rows[0]);
  const lens = headers.map((h) => Math.max(h.length, ...rows.map((r) => String(r[h] ?? "").length)));
  const headerLine = headers.map((h, i) => String(h).padEnd(lens[i])).join(" | ");
  const sep = lens.map((n) => "-".repeat(n)).join("-+-");
  console.log(headerLine);
  console.log(sep);
  for (const r of rows) console.log(headers.map((h, i) => String(r[h] ?? "").padEnd(lens[i])).join(" | "));
}

export async function writeArtifact(kind: string, id: string, data: any) {
  const ts = new Date().toISOString().replaceAll(":", "-");
  const dir = resolve("evals/logs");
  await fs.ensureDir(dir);
  const file = resolve(dir, `${ts}-${kind}-${id}.json`);
  await fs.writeJson(file, data, { spaces: 2 });
  return file;
}
