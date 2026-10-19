import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = 'public/assets/kti-weekly-update-2026-10-19';
assert.ok(fs.statSync(base + '.mp4').size < 50 * 1024 * 1024, 'Video should be mobile-friendly and below GitHub size warnings');
assert.ok(fs.statSync(base + '-poster.jpg').size > 1000);
const captions = fs.readFileSync(base + '.en.vtt', 'utf8');
assert.ok(captions.startsWith('WEBVTT\n'));
const timings = [...captions.matchAll(/(\d\d):(\d\d):(\d\d\.\d{3}) --> (\d\d):(\d\d):(\d\d\.\d{3})/g)];
assert.ok(timings.length > 50, 'Full-length captions required');
let lastEnd = 0;
for (const match of timings) {
  const start = +match[1] * 3600 + +match[2] * 60 + +match[3];
  const end = +match[4] * 3600 + +match[5] * 60 + +match[6];
  assert.ok(start >= lastEnd && end > start && end <= 330.9, 'Cues must be ordered and within the edited video');
  lastEnd = end;
}
assert.ok(lastEnd > 325, 'Captions include the closing message');
const component = fs.readFileSync('components/ModuleOneUpdate.tsx', 'utf8');
assert.ok(component.includes('kind="captions"'));
assert.ok(component.includes('<PreviousUpdate />'));
assert.ok(component.includes('preload="none"'));
assert.ok(!component.includes('autoPlay'));
console.log(`Weekly update media and ${timings.length} caption cues verified.`);
