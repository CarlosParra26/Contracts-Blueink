import fs from "fs";
import path from "path";

export function findMonorepoRoot(startDir = process.cwd()): string {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return path.resolve(startDir, "..", "..");
}

export function resolveTemplatesRoot(configured?: string): string {
  if (configured) return path.resolve(configured);
  return path.join(findMonorepoRoot(), "templates");
}
