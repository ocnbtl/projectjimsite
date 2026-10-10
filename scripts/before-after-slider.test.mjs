import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Exercise the component's real event handlers without browser or analytics side effects.
function setup() {
  let position = 50;
  let captured = false;
  let focused = false;
  const captures = [];
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    react: { useRef: (current) => ({ current }), useState: () => [position, (value) => { position = value; }] },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/image": { default: "image" },
    "@/lib/analytics": { captureAnalyticsEvent: (...args) => captures.push(args) },
    "./before-after-slider.module.css": { default: {} },
  };
  const exports = {};
  const source = readFileSync(new URL("../components/before-after-slider.tsx", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(compiled, { exports, require: (name) => dependencies[name] });
  const tree = exports.BeforeAfterSlider({ title: "Test project" });
  function find(node) {
    if (node?.type === "input") return node.props;
    const children = node?.props?.children;
    for (const child of Array.isArray(children) ? children : [children]) {
      if (child && typeof child === "object") { const result = find(child); if (result) return result; }
    }
  }
  const input = find(tree);
  const target = {
    value: "50", getBoundingClientRect: () => ({ left: 100, width: 1000 }),
    focus: () => { focused = true; }, setPointerCapture: () => { captured = true; },
    hasPointerCapture: () => captured, releasePointerCapture: () => { captured = false; },
  };
  const pointer = (clientX, type = "pointermove", overrides = {}) => ({
    clientX, type, currentTarget: target, pointerId: 1, pointerType: "mouse", button: 0, isPrimary: true,
    prevented: false, preventDefault() { this.prevented = true; }, ...overrides,
  });
  return { input, target, pointer, captures, position: () => position, focused: () => focused };
}

test("custom dragging suppresses the competing native range update and preserves small movements", () => {
  const s = setup();
  const down = s.pointer(600, "pointerdown");
  s.input.onPointerDown(down);
  assert.equal(down.prevented, true);
  assert.equal(s.focused(), true);
  for (const [x, expected] of [[602, 50.2], [604, 50.4], [602, 50.2], [600, 50]]) {
    s.input.onPointerMove(s.pointer(x));
    s.target.value = "48"; // Simulate the competing browser thumb-inset calculation.
    s.input.onChange({ currentTarget: s.target });
    assert.equal(s.position(), expected);
  }
  s.input.onPointerUp(s.pointer(601, "pointerup"));
  assert.equal(s.position(), 50.1);
  assert.equal(s.captures.length, 1);
});

test("cancel keeps the last position, ignores other pointers, and allows the next drag", () => {
  const s = setup();
  s.input.onPointerDown(s.pointer(600, "pointerdown"));
  s.input.onPointerMove(s.pointer(750, "pointermove", { pointerId: 2 }));
  assert.equal(s.position(), 50);
  s.input.onPointerCancel(s.pointer(0, "pointercancel"));
  assert.equal(s.position(), 50);
  s.input.onPointerDown(s.pointer(200, "pointerdown"));
  s.input.onPointerMove(s.pointer(-100));
  assert.equal(s.position(), 0);
  s.input.onPointerUp(s.pointer(2000, "pointerup"));
  assert.equal(s.position(), 100);
});

test("keyboard retains useful steps and exact endpoints", () => {
  const s = setup();
  for (const [key, expected] of [["ArrowRight", 51], ["ArrowLeft", 50], ["PageUp", 60], ["Home", 0], ["End", 100], ["PageDown", 90]]) {
    const event = { key, prevented: false, preventDefault() { this.prevented = true; } };
    s.input.onKeyDown(event);
    assert.equal(event.prevented, true);
    assert.equal(s.position(), expected);
  }
});
