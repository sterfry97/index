#!/usr/bin/env node
/**
 * generate-games.js
 * -----------------
 * Scans public/games/ for .html files and builds games.json automatically.
 * Run from the project root:
 *
 *   node generate-games.js
 *
 * What it does:
 *  - Finds every .html file in public/games/
 *  - Reads each file's <title> tag for the game name (falls back to filename)
 *  - Reads a <meta name="description"> tag if present
 *  - Reads a <meta name="tags"> tag if present  (comma-separated)
 *  - Reads a <meta name="icon"> tag if present  (single emoji)
 *  - Preserves any existing entry data you've manually edited
 *  - Writes public/games/games.json
 *
 * To give a game a proper name/description/tags without editing games.json,
 * just add these tags inside its <head>:
 *
 *   <title>My Cool Game</title>
 *   <meta name="description" content="Dodge enemies and collect coins.">
 *   <meta name="tags"        content="arcade, action">
 *   <meta name="icon"        content="🪙">
 */

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GAMES_DIR  = path.join(__dirname, "public", "games");
const OUTPUT     = path.join(GAMES_DIR, "games.json");

// ── helpers ────────────────────────────────────────────────────────────────

function extractMeta(html, name) {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i");
  const m  = html.match(re) ||
             html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"));
  return m ? m[1].trim() : null;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}

function filenameToName(file) {
  return file
    .replace(/\.html?$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function iconForName(name) {
  // very rough auto-icon based on common game keywords
  const n = name.toLowerCase();
  if (/snake/i.test(n))                      return "🐍";
  if (/tetris|block|stack/i.test(n))         return "🟦";
  if (/chess/i.test(n))                      return "♟️";
  if (/2048/i.test(n))                       return "🔢";
  if (/pacman|pac.man/i.test(n))             return "👾";
  if (/flappy|bird/i.test(n))                return "🐦";
  if (/dino|dinosaur/i.test(n))              return "🦕";
  if (/space|invader|asteroid/i.test(n))     return "🚀";
  if (/minesweeper|mine/i.test(n))           return "💣";
  if (/solitaire|card|poker|blackjack/i.test(n)) return "🃏";
  if (/puzzle|sudoku/i.test(n))              return "🧩";
  if (/maze/i.test(n))                       return "🌀";
  if (/match|connect/i.test(n))              return "🔵";
  if (/pong|tennis|ping/i.test(n))           return "🏓";
  if (/breakout|brick/i.test(n))             return "🧱";
  if (/platformer|jump|run/i.test(n))        return "🏃";
  if (/shoot|bullet|gun|fps/i.test(n))       return "🎯";
  if (/racing|car|drift/i.test(n))           return "🏎️";
  if (/clicker|idle/i.test(n))               return "👆";
  if (/word|spelling|typo/i.test(n))         return "📝";
  if (/music|rhythm|beat/i.test(n))          return "🎵";
  if (/golf/i.test(n))                       return "⛳";
  if (/foot|soccer/i.test(n))                return "⚽";
  if (/basket/i.test(n))                     return "🏀";
  if (/sword|knight|rpg|dungeon/i.test(n))   return "⚔️";
  if (/tower|defense/i.test(n))              return "🏰";
  if (/bubble/i.test(n))                     return "🫧";
  if (/fish|ocean|sea/i.test(n))             return "🐟";
  if (/zombie|dead/i.test(n))                return "🧟";
  return "🎮";
}

// ── load existing games.json so we don't overwrite manual edits ────────────

let existing = {};
if (fs.existsSync(OUTPUT)) {
  try {
    const arr = JSON.parse(fs.readFileSync(OUTPUT, "utf8"));
    for (const g of arr) existing[g.file] = g;
  } catch(_) {}
}

// ── scan the directory ─────────────────────────────────────────────────────

if (!fs.existsSync(GAMES_DIR)) {
  console.error(`✗  Folder not found: ${GAMES_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(GAMES_DIR)
  .filter(f => /\.html?$/i.test(f))
  .sort();

if (files.length === 0) {
  console.log("⚠  No .html files found in public/games/");
  process.exit(0);
}

const registry = [];

for (const file of files) {
  const prev = existing[file] || {};
  const html = fs.readFileSync(path.join(GAMES_DIR, file), "utf8");

  // pull metadata — HTML tags win over old JSON (so you can fix in-file),
  // but if neither exists we keep whatever was in the old JSON entry.
  const titleFromHtml = extractTitle(html);
  const descFromHtml  = extractMeta(html, "description");
  const tagsFromHtml  = extractMeta(html, "tags");
  const iconFromHtml  = extractMeta(html, "icon");

  const name = titleFromHtml || prev.name || filenameToName(file);
  const desc = descFromHtml  || prev.description || "";
  const tags = tagsFromHtml
    ? tagsFromHtml.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)
    : (prev.tags || []);
  const icon = iconFromHtml  || prev.icon || iconForName(name);

  registry.push({
    id:          prev.id || file.replace(/\.html?$/i, "").replace(/\s+/g, "-").toLowerCase(),
    name,
    description: desc,
    file,
    icon,
    tags,
  });
}

fs.writeFileSync(OUTPUT, JSON.stringify(registry, null, 2));
console.log(`✓  games.json updated — ${registry.length} game${registry.length !== 1 ? "s" : ""} found`);
registry.forEach(g => console.log(`   ${g.icon}  ${g.name.padEnd(28)} ${g.file}`));