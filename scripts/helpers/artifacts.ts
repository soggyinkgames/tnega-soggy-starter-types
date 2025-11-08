import fs from "fs-extra";
import { resolve } from "path";

export async function updateIndex(filePath: string) {
  const idxPath = resolve("evals/logs/index.json");
  const entry = { file: filePath, ts: Date.now() };
  let idx: any[] = [];
  if (await fs.pathExists(idxPath)) {
    try { idx = await fs.readJson(idxPath); } catch { idx = []; }
  }
  idx.push(entry);
  await fs.writeJson(idxPath, idx, { spaces: 2 });
}

