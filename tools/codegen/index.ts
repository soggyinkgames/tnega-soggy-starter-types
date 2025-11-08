import { Tool } from "../types";

export const codegenTool: Tool = {
  name: "codegen",
  async run(spec: any) {
    const lang = spec?.lang || "ts";
    const name = spec?.name || "Example";
    const code = lang === "ts"
      ? `export function ${name}(){ return "ok"; }`
      : `def ${name}():\n    return "ok"`;
    return { lang, name, code };
  }
};

export default codegenTool;

