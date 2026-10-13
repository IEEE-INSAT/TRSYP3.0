#!/usr/bin/env node
/**
 * Turn an image in public/ into a web-ready WebP next to it.
 *
 *   node scripts/optimize-images.mjs public/partners/new-logo.png 800
 *   node scripts/optimize-images.mjs public/a.jpg public/b.png 1200
 *
 * The last argument, when it is a number, is the maximum width in pixels
 * (default 1200; images are never enlarged). Writes `<name>.webp` beside each
 * input - a .webp input is rewritten in place - and prints the path to use in
 * the code.
 *
 * Why: next/image optimisation is off (see next.config.ts) because converting
 * on Render's free instance was slow and some conversions never finished, so
 * images are served exactly as they sit in public/. Run this on anything new
 * before referencing it.
 */
import sharp from 'sharp';
import { rename, stat } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const maxWidth = /^\d+$/.test(args.at(-1) ?? '') ? Number(args.pop()) : 1200;

if (args.length === 0) {
  console.error('usage: node scripts/optimize-images.mjs <image>... [maxWidth]');
  process.exit(1);
}

for (const input of args) {
  const { dir, name, ext } = path.parse(input);
  const output = path.join(dir, `${name}.webp`);
  const inPlace = ext.toLowerCase() === '.webp';
  const target = inPlace ? `${output}.tmp` : output;
  const before = (await stat(input)).size;

  // rotate() applies EXIF orientation; colour profiles are converted to sRGB
  // and dropped, so every browser shows the same colours.
  await sharp(input)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile(target);
  if (inPlace) await rename(target, output);

  const after = (await stat(output)).size;
  const publicPath = '/' + path.relative('public', output).split(path.sep).join('/');
  console.log(`${publicPath}  ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`);
}
