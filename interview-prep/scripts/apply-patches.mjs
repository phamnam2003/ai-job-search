/**
 * Apply the remediation workflow's verified patches to the staged behavioral
 * payload, then run the two mechanical normalizations the workflow did not
 * cover.
 *
 *   node scripts/apply-patches.mjs <workflow-task.output> <staged.json> <out.json>
 *
 * Two patches are deliberately SKIPPED — see SKIP below. The workflow ran its
 * tasks concurrently, so two of them edited the same field from different
 * starting points; taking the later one blindly would put an answer to the old
 * question under the new question.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [outputPath, stagedPath, destPath] = process.argv.slice(2);
if (!outputPath || !stagedPath || !destPath) {
  console.error('usage: node scripts/apply-patches.mjs <task.output> <staged.json> <out.json>');
  process.exit(1);
}

const result = JSON.parse(readFileSync(outputPath, 'utf8')).result;
const data = JSON.parse(readFileSync(stagedPath, 'utf8'));

/* --- conflicts -------------------------------------------------------------

   bank:hr-12:a and bank:hr-12:why — the `dupes` task REPOINTED hr-12 to a new
   question ("team nhỏ, một người ôm nhiều mảng — em quen chưa") and rewrote q,
   a, why and trap together. The `reverse` task, running in parallel, rewrote
   the answer to hr-12's OLD question (working style / manager fit). Its text is
   good but it no longer answers the question above it, so it is dropped.

   bank:hr-7:a — both tasks rewrote the same paragraph from the same base and
   differ only in the ending. The later one (`reverse`) also removes the absurd
   "confirm the interview address" question the honesty audit objected to, so
   letting it win satisfies both findings. The open question about which Hanoi
   office he would actually work at stays live in meta.warnings.
--------------------------------------------------------------------------- */
const SKIP = new Set([
  'reverse|bank|hr-12|a',
  'reverse|bank|hr-12|why',
]);

const byId = (arr) => new Map(arr.map((x) => [x.id, x]));
const stars = byId(data.stars);
const bank = byId(data.bank);
const claims = byId(data.claims);

let applied = 0;
const skipped = [];
const failed = [];

for (const p of result.applied) {
  const sig = `${p.task}|${p.kind}|${p.id}|${p.field}`;
  if (SKIP.has(sig)) {
    skipped.push(sig);
    continue;
  }
  const target =
    p.kind === 'star' ? stars.get(p.id)
      : p.kind === 'bank' ? bank.get(p.id)
        : p.kind === 'claim' ? claims.get(p.id)
          : null;
  if (!target) {
    failed.push(`${sig} — no such ${p.kind}`);
    continue;
  }
  if (!(p.field in target)) {
    failed.push(`${sig} — no such field`);
    continue;
  }
  let value;
  try {
    value = JSON.parse(p.json);
  } catch (e) {
    failed.push(`${sig} — bad JSON: ${e.message}`);
    continue;
  }
  if (Array.isArray(target[p.field]) !== Array.isArray(value)) {
    failed.push(`${sig} — shape change ${typeof target[p.field]} -> ${typeof value}`);
    continue;
  }
  target[p.field] = value;
  applied += 1;
}

/* --- normalization 1: relatedStar ----------------------------------------- */

/* The bank was written across several agents and half of them prefixed the star
   id with "star-". Two more invented ids that never existed. */
const ALIAS = {
  'b-domain-learning': 'tlgeo-domain',
  'a-data-correctness': 'stm-correctness',
};
const starIds = new Set(data.stars.map((s) => s.id));
const relFixes = [];

for (const q of data.bank) {
  if (!q.relatedStar) continue;
  let id = q.relatedStar.replace(/^star-/, '');
  if (ALIAS[id]) id = ALIAS[id];
  if (!starIds.has(id)) {
    // No such story exists. An empty string is the schema's "none" — a link to
    // a missing id would render as a dead end on the question bank page.
    relFixes.push(`${q.id}: "${q.relatedStar}" -> (none)`);
    q.relatedStar = '';
    continue;
  }
  if (id !== q.relatedStar) relFixes.push(`${q.id}: "${q.relatedStar}" -> "${id}"`);
  q.relatedStar = id;
}

/* --- normalization 2: star priority --------------------------------------- */

/* Priority is "reach for this first", so it has to be a strict order — the
   generated set had 1,2,2,3,3,4,4, which renders as a tie the page cannot show.
   tlgeo-domain moves up to 3: learning an unfamiliar domain from zero is the
   closest thing he has to the actual job on offer at a biologics company. */
const ORDER = [
  'stm-performance',
  'skyreality-design',
  'tlgeo-domain',
  'stm-correctness',
  'leeon-inherited',
  'k8s-vmware',
  'thesis-ticketing',
];
const prioFixes = [];
for (const [i, id] of ORDER.entries()) {
  const st = stars.get(id);
  if (!st) {
    failed.push(`priority order names a missing star: ${id}`);
    continue;
  }
  if (st.priority !== i + 1) prioFixes.push(`${id}: ${st.priority} -> ${i + 1}`);
  st.priority = i + 1;
}
data.stars.sort((a, b) => a.priority - b.priority);
if (data.stars.length !== ORDER.length) {
  failed.push(`star count ${data.stars.length} != ordered list ${ORDER.length}`);
}

/* --- report ---------------------------------------------------------------- */

writeFileSync(destPath, JSON.stringify(data, null, 2), 'utf8');

console.log(`patches applied : ${applied}/${result.applied.length}`);
console.log(`patches skipped : ${skipped.length}`);
for (const s of skipped) console.log(`   - ${s}`);
console.log(`relatedStar fixes: ${relFixes.length}`);
for (const s of relFixes) console.log(`   - ${s}`);
console.log(`priority fixes  : ${prioFixes.length}`);
for (const s of prioFixes) console.log(`   - ${s}`);
if (failed.length) {
  console.log(`FAILURES: ${failed.length}`);
  for (const s of failed) console.log(`   ! ${s}`);
  process.exitCode = 1;
} else {
  console.log('no failures');
}
console.log(`wrote ${destPath}`);
