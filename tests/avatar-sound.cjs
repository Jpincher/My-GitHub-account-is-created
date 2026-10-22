const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const entry = fs.readFileSync(path.join(root, 'interactive-learning.html'), 'utf8');
const file = entry.match(/src="(learning-project-[^"]+\.js)(?:\?[^"]*)?"/)[1];
const runtime = fs.readFileSync(path.join(root, file), 'utf8');
const marker = runtime.indexOf('const pages=') + 12;
let depth = 0, quoted = false, escaped = false, end;
for (let i = marker; i < runtime.length; i++) {
  const c = runtime[i];
  if (quoted) {
    if (escaped) escaped = false;
    else if (c === '\\') escaped = true;
    else if (c === '"') quoted = false;
  } else if (c === '"') quoted = true;
  else if (c === '{') depth++;
  else if (c === '}' && --depth === 0) { end = i + 1; break; }
}
const routes = Object.keys(JSON.parse(runtime.slice(marker, end)));
const errors = [];
const console = new VirtualConsole();
console.on('jsdomError', error => {
  if (!/Not implemented|Could not parse CSS/.test(error.message)) errors.push(error.message);
});
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.test/interactive-learning.html',
  runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: console,
  beforeParse(w) {
    w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    w.scrollTo = () => {};
    w.ResizeObserver = class { observe() {} disconnect() {} };
    w.HTMLElement.prototype.scrollIntoView = () => {};
    const paused = new WeakMap();
    Object.defineProperty(w.HTMLMediaElement.prototype, 'paused', { get() { return paused.get(this) !== false; } });
    w.HTMLMediaElement.prototype.play = function () { paused.set(this, false); this.dispatchEvent(new w.Event('play')); return Promise.resolve(); };
    w.HTMLMediaElement.prototype.pause = function () { paused.set(this, true); this.dispatchEvent(new w.Event('pause')); };
    w.HTMLMediaElement.prototype.load = function () {};
  }
});
const w = dom.window;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let attempts = 0;
const nativePlay = w.HTMLMediaElement.prototype.play;
w.HTMLMediaElement.prototype.play = function () { attempts++; return nativePlay.call(this); };
(async () => {
  w.eval(runtime);
  await wait(450);
  assert(w.document.getElementById('startExperienceSound'), 'Start action must be visible on first arrival');
  assert.equal(attempts, 0, 'No sound before the visitor starts the experience');
  w.document.querySelector('[data-language="es"]').click();
  await wait(100);
  assert.equal(attempts, 0, 'Choosing a language must not bypass the start choice');
  assert.match(w.document.getElementById('startExperienceSound').textContent, /Comenzar/);
  const beforeStart = attempts;
  w.document.getElementById('startExperienceSound').click();
  assert(attempts > beforeStart, 'Start must call play synchronously within the user action');
  await wait(50);
  assert(w.JP_SOUND_STARTED);
  assert(!w.document.getElementById('soundWelcome'));
  const shared = w.JP_SHARED_AUDIO;
  for (const route of ['learning-compare.html', 'learning-comparison-document.html', 'learning-university-pack.html']) {
    const before = attempts;
    w.projectGo(route);
    await wait(450);
    assert.equal(w.JP_CURRENT, route);
    assert.equal(w.JP_SHARED_AUDIO, shared, 'Use the same audio element across navigation');
    assert(attempts > before, 'Automatically introduce ' + route);
    assert(!w.document.getElementById('soundWelcome'), 'Do not repeat the welcome choice');
  }
  w.document.querySelector('.avatar-mute').click();
  assert.equal(w.localStorage.getItem('jp-voice-muted'), 'true');
  const beforeMuted = attempts;
  w.projectGo('learning-materials.html');
  await wait(450);
  assert.equal(attempts, beforeMuted, 'Mute must persist across navigation');
  assert(!w.document.getElementById('soundWelcome'));
  w.document.getElementById('voiceMuteToggle').click();
  await wait(50);
  assert(attempts > beforeMuted, 'Unmute restarts the current introduction');
  assert(!w.document.getElementById('continueWithoutSound'));
  w.document.getElementById('guideReliableStop').click();
  w.HTMLMediaElement.prototype.play = () => Promise.reject(Object.assign(new Error('Browser blocked sound'), { name: 'NotAllowedError' }));
  w.document.getElementById('guideReliablePlay').click();
  await wait(30);
  assert(w.document.getElementById('guideReliableStatus').textContent.length > 0, 'Explain a browser playback block');
  assert(w.document.getElementById('guideReliablePlay'), 'Retain an accessible replay fallback');
  assert.deepEqual(errors, []);
  process.stdout.write('PASS: one start action, translated choice, synchronous audio start, automatic page introductions, shared audio, persistent mute and disappearing start action.\n');
})().catch(error => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; }).finally(() => w.close());
