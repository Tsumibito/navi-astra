import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/components/Header.astro', import.meta.url), 'utf8');
const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error('No <script> found in Header.astro');
const script = scriptMatch[1];

function makeEnv({ showPopover = true } = {}) {
  const allElements = [];
  const mql = {
    listeners: [],
    addEventListener(type, cb) { this.listeners.push(cb); },
    change(matches) { this.listeners.forEach(cb => cb({ matches })); },
  };

  class FakeElement {
    constructor(tag, attrs = {}) {
      this.tagName = tag.toLowerCase();
      this.attributes = { ...attrs };
      this._listeners = {};
      this.children = [];
      this.parent = null;
      this.style = { setProperty(name, value) { this[name] = value; } };
      this.focused = false;
      allElements.push(this);
    }
    getAttribute(name) { return name in this.attributes ? this.attributes[name] : null; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    hasAttribute(name) { return name in this.attributes; }
    removeAttribute(name) { delete this.attributes[name]; }
    toggleAttribute(name, force) {
      const has = this.hasAttribute(name);
      if (force === undefined) {
        if (has) this.removeAttribute(name);
        else this.setAttribute(name, '');
        return !has;
      }
      if (force && !has) this.setAttribute(name, '');
      if (!force && has) this.removeAttribute(name);
      return force;
    }
    matches(selector) {
      const s = selector.trim();
      if (s.startsWith('#')) return this.getAttribute('id') === s.slice(1);
      if (s.startsWith('[') && s.endsWith(']')) return this.hasAttribute(s.slice(1, -1));
      if (s.startsWith('.')) {
        const cls = String(this.getAttribute('class') || '').split(/\s+/);
        return cls.includes(s.slice(1));
      }
      if (s.includes('.')) {
        const [tag, ...classes] = s.split('.');
        if (tag && this.tagName !== tag.toLowerCase()) return false;
        const cls = String(this.getAttribute('class') || '').split(/\s+/);
        return classes.every(c => cls.includes(c));
      }
      return this.tagName === s.toLowerCase();
    }
    closest(selector) {
      const sels = selector.split(',').map(s => s.trim());
      let node = this;
      while (node) {
        for (const sel of sels) if (node.matches(sel)) return node;
        node = node.parent;
      }
      return null;
    }
    contains(target) {
      let node = target;
      while (node) {
        if (node === this) return true;
        node = node.parent;
      }
      return false;
    }
    append(child) {
      child.parent = this;
      this.children.push(child);
    }
    focus() { this.focused = true; }
    addEventListener(type, cb) { (this._listeners[type] ||= []).push(cb); }
    dispatchEvent(ev) {
      ev.target ??= this;
      ev.currentTarget = this;
      (this._listeners[ev.type] || []).forEach(cb => cb.call(this, ev));
    }
  }

  const doc = {
    _listeners: {},
    body: null,
    addEventListener(type, cb) { (this._listeners[type] ||= []).push(cb); },
    dispatchEvent(ev) { (this._listeners[ev.type] || []).forEach(cb => cb.call(this, ev)); },
    getElementById(id) { return allElements.find(el => el.getAttribute('id') === id); },
    querySelector(sel) { return allElements.find(el => el.matches(sel)); },
  };

  const button = new FakeElement('button', { id: 'menuBtn', 'aria-expanded': 'false', 'aria-controls': 'mobileDrawer' });
  const header = new FakeElement('header', { class: 'site-header' });
  header.append(button);

  const main = new FakeElement('main');
  const footer = new FakeElement('footer');
  const drawer = new FakeElement('div', { id: 'mobileDrawer', popover: 'auto' });
  const link = new FakeElement('a', { href: '/ru/charter' });
  drawer.append(link);

  const body = new FakeElement('body');
  body.append(header);
  body.append(main);
  body.append(footer);
  body.append(drawer);
  doc.body = body;

  if (showPopover) {
    drawer.showPopover = () => {};
    drawer.hidePopover = () => {};
  }

  globalThis.document = doc;
  globalThis.matchMedia = () => mql;

  return { doc, body, header, main, footer, drawer, button, link, mql };
}

test('modern popover: aria-expanded and inert follow toggle events', () => {
  const { drawer, button, main, footer } = makeEnv({ showPopover: true });
  eval(script);

  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(main.hasAttribute('inert'), false);

  drawer.dispatchEvent({ type: 'toggle', newState: 'open' });
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(main.hasAttribute('inert'), true);
  assert.equal(footer.hasAttribute('inert'), true);

  drawer.dispatchEvent({ type: 'toggle', newState: 'closed' });
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(main.hasAttribute('inert'), false);
  assert.equal(footer.hasAttribute('inert'), false);
  assert.equal(button.focused, true);
});

test('modern popover: internal link click calls hidePopover', () => {
  const { drawer, link } = makeEnv({ showPopover: true });
  let hidden = false;
  drawer.hidePopover = () => { hidden = true; };
  eval(script);

  drawer.dispatchEvent({ type: 'click', target: link });
  assert.equal(hidden, true);
});

test('fallback: button toggles drawer, inert state, and Escape returns focus', () => {
  const { doc, drawer, button, main, footer } = makeEnv({ showPopover: false });
  eval(script);

  button.dispatchEvent({ type: 'click', target: button });
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(drawer.style.display, 'block');
  assert.equal(drawer.style.transform, 'translateX(0)');
  assert.equal(main.hasAttribute('inert'), true);
  assert.equal(footer.hasAttribute('inert'), true);
  assert.equal(button.focused, false);

  doc.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(drawer.style.display, 'none');
  assert.equal(drawer.style.transform, 'translateX(100%)');
  assert.equal(main.hasAttribute('inert'), false);
  assert.equal(footer.hasAttribute('inert'), false);
  assert.equal(button.focused, true);
});

test('fallback: no mobileBackdrop element is used and focus does not move to it', () => {
  const { doc, button, drawer } = makeEnv({ showPopover: false });
  assert.equal(doc.getElementById('mobileBackdrop'), undefined);
  eval(script);

  // open then close to verify focus lands on the burger button
  button.dispatchEvent({ type: 'click', target: button });
  drawer.dispatchEvent({ type: 'click', target: { parent: null, closest: () => null } });
  assert.equal(button.getAttribute('aria-expanded'), 'true');

  doc.dispatchEvent({ type: 'keydown', key: 'Escape' });
  assert.equal(button.focused, true);
});
