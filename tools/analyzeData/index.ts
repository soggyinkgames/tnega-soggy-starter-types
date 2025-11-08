export async function runTool(spec: any) {
  const arr: number[] = Array.isArray(spec?.data) ? spec.data : [];
  const n = arr.length;
  const sum = arr.reduce((a,b)=>a+b,0);
  return { count: n, sum, mean: n ? sum/n : 0 };
}

