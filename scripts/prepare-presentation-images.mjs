import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const projectImages = path.join(root, "public/images/projects");
const alignedImages = path.join(projectImages, "aligned");
const educationImages = path.join(root, "public/images/education");

await mkdir(alignedImages, { recursive: true });

const landscapePairs = [
  ["addition-before.jpeg", "addition-before.webp"],
  ["addition-after.jpeg", "addition-after.webp"],
  ["repair-before.jpeg", "repair-before.webp"],
  ["repair-after.jpeg", "repair-after.webp"],
  ["wall-before.jpeg", "wall-before.webp"],
  ["wall-after.jpeg", "wall-after.webp"],
];

for (const [source, output] of landscapePairs) {
  await sharp(path.join(projectImages, source))
    .rotate()
    .resize(1600, 1200, { fit: "cover", position: "centre" })
    .webp({ quality: 88, smartSubsample: true })
    .toFile(path.join(alignedImages, output));
}

for (const state of ["before", "after"]) {
  await sharp(path.join(projectImages, `fireplace-${state}.jpeg`))
    .rotate()
    .resize(1200, 1600, { fit: "cover", position: "centre" })
    .webp({ quality: 88, smartSubsample: true })
    .toFile(path.join(alignedImages, `fireplace-${state}.webp`));
}

// The entry pair was photographed from slightly different distances. These
// presentation crops align the door, brick courses, and viewing height for the
// interactive wipe while leaving the supplied originals untouched.
await sharp(path.join(projectImages, "entry-before.jpeg"))
  .rotate()
  .extract({ left: 126, top: 24, width: 943, height: 707 })
  .resize(1600, 1200)
  .webp({ quality: 90, smartSubsample: true })
  .toFile(path.join(alignedImages, "entry-before.webp"));

await sharp(path.join(projectImages, "entry-after.jpeg"))
  .rotate()
  .extract({ left: 155, top: 70, width: 1056, height: 792 })
  .resize(1600, 1200)
  .webp({ quality: 90, smartSubsample: true })
  .toFile(path.join(alignedImages, "entry-after.webp"));

for (const source of ["paint-covered-masonry.png", "selective-color-correction.png"]) {
  await sharp(path.join(educationImages, source))
    .resize(1600, 1067, { fit: "cover", position: "centre" })
    .webp({ quality: 88, smartSubsample: true })
    .toFile(path.join(educationImages, source.replace(".png", ".webp")));
}

console.log("Prepared aligned project imagery and education assets.");
