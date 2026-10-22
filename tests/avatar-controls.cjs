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
(async () => {
  w.eval(runtime);
  await wait(400);
  let count = 0;
  for (const route of routes) {
    w.JP_SOUND_STARTED = false;
    w.localStorage.setItem('jp-voice-muted', 'false');
    w.projectGo(route);
    await wait(80);
    const d = w.document, avatar = d.getElementById('avatarWrap');
    if (!avatar) continue;
    const controls = d.getElementById('reliableGuideControls');
    const row = controls?.querySelector('.guide-playback-buttons');
    assert(row, `Missing sound controls: ${route}`);
    const actions = controls.parentElement;
    assert(actions.classList.contains('guide-actions-row'), route);
    assert.equal(actions.parentElement, avatar.closest('.guide-intro-band,.section-guide-band'), route);
    const welcome = d.getElementById('soundWelcome');
    assert(welcome, route);
    assert.equal(welcome.parentElement, actions, route);
    assert(!d.getElementById('continueWithoutSound'), route);
    assert.equal(welcome.querySelectorAll('button').length, 1, route);
    const startStyle = w.getComputedStyle(welcome);
    assert.equal(startStyle.gridColumn, '1', route);
    assert.equal(startStyle.gridRow, '1', route);
    assert.equal(startStyle.justifyContent, 'center', route);
    assert.equal(startStyle.alignSelf, 'end', route);
    d.getElementById('startExperienceSound').click();
    assert(!d.getElementById('soundWelcome'), 'Remove Start immediately: ' + route);
    await wait(15);
    const mute = d.querySelector('.avatar-mute');
    assert(mute, `Missing local Mute control: ${route}`);
    assert.equal(mute.parentElement, row, `Mute separated from playback buttons: ${route}`);
    assert.deepEqual([...row.children].map(b => b.id || b.className), ['avatar-mute', 'guideReliablePlay', 'guideReliableStop']);
    assert.equal(w.getComputedStyle(controls).display, 'contents', route);
    const css = w.getComputedStyle(row);
    assert.equal(css.gridColumn, '2', route);
    assert.equal(css.gridRow, '1', route);
    assert.equal(css.alignSelf, 'end', route);
    assert.equal(css.display, 'flex', route);
    assert.equal(css.flexDirection, 'row', route);
    assert.equal(css.flexWrap, 'nowrap', route);
    assert.equal(css.alignItems, 'flex-end', route);
    for (const button of row.children) {
      const style = w.getComputedStyle(button);
      assert.equal(style.marginTop, '0px', route);
      assert.equal(style.marginBottom, '0px', route);
      assert.equal(style.minHeight, '32px', route);
    }
    count++;
  }
  assert(count >= 15, 'Too few avatar pages checked');
  assert.deepEqual(errors, []);
  process.stdout.write(`PASS: one bottom-aligned row of avatar buttons on ${count} pages.\n`);
})().catch(error => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; }).finally(() => w.close());
