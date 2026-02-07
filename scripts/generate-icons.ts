/**
 * Generate favicon.ico, apple-icon.png, and PWA icons from the icon SVG.
 *
 * Uses sharp (bundled with Next.js) to convert SVG to PNG/ICO.
 *
 * Usage: npx tsx scripts/generate-icons.ts
 */

import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// The icon SVG with explicit colors on dark background for rasterization
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="80" fill="#0a0a0f"/>
  <g transform="translate(96, 96) scale(6.667)">
    <circle cx="24" cy="24" r="22" stroke="white" stroke-width="2.5" fill="none"/>
    <polygon
      points="24,10 33.5,17 30,28.5 18,28.5 14.5,17"
      stroke="white"
      stroke-width="2"
      fill="none"
      stroke-linejoin="round"
    />
    <line x1="24" y1="10" x2="24" y2="2" stroke="white" stroke-width="1.5"/>
    <line x1="33.5" y1="17" x2="44" y2="12" stroke="white" stroke-width="1.5"/>
    <line x1="30" y1="28.5" x2="40" y2="38" stroke="white" stroke-width="1.5"/>
    <line x1="18" y1="28.5" x2="8" y2="38" stroke="white" stroke-width="1.5"/>
    <line x1="14.5" y1="17" x2="4" y2="12" stroke="white" stroke-width="1.5"/>
  </g>
</svg>`;

// Helper: Create a BMP-format ICO from a raw RGBA buffer
function createIco(pngBuffer: Buffer, size: number): Buffer {
  // ICO file format:
  // Header (6 bytes) + Directory entry (16 bytes) + PNG data
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(1, 4); // Number of images

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(size === 256 ? 0 : size, 0); // Width (0 means 256)
  dirEntry.writeUInt8(size === 256 ? 0 : size, 1); // Height (0 means 256)
  dirEntry.writeUInt8(0, 2); // Color palette
  dirEntry.writeUInt8(0, 3); // Reserved
  dirEntry.writeUInt16LE(1, 4); // Color planes
  dirEntry.writeUInt16LE(32, 6); // Bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // Image data size
  dirEntry.writeUInt32LE(22, 12); // Offset to image data (6 + 16 = 22)

  return Buffer.concat([header, dirEntry, pngBuffer]);
}

async function main() {
  const svgBuffer = Buffer.from(iconSvg);

  // Ensure output directories exist
  mkdirSync(join(ROOT, "public", "icons"), { recursive: true });

  // Generate 512x512 PWA icon
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  writeFileSync(join(ROOT, "public", "icons", "icon-512x512.png"), png512);
  console.log("Created: public/icons/icon-512x512.png (512x512)");

  // Generate 192x192 PWA icon
  const png192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  writeFileSync(join(ROOT, "public", "icons", "icon-192x192.png"), png192);
  console.log("Created: public/icons/icon-192x192.png (192x192)");

  // Generate 180x180 Apple touch icon
  const png180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  writeFileSync(join(ROOT, "src", "app", "apple-icon.png"), png180);
  console.log("Created: src/app/apple-icon.png (180x180)");

  // Generate 32x32 PNG for ICO
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const icoBuffer = createIco(png32, 32);
  writeFileSync(join(ROOT, "src", "app", "favicon.ico"), icoBuffer);
  console.log("Created: src/app/favicon.ico (32x32 ICO)");

  console.log("\nAll icons generated successfully!");
}

main().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
