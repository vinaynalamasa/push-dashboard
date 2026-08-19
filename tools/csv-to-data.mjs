/*
 * csv-to-data.mjs — turn a MoEngage push CSV export into the dashboard's data.js
 *
 *   node tools/csv-to-data.mjs "C:\path\to\Report_PUSH_20260818.csv"
 *
 * Writes data.js next to index.html. Commit + push that file and the live
 * dashboard shows the new data to everyone.
 *
 * Only the 10 columns the dashboard actually uses are kept, so a 10 MB,
 * 209-column export becomes a ~1 MB data.js.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');

/* ---------- RFC 4180 parser (same one the page uses) ---------- */
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { if (text[i + 1] === '\n') i++; row.push(field); field = ''; rows.push(row); row = []; }
      else if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r[0] !== undefined && r[0] !== ''));
}

/* ---------- column auto-detection (same specs as the page) ---------- */
const FIELD_SPECS = [
  { key: 'name', title: 'Campaign name', required: true, exact: ['campaign name', 'campaign title', 'name'], any: /campaign\s*name|^name$/, not: /version|parent|segment|tag|creator|template|channel/ },
  { key: 'sentTime', title: 'Sent time', exact: ['campaign sent time', 'sent time', 'send time', 'campaign send time', 'campaign sent date'], any: /(sent|send|delivery|schedul\w*)\s*(date|time)|date\s*sent/, not: /zone|type/ },
  { key: 'sent', title: 'Sent', required: true, exact: ['all platform sent', 'total sent', 'sent', 'android sent', 'ios sent', 'web sent'], any: /\bsent\b/, not: /rate|time|date|type|%|attempt|unique/ },
  { key: 'failed', title: 'Failed', exact: ['all platform failed', 'total failed', 'failed', 'android failed'], any: /\bfail(ed|ure|ures)?\b/, not: /rate|%/ },
  { key: 'impr', title: 'Impressions', exact: ['all platform impressions', 'total impressions', 'impressions', 'android impressions'], any: /impressions?/, not: /rate|uniq|%|control/ },
  { key: 'clicks', title: 'Clicks', exact: ['all platform clicks', 'total clicks', 'clicks', 'android clicks'], any: /clicks?/, not: /rate|uniq|ctr|%|through|conver|goal|action|button/ },
  { key: 'uimpr', title: 'Unique impressions', exact: ['all platform unique impressions', 'total unique impressions', 'unique impressions', 'android unique impressions'], any: /uniq\w*\s*impressions?/, not: /rate|%/ },
  { key: 'uclicks', title: 'Unique clicks', exact: ['all platform unique clicks', 'total unique clicks', 'unique clicks', 'android unique clicks'], any: /uniq\w*\s*clicks?/, not: /rate|%|ctr/ },
  { key: 'ctconv', title: 'Click-through converted users', exact: ['goal 1 click through converted users all platform', 'goal 1 click through converted users', 'click through converted users all platform', 'click through converted users'], any: /click\s*through.*converted\s*users/, not: /goal\s*2|control|global|revenue|events/ },
  { key: 'vtconv', title: 'View-through converted users', exact: ['goal 1 view through converted users all platform', 'goal 1 view through converted users', 'view through converted users all platform', 'view through converted users'], any: /view\s*through.*converted\s*users/, not: /goal\s*2|control|global|revenue|events/ },
];

const normHeader = s => String(s == null ? '' : s)
  .replace(/\uFEFF/g, '').replace(/["']/g, '').replace(/[_\-.]+/g, ' ')
  .replace(/\s+/g, ' ').trim().toLowerCase();

function resolveColumns(cols) {
  const N = cols.map(normHeader);
  const used = new Set(), map = {}, report = [];
  for (const spec of FIELD_SPECS) {
    let found = -1, how = 'missing';
    for (const ex of spec.exact) {
      const i = N.indexOf(ex);
      if (i >= 0 && !used.has(i)) { found = i; how = 'exact name'; break; }
    }
    if (found < 0 && spec.any) {
      let best = -1, bestScore = -Infinity;
      N.forEach((n, i) => {
        if (used.has(i) || !spec.any.test(n)) return;
        if (spec.not && spec.not.test(n)) return;
        let sc = 0;
        if (/all platform/.test(n)) sc += 300;
        else if (/\btotal\b/.test(n)) sc += 200;
        else if (/android/.test(n)) sc += 100;
        sc -= n.split(' ').length;
        if (sc > bestScore) { bestScore = sc; best = i; }
      });
      if (best >= 0) { found = best; how = 'matched by pattern'; }
    }
    map[spec.key] = found;
    if (found >= 0) used.add(found);
    report.push({ ...spec, at: found, col: found >= 0 ? cols[found] : null, how });
  }
  return { map, report };
}

const num = v => {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(/[,\s\u00a0]/g, '').replace(/%$/, ''));
  return isFinite(n) ? n : 0;
};

/* ---------- run ---------- */
const src = process.argv[2];
if (!src) {
  console.error('Usage: node tools/csv-to-data.mjs "<path to MoEngage CSV>"');
  process.exit(1);
}
if (!fs.existsSync(src)) {
  console.error('File not found: ' + src);
  process.exit(1);
}

const table = parseCSV(fs.readFileSync(src, 'utf8'));
if (table.length < 2) { console.error('That CSV has no data rows.'); process.exit(1); }

const cols = table[0];
const { map, report } = resolveColumns(cols);

console.log('\nColumn mapping:');
for (const r of report) {
  console.log('  ' + r.title.padEnd(32) + (r.col === null ? '-- not found, will be 0 --' : r.col) + '   (' + r.how + ')');
}
const missing = report.filter(r => r.required && r.at < 0);
if (missing.length) {
  console.error('\nERROR: could not find ' + missing.map(r => '"' + r.title + '"').join(' and ') +
    '. Detected ' + cols.length + ' columns. First 8: ' + cols.slice(0, 8).join(' | '));
  process.exit(1);
}

const CANON_COLS = ['Campaign Name', 'Campaign Sent Time', 'All Platform Sent', 'All Platform Failed',
  'All Platform Impressions', 'All Platform Clicks', 'All Platform Unique Impressions', 'All Platform Unique Clicks',
  'Goal 1 Click Through Converted Users All Platform', 'Goal 1 View Through Converted Users All Platform'];
const CANON_KEYS = ['name', 'sentTime', 'sent', 'failed', 'impr', 'clicks', 'uimpr', 'uclicks', 'ctconv', 'vtconv'];

const rows = [];
let latest = '';
for (const row of table.slice(1)) {
  const nm = map.name >= 0 ? String(row[map.name] ?? '').trim() : '';
  if (!nm) continue;
  const rec = CANON_KEYS.map((k, i) => {
    if (map[k] < 0) return i < 2 ? '' : 0;
    const v = row[map[k]];
    return i < 2 ? String(v ?? '') : num(v);
  });
  const d = (rec[1].match(/\d{4}-\d{2}-\d{2}/) || [''])[0];
  if (d > latest) latest = d;
  rows.push(rec);
}

const out = '/* GyanTV push dashboard — generated dataset. DO NOT EDIT BY HAND.\n' +
  '   Source CSV : ' + path.basename(src) + '\n' +
  '   Campaigns  : ' + rows.length + '\n' +
  '   Latest send: ' + (latest || 'unknown') + '\n' +
  '   Regenerate : node tools/csv-to-data.mjs "<new export>.csv"  then commit + push. */\n' +
  'window.PUSH_DATA = ' + JSON.stringify({
    generated: latest, source: path.basename(src), cols: CANON_COLS, rows
  }) + ';\n';

const dest = path.join(REPO, 'data.js');
fs.writeFileSync(dest, out, 'utf8');
console.log('\nWrote ' + dest);
console.log(rows.length.toLocaleString('en-IN') + ' campaigns · ' + (out.length / 1048576).toFixed(2) + ' MB · latest send ' + latest);
console.log('\nNext: commit data.js in GitHub Desktop and push.\n');
