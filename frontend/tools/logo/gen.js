// Generates the site logo SVGs in frontend/public from hand-fitted geometry: fgs-logo.svg (emblem,
// used across the site) and fgs-logo-wordmark.svg (emblem plus curved school name).
// All coordinates live in the original PNG's 592x581 pixel space so the output can be overlaid
// on original.png for comparison. Run from frontend/: bun tools/logo/gen.js
import { writeFileSync } from "node:fs";

const f = (n) => +n.toFixed(1);
const pt = (c, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
};

// Point where the ray from `from` at `deg` meets circle (c, r); keeps arc bands radially aligned.
function rayCircle(from, deg, c, r) {
  const a = (deg * Math.PI) / 180;
  const d = [Math.cos(a), Math.sin(a)];
  const o = [from[0] - c[0], from[1] - c[1]];
  const b = o[0] * d[0] + o[1] * d[1];
  const t = -b + Math.sqrt(b * b - (o[0] ** 2 + o[1] ** 2 - r * r));
  return [from[0] + t * d[0], from[1] + t * d[1]];
}

// Crescent band between two non-concentric circles, swept from deg0 (left) down through the
// bottom to deg1 (right), with round caps. Non-concentric circles give the original's taper.
function band({ outer, inner, deg0, deg1 }) {
  const o0 = pt(outer.c, outer.r, deg0);
  const o1 = pt(outer.c, outer.r, deg1);
  const i0 = rayCircle(outer.c, deg0, inner.c, inner.r);
  const i1 = rayCircle(outer.c, deg1, inner.c, inner.r);
  const cap = (a, b) => f(Math.hypot(a[0] - b[0], a[1] - b[1]) / 2);
  const P = (p) => `${f(p[0])},${f(p[1])}`;
  return (
    `M${P(o0)}A${outer.r},${outer.r} 0 0 0 ${P(o1)}` +
    `A${cap(o1, i1)},${cap(o1, i1)} 0 0 0 ${P(i1)}` +
    `A${inner.r},${inner.r} 0 0 1 ${P(i0)}` +
    `A${cap(o0, i0)},${cap(o0, i0)} 0 0 0 ${P(o0)}Z`
  );
}

// The sun's lower edge is flatter than its top: it is the intersection of the main disc with a
// slightly larger, higher disc, which opens the white gap above the arcs and around the book.
const SUN = (() => {
  const cx = 287.5, top = { cy: 279.4, r: 217.4 }, clip = { cy: 255, r: 226.5 };
  const y = (top.r ** 2 - clip.r ** 2 - top.cy ** 2 + clip.cy ** 2) / (2 * (clip.cy - top.cy));
  const dx = Math.sqrt(top.r ** 2 - (y - top.cy) ** 2);
  const L = `${f(cx - dx)},${f(y)}`, R = `${f(cx + dx)},${f(y)}`;
  return `M${L}A${top.r},${top.r} 0 1 1 ${R}A${clip.r},${clip.r} 0 0 1 ${L}Z`;
})();
const LIGHT = band({
  outer: { c: [288, 271], r: 248 },
  inner: { c: [285, 258], r: 239.7 },
  deg0: 157.5,
  deg1: -9.5,
});
const DARK = band({
  outer: { c: [290, 287], r: 270.5 },
  inner: { c: [283, 261], r: 269.3 },
  deg0: 161,
  deg1: -10.5,
});

const C = {
  sunCore: "#FDE613",
  sunEdge: "#FAB12C",
  blueDeep: "#0389D0",
  blue: "#00B3EE",
  blueLight: "#0AC2F6",
  arcLight: "#74CEF1",
  arcDark: "#0390D4",
  green: "#347464",
  text: "#0C4B33",
};

const figure = `
    <path fill="url(#armL)" d="M183,162C182,205 205,250 262,318L300,300L283,279C245,246 200,205 183,162Z"/>
    <path fill="url(#body)" d="M339,157C352,175 358,205 345,240C330,280 295,315 290,355C287,395 315,430 353,446C320,447 290,437 272,410C255,385 252,345 261,316L283,279C300,255 325,225 334,185C336,175 337,165 339,157Z"/>
    <path fill="url(#body)" d="M368,222C380,240 380,275 360,302C345,322 335,345 337,370C342,390 365,404 379,414C350,412 320,400 315,368C313,340 330,312 350,282C362,262 368,245 368,222Z"/>
    <path fill="url(#body)" d="M390,271C397,285 395,305 380,325C368,342 362,358 372,374C378,384 386,390 395,395C375,393 360,385 356,365C353,345 365,325 378,308C386,297 390,285 390,271Z"/>
    <path fill="url(#body)" d="M400,316C404,330 413.3,343 413.3,360.5A16.3,16.3 0 1 1 380.7,360.5C380.7,348 393,335 400,316Z"/>
    <circle cx="275.5" cy="196" r="37.5" fill="url(#head)"/>`;

// Open book: one closed outline (wavy top edges, splayed sides, wavy cover bottom) plus the
// page-bottom line and spine. Mirrored about the spine at x=292.
const book = `
    <g fill="none" stroke="${C.green}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
      <path fill="#fff" d="M212,467Q228,473 246,467T292,476Q320,461 338,467T372,467L428,546Q406,558 379,553.5T292,567Q232,549 205,553.5T156,546Z"/>
      <path d="M167,531Q187,540 212,536T292,543.5Q347,532 372,536T417,531"/>
      <path d="M292,476V543"/>
    </g>`;

const defs = `
  <defs>
    <radialGradient id="sun" gradientUnits="userSpaceOnUse" cx="282" cy="268" r="218">
      <stop offset="0" stop-color="${C.sunCore}"/>
      <stop offset="0.5" stop-color="#FCCB21"/>
      <stop offset="1" stop-color="${C.sunEdge}"/>
    </radialGradient>
    <radialGradient id="head" cx="0.5" cy="0.5" r="0.55" fx="0.33" fy="0.28">
      <stop offset="0" stop-color="#F4FFFF"/>
      <stop offset="0.22" stop-color="#7FD6FA"/>
      <stop offset="0.6" stop-color="#16A8E6"/>
      <stop offset="1" stop-color="#0384CC"/>
    </radialGradient>
    <linearGradient id="body" gradientUnits="userSpaceOnUse" x1="0" y1="160" x2="0" y2="440">
      <stop offset="0" stop-color="${C.blueDeep}"/>
      <stop offset="0.6" stop-color="${C.blue}"/>
      <stop offset="1" stop-color="${C.blueLight}"/>
    </linearGradient>
    <linearGradient id="armL" gradientUnits="userSpaceOnUse" x1="185" y1="170" x2="275" y2="300">
      <stop offset="0" stop-color="#05BDEE"/>
      <stop offset="1" stop-color="#008ECF"/>
    </linearGradient>
    <path id="wordArc" d="M60.5,278A227,227 0 0 1 514.5,278"/>
  </defs>`;

const mark = `
  <path fill="${C.arcDark}" d="${DARK}"/>
  <path fill="${C.arcLight}" d="${LIGHT}"/>
  <path fill="url(#sun)" d="${SUN}"/>
  <g>${figure}
  </g>${book}`;

const wordmark = `
  <text font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="36" fill="${C.text}">
    <textPath href="#wordArc" startOffset="50%" text-anchor="middle" textLength="584" lengthAdjust="spacing">FAROOQI GRAMMAR SCHOOL</textPath>
  </text>`;

// The emblem is cropped to its artwork so it fills square slots (nav, favicon); the wordmark
// keeps the original PNG's canvas, which leaves room for the lettering above the sun.
const EMBLEM_VIEWBOX = "26 56 540 520";
const FULL_VIEWBOX = "0 0 592 581";
const svg = (body, label, viewBox) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${label}">${defs}${body}
</svg>
`;

const out = (name) => new URL(`../../public/${name}`, import.meta.url);
writeFileSync(out("fgs-logo.svg"), svg(mark, "Farooqi Grammar School logo", EMBLEM_VIEWBOX));
writeFileSync(out("fgs-logo-wordmark.svg"), svg(mark + wordmark, "Farooqi Grammar School", FULL_VIEWBOX));
console.log("wrote frontend/public/fgs-logo.svg, fgs-logo-wordmark.svg");
