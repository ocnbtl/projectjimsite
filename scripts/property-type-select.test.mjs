import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Exercise real handlers with a small hook harness; browser checks cover actual focus/layout.
function setup() {
  const slots = [];
  const effects = [];
  const formListeners = new Map();
  const documentListeners = new Map();
  let cursor = 0;
  let tree;
  let changes = 0;
  let focused = false;
  const jsx = (type, props) => ({ type, props });
  const react = {
    useId: () => 'property-test',
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value) => { slots[index] = value; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => value !== slots[index].deps[i])) {
        effects.push(() => {
          slots[index]?.cleanup?.();
          slots[index] = { deps, cleanup: callback() };
        });
      }
    },
  };
  const exports = {};
  const source = readFileSync(new URL('../components/property-type-select.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(compiled, {
    exports,
    require: (name) => ({ react, 'react/jsx-runtime': { jsx, jsxs: jsx }, './property-type-select.module.css': { default: {} } })[name],
    document: { addEventListener: (name, handler) => documentListeners.set(name, handler), removeEventListener: (name) => documentListeners.delete(name) },
  });
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap((child) => nodes(child));
    return [node, ...nodes(node.props?.children)];
  }
  const find = (predicate) => nodes(tree).find(predicate)?.props;
  function render(disabled = false) {
    cursor = 0;
    tree = exports.PropertyTypeSelect({ disabled, onValueChange: () => changes++ });
    for (const node of nodes(tree)) {
      if (!node.props?.ref) continue;
      node.props.ref.current = node.type === 'select'
        ? { form: { addEventListener: (name, handler) => formListeners.set(name, handler), removeEventListener: (name) => formListeners.delete(name) } }
        : { focus: () => { focused = true; }, contains: () => false };
    }
    while (effects.length) effects.shift()();
  }
  const button = () => find((node) => node.props?.role === 'combobox');
  const select = () => find((node) => node.type === 'select');
  function key(key) { button().onKeyDown({ key, preventDefault() {} }); render(); }
  render();
  return { button, select, key, render, find, changes: () => changes, focused: () => focused, reset: () => { formListeners.get('reset')(); render(); } };
}

test('property selector preserves the required form field and keyboard selections', () => {
  const s = setup();
  assert.equal(s.select().name, 'propertyType');
  assert.equal(s.select().required, true);
  assert.equal(s.select().value, '');
  s.key('ArrowDown');
  s.key('ArrowDown');
  s.key('Enter');
  assert.equal(s.select().value, 'Commercial');
  assert.equal(s.button()['aria-expanded'], false);
  s.key('Home');
  s.key('Escape');
  assert.equal(s.select().value, 'Commercial');
  s.key('r');
  s.key('Tab');
  assert.equal(s.select().value, 'Residential');
  assert.equal(s.changes(), 2);
});

test('required errors focus the custom control, selection clears errors, and reset clears state', () => {
  const s = setup();
  let prevented = false;
  s.select().onInvalid({ preventDefault() { prevented = true; } });
  s.render();
  assert.equal(prevented, true);
  assert.equal(s.focused(), true);
  assert.equal(s.button()['aria-invalid'], true);
  s.key('c');
  s.key('Enter');
  assert.equal(s.button()['aria-invalid'], undefined);
  s.reset();
  assert.equal(s.select().value, '');
  assert.equal(s.button()['aria-expanded'], false);
  assert.equal(s.button()['aria-invalid'], undefined);
});

test('sending state disables both controls and removes the option menu', () => {
  const s = setup();
  s.key(' ');
  s.render(true);
  assert.equal(s.button().disabled, true);
  assert.equal(s.select().disabled, true);
  assert.equal(s.button()['aria-expanded'], false);
  assert.equal(s.find((node) => node.props?.role === 'listbox'), undefined);
});
