import sharp from "sharp";
import fs from "fs";
import path from "path";

const inputImagePath = path.join(process.cwd(), "assets", "icon.svg");
const outputImagePath = path.join(process.cwd(), "assets", "icon.png");

async function convert() {
  try {
    const rawSvg = fs.readFileSync(inputImagePath);
    await sharp(rawSvg).resize(128, 128).png().toFile(outputImagePath);
    console.log("Successfully converted SVG to PNG");
  } catch (error) {
    console.error("Error converting SVG to PNG:", error);
  }
}

convert();
