import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const errors = [];
const passed = [];
const assert = (condition, message) => (condition ? passed : errors).push(message);
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const html = read("index.html");
for (const file of ["README.md", "README.vi.md"]) {
  const readme = read(file);
  assert(readme.includes("https://github.com/snowgemm/Blockline"), `${file} references the canonical repository`);
  assert(readme.includes("https://snowgemm.github.io/Blockline/"), `${file} references the canonical website`);
  assert(!/https:\/\/(?:github\.com\/slgamervn\/Blockline|slgamervn\.github\.io\/Blockline)\//i.test(readme), `${file} contains no legacy owner URLs`);
}
const css = read("assets/css/style.css");
const js = read("assets/js/main.js");
const favicon = read("favicon.svg");
function channel(hex, offset) {
  const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}
function contrastRatio(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
const lightTextTokens = css.match(/:root\[data-theme="light"\]\{[^}]*--page:(#[0-9a-f]{6});[^}]*--subtle:(#[0-9a-f]{6});/i);
assert(Boolean(lightTextTokens) && contrastRatio(lightTextTokens[2], lightTextTokens[1]) >= 4.5, "Light-theme subtle text meets WCAG AA contrast for normal text");

assert(/<html lang="vi">/.test(html), "HTML declares Vietnamese language");
assert(/<h1\b/.test(html) && (html.match(/<h1\b/g) || []).length === 1, "Page has exactly one h1");
assert(/name="description"/.test(html) && /property="og:title"/.test(html), "SEO and Open Graph metadata exist");
assert(/assets\/css\/style\.css/.test(html) && /assets\/js\/main\.js/.test(html), "External CSS and deferred JavaScript are linked");
assert(!/gradient\s*\(|color-mix\s*\(/i.test(css), "Website uses flat colors without gradients or blended overlays");
assert(!/@keyframes\s+|animation\s*:\s*[^;{}]+;/i.test(css), "CSS has no decorative animations");
assert(!/\.download-panel::after|\.reveal\s*\{|html\.reveal-ready/.test(css), "Decorative diagonal overlays and scroll-reveal styles are absent");
assert(/style\.css\?v=20261118-monochrome-motion-contrast/.test(html) && /main\.js\?v=20261118-monochrome-motion/.test(html), "Changed asset URLs bypass stale browser caches");
assert(!/fonts\.(?:googleapis|gstatic)\.com/.test(html), "Website uses local system fonts rather than decorative remote fonts");
assert(/href="https:\/\/github\.com\/snowgemm\/Blockline\/releases\/latest"/.test(html), "Latest release page link uses the canonical repository");
assert(/property="og:url" content="https:\/\/snowgemm\.github\.io\/Blockline\//.test(html) && /rel="canonical" href="https:\/\/snowgemm\.github\.io\/Blockline\//.test(html), "Canonical and Open Graph URLs use the new GitHub Pages owner");
assert(!/https:\/\/(?:github\.com\/slgamervn\/Blockline|slgamervn\.github\.io\/Blockline)\//i.test(html), "Website HTML contains no legacy repository or Pages URLs");
const apkAnchors = [...html.matchAll(/<a\b[^>]*href="https:\/\/github\.com\/snowgemm\/Blockline\/releases\/latest"[^>]*>/g)].map((match) => match[0]);
assert(apkAnchors.length === 4 && apkAnchors.every((tag) => !/\sdownload(?:\s|=|>)/.test(tag) && !/\bdata-apk-link\b/.test(tag)), "All download buttons link to the latest release page without forcing a direct download");
assert(!css.includes("\\n.site-header{") && /\.site-header\s*\{\s*position:fixed/.test(css), "Fixed header selector is not corrupted by a literal escape");
assert(/body\.menu-open\{overflow:hidden\}/.test(css) && !/body\.menu-open\{[^}]*touch-action/.test(css), "Mobile menu locks page scrolling without blocking menu touch gestures");
assert(/\.mobile-menu\{position:fixed;[^}]*padding:calc\(88px \+ env\(safe-area-inset-top\)\)/.test(css), "Mobile menu clears the fixed header and safe-area inset");
assert(/prefers-reduced-motion:\s*reduce/.test(css), "Reduced-motion styles are present");
assert(!/revealObserver|root\.classList\.add\('reveal-ready'\)|classList\.add\('reveal'\)/.test(js) && !/html\.reveal-ready/.test(css), "Page content stays visible instead of animating in on scroll");
assert(!/#resources\s+\.resource-groups/.test(css), "Resource visibility does not depend on section-specific CSS overrides");
assert(/data-language-toggle/.test(html) && /const englishText = \{/.test(js), "Vietnamese and English language toggle is present");

assert(/localStorage\.setItem\('blockline-language'/.test(js) && /localStorage\.getItem\('blockline-language'/.test(js), "Language choice persists between visits");
const englishDictionary = js.match(/const englishText = \{([\s\S]*?)\n  \};/);
assert(Boolean(englishDictionary) && (englishDictionary[1].match(/"[^"\n]+"\s*:/g) || []).length >= 140, "English translation covers the website copy");
const englishKeys = new Set([...(englishDictionary?.[1] || "").matchAll(/"([^"]+)"\s*:/g)].map((match) => match[1]));
const bodyMarkup = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [null, ""])[1];
const visibleTextNodes = [...bodyMarkup.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").matchAll(/>([^<>]+)</g)]
  .map((match) => match[1].replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim())
  .filter((value) => value && !["×", "ƒ"].includes(value) && /[À-ỹ]/.test(value));
const untranslatedVisibleText = [...new Set(visibleTextNodes)].filter((value) => !englishKeys.has(value));
assert(untranslatedVisibleText.length === 0, "All visible Vietnamese copy has an English translation");
assert(/og:locale/.test(html) && /ogLocale\.content = currentLanguage === 'en'/.test(js), "Social metadata follows the selected language");
assert(!/filter:\s*blur\(/.test(css) && !/backdrop-filter:\s*blur\(/.test(css), "Scroll effects avoid expensive blur filters");
assert(!/classList\.remove\('is-visible'\)|--reveal-y|scrollDirection > 0/.test(js + css), "Scrolling does not animate sections in and out");

assert(/aria-expanded/.test(js) && /Escape/.test(js), "Accessible mobile navigation has keyboard support");
assert(js.includes("const navigationSections = ['features', 'demo', 'roadmap', 'resources', 'faq']"), "Scroll navigation tracks all primary page sections");
assert(/data-demo-tab/.test(html) && /activateDemoTab/.test(js), "Interactive demo tabs are present");
assert(/const demoSwipeSurface = document\.querySelector\('\.demo-layout'\)/.test(js) && /demoSwipeSurface\.addEventListener\('touchstart'/.test(js) && /demoSwipeSurface\.addEventListener\('touchend'/.test(js) && /passive:\s*false/.test(js) && /event\.preventDefault\(\)/.test(js) && /deltaX < 0 \? 1 : -1/.test(js) && /Math\.abs\(deltaY\) \* 1\.25/.test(js), "Swiping mobile process cards or preview updates the same selected step without hijacking vertical scrolling");
assert(!/data-reading-copy|reading-progress|--reading-progress/.test(html + css + js), "Manifesto text uses stable colors independent of scroll position");
assert(/@media\s*\(max-width:\s*380px\)/.test(css) && /@media\s*\(max-width:\s*560px\)/.test(css), "Narrow mobile breakpoints are present");
assert(/@media\s*\(min-width:\s*1600px\)/.test(css), "Wide desktop breakpoint is present");
assert(/env\(safe-area-inset-bottom\)/.test(css) && /100svh|100dvh/.test(css), "Safe-area and dynamic viewport support are present");
assert(/zip-slip/i.test(html) || /zip-slip/i.test(js), "Import security capability is described");
assert(/1 MB/.test(html) && /5 MB/.test(html), "Editor file-size limitations are disclosed");
assert(/Không liên kết với Mojang hay Microsoft/.test(html), "Minecraft trademark disclaimer is present");
assert(!/lorem ipsum|TODO|placeholder text/i.test(html + css + js), "No lorem ipsum or TODO placeholders remain");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
assert(ids.length === new Set(ids).size, "HTML IDs are unique");
const hashes = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
hashes.forEach((id) => assert(ids.includes(id), `Internal anchor #${id} exists`));
const scriptBlocks = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
scriptBlocks.forEach((match, i) => {
  try { new vm.Script(match[1], { filename: `inline-script-${i + 1}.js` }); assert(true, `Inline script ${i + 1} parses`); }
  catch (error) { assert(false, `Inline script ${i + 1} parses: ${error.message}`); }
});
try { new vm.Script(js, { filename: "assets/js/main.js" }); assert(true, "Main JavaScript parses"); }
catch (error) { assert(false, `Main JavaScript parses: ${error.message}`); }
let braces = 0, quote = "", escaped = false, comment = false;
for (let i = 0; i < css.length; i++) {
  const c = css[i], next = css[i + 1];
  if (comment) { if (c === "*" && next === "/") { comment = false; i++; } continue; }
  if (quote) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === quote) quote = ""; continue; }
  if (c === "/" && next === "*") { comment = true; i++; }
  else if (c === "'" || c === '"') quote = c;
  else if (c === "{") braces++;
  else if (c === "}") braces--;
  if (braces < 0) break;
}
assert(braces === 0 && quote === "" && !comment, "CSS braces, strings, and comments are balanced");
assert(/name="theme-color" content="#101114"/i.test(html) && js.includes("#f5f5f3") && js.includes("#101114"), "Browser theme color matches the neutral dark and light themes");
assert(/deep-space-hero\.webp/.test(css) && fs.existsSync(path.join(root, "assets/images/deep-space-hero.webp")), "The optimized Deep Space artwork asset exists");
assert(/\.hero::before\s*\{[^}]*deep-space-hero\.webp/s.test(css) && !/body::before/.test(css), "Cosmic artwork is confined to the hero rather than fixed behind every section");
assert(/--accent:#f1f1f2/i.test(css) && /--accent-cyan:#b9bbc1/i.test(css), "The monochrome accent tokens are defined");
assert(!/#(?:a6b5ff|8e9ff0|80bac7|536bc6|3f55ab|377f8b|d7b47b|966b35)/i.test(css + favicon), "Previous blue, cyan, and gold accents are removed");
assert(/filter:grayscale\(1\) saturate\(0\)/.test(css), "The cosmic hero artwork is rendered in monochrome");
assert(/\.feature-row-editor \.feature-copy\{order:2\}/.test(css) && /\.feature-row-editor \.feature-visual\{order:1\}/.test(css), "The middle feature row alternates the visual layout");
assert(/\.roadmap-list\{display:grid;gap:0/.test(css) && /\.roadmap-item\{[^}]*border:0;border-bottom:1px solid var\(--line\)/s.test(css), "The roadmap uses a flat hierarchy instead of repeated cards");
assert(/activeContent\.animate\(/.test(js) && /!focus && !reducedMotion\.matches/.test(js), "The demo transition is brief, user-triggered, and disabled for reduced-motion and keyboard navigation");
assert(/visibility:hidden;opacity:0;transform:translateY\(-8px\)/.test(css) && /\.mobile-menu\.is-open\{visibility:visible;opacity:1/.test(css), "Mobile navigation uses an accessible short drawer transition");
assert(!/--green(?:-bright)?\s*:|var\(--green(?:-bright)?\)/i.test(css), "Legacy green theme tokens are fully removed");
assert(!/#(?:478f5e|8bb991|3dba7a|8ce0b2|6dbb82|a5dfad|1a2a1e|8fd19b|8b9cff|c3a6ff|75d9e8)/i.test(css), "Previous green and over-saturated cosmic accents are absent");
assert(!/\.manifesto\b/.test(html) && !/01 \/ CẤU TRÚC|02 \/ CHỈNH SỬA|03 \/ CẤU HÌNH PACK/.test(html), "Redundant manifesto block and decorative feature numbering are removed");
assert(/#f1f1f2/i.test(favicon) && /#adafb5/i.test(favicon), "Favicon follows the monochrome Blockline palette");
if (errors.length) {
  console.error(`Website checks failed: ${errors.length} error(s)`);
  errors.forEach((error) => console.error("✗ " + error));
  console.log(`Passed: ${passed.length}`);
  process.exitCode = 1;
} else {
  console.log(`Website checks passed: ${passed.length}`);
  passed.forEach((message) => console.log("✓ " + message));
}
