import { existsSync } from "node:fs";

export function publicAssetExists(assetPath: string): boolean {
  if (!assetPath.startsWith("/")) {
    return false;
  }

  try {
    return existsSync(new URL(`../../public${assetPath}`, import.meta.url));
  } catch {
    return false;
  }
}
