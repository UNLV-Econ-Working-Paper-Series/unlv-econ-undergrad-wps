import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(repositoryRoot, "scripts", "assets", "og-image.svg");
const outputPath = path.join(repositoryRoot, "public", "assets", "brand", "og-image.png");
const source = await readFile(sourcePath);

await sharp(source, { density: 144 })
  .resize(1200, 630, { fit: "fill" })
  .png({ compressionLevel: 9, palette: true })
  .toFile(outputPath);

console.log(`Generated ${path.relative(repositoryRoot, outputPath)} at 1200x630.`);
