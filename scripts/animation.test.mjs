import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// 最小浏览器环境验证动画生命周期，避免为静态站引入构建依赖。
function environment(reduced = false) {
  const events = new Map(), frames = new Map(), elements = new Map();
  let sequence = 0;
  function target() {
    const listeners = new Map();
    return {
      addEventListener(type, fn) { const list = listeners.get(type) || []; list.push(fn); listeners.set(type, list); },
      emit(type, value = {}) { for (const fn of listeners.get(type) || []) fn(value); }
    };
  }
  function element() {
    const classes = new Set(), parts = new Map();
    return Object.assign(target(), {
      style: {}, classList: { toggle(key, on) { if (on) classes.add(key); else classes.delete(key); }, add(key) { classes.add(key); }, remove(key) { classes.delete(key); } },
      setAttribute() {},
      querySelector(selector) { if (!parts.has(selector)) parts.set(selector, element()); return parts.get(selector); },
      appendChild(child) { if (child.id) elements.set(child.id, child); },
      getContext() { return new Proxy({ measureText: () => ({ width: 100 }), getImageData: () => ({ data: new Uint8Array(320 * 640 * 4) }) }, { get: (object, key) => key in object ? object[key] : () => {} }); }
    });
  }
  const motion = Object.assign(target(), { matches: reduced });
  const document = Object.assign(target(), { hidden: false, head: element(), body: element(), createElement: element, getElementById: id => elements.get(id) || null });
  const window = Object.assign(target(), { innerWidth: 320, innerHeight: 640, matchMedia: () => motion });
  const context = vm.createContext({ window, document, innerWidth: 320, innerHeight: 640, Math, Uint8Array,
    requestAnimationFrame(fn) { const id = ++sequence; frames.set(id, fn); return id; }, cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout() { return ++sequence; }, clearTimeout() {}
  });
  return { document, window, motion, frames, elements, element, context };
}

test('首页后台停止、恢复不重复调度、减少动态效果停止循环', () => {
  const env = environment();
  env.elements.set('sky', env.element()); env.elements.set('stage', env.element());
  const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInContext(source, env.context);
  assert.equal(env.frames.size, 2);
  env.document.hidden = true; env.document.emit('visibilitychange');
  assert.equal(env.frames.size, 0);
  env.document.hidden = false; env.document.emit('visibilitychange'); env.document.emit('visibilitychange');
  assert.equal(env.frames.size, 2);
  env.motion.matches = true; env.motion.emit('change'); env.window.emit('resize');
  assert.equal(env.frames.size, 0);
  env.motion.matches = false; env.motion.emit('change');
  assert.equal(env.frames.size, 2);
});

test('新版老虎的运动与互动测试单独运行', () => {
  const result = spawnSync(process.execPath, ['--test', 'tests/tiger.test.cjs'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
