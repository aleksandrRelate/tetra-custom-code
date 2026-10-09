const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const source = readFileSync(join(__dirname, '../tetra-cadd-features.js'), 'utf8')
  .replace('function init() {', 'function init() { window.initCount++; return;');

function boot({ href, sheet = true, section = true, off = false } = {}) {
  const listeners = {};
  const link = { href, sheet, addEventListener: (event, fn) => { listeners[event] = fn; } };
  const window = { initCount: 0, Tetra: { off: () => off } };
  const document = {
    readyState: 'complete', baseURI: 'https://tetra-relate.webflow.io/cadd',
    currentScript: { src: 'https://example.com/code/tetra-cadd-features.js' },
    querySelector: selector => selector.startsWith('link') ? (href ? link : null) : (section ? {} : null),
    createElement: () => link,
    head: { appendChild: node => { assert.equal(node, link); link.appended = true; } }
  };
  vm.runInNewContext(source, { window, document, URL, console: { warn() {} } });
  return { window, link, listeners };
}

test('unversioned cached CSS is replaced before any phone layers are created', () => {
  const r = boot({ href: 'https://example.com/tetra-cadd-features.css' });
  assert.equal(new URL(r.link.href).searchParams.get('v'), '20261009-1');
  assert.equal(r.window.initCount, 0);
  r.listeners.load();
  assert.equal(r.window.initCount, 1);
});
test('old release is upgraded while retaining other URL parameters', () => {
  const r = boot({ href: 'https://example.com/tetra-cadd-features.css?v=old&theme=light' });
  assert.equal(new URL(r.link.href).searchParams.get('theme'), 'light');
  assert.equal(new URL(r.link.href).searchParams.get('v'), '20261009-1');
  assert.equal(r.window.initCount, 0);
});
test('already loaded matching CSS initializes without another request', () => {
  const r = boot({ href: 'https://example.com/tetra-cadd-features.css?v=20261009-1' });
  assert.equal(r.window.initCount, 1);
  assert.equal(r.listeners.load, undefined);
});
test('missing stylesheet is loaded alongside the script', () => {
  const r = boot();
  assert.equal(r.link.href, 'https://example.com/code/tetra-cadd-features.css?v=20261009-1');
  assert.equal(r.link.appended, true);
  assert.equal(r.window.initCount, 0);
});
test('failed stylesheet leaves static Webflow content intact', () => {
  const r = boot();
  r.listeners.error();
  assert.equal(r.window.initCount, 0);
});
test('absent section and perf kill switch do not request styles', () => {
  for (const opts of [{ section: false }, { off: true }]) {
    const r = boot(opts);
    assert.equal(r.link.appended, undefined);
    assert.equal(r.window.initCount, 0);
  }
});
