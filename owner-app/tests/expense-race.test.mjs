import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Module from 'node:module';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import ts from 'typescript';

// Run the real record handler, validation, and authorization SQL locally. Only
// Access identity resolution is stubbed; this handler receives an existing actor.
const cache = new Map();
function load(relative) {
  const filename = path.resolve(import.meta.dirname, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = mod.require.bind(mod);
  mod.require = (name) => name === './access' ? {} : name.startsWith('.')
    ? load(path.relative(import.meta.dirname, path.resolve(path.dirname(filename), `${name}.ts`)))
    : originalRequire(name);
  cache.set(filename, mod);
  mod._compile(ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
  return mod.exports;
}
const { saveRecord } = load('../worker/records.ts');

for (const interleave of [false, true]) test(`crew expense update ${interleave ? 'cannot race owner review' : 'still succeeds before review'}`, async () => {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(`CREATE TABLE jobs(id TEXT); CREATE TABLE assignments(job_id TEXT,user_id TEXT);
    CREATE TABLE expenses(id TEXT,user_id TEXT,job_id TEXT,date TEXT,vendor TEXT,category TEXT,amount_cents INTEGER,notes TEXT,status TEXT,version INTEGER);
    CREATE TABLE activity(id TEXT,actor_id TEXT,action TEXT,entity_id TEXT,job_id TEXT);
    INSERT INTO jobs VALUES('test-job-001'); INSERT INTO assignments VALUES('test-job-001','test-crew-001');
    INSERT INTO expenses VALUES('test-expense-001','test-crew-001','test-job-001','2026-10-21','Tools','Materials',1000,'','submitted',1);`);
  const DB = {
    prepare(sql) {
      return { bind(...args) { return {
        first: async () => sqlite.prepare(sql).get(...args),
        run: () => ({ meta: { changes: Number(sqlite.prepare(sql).run(...args).changes) } }),
      }; } };
    },
    async batch(statements) {
      // Owner review commits after the crew pre-check but before its UPDATE.
      if (interleave) sqlite.exec("UPDATE expenses SET status='reviewed',version=2 WHERE id='test-expense-001'");
      sqlite.exec('BEGIN');
      try { const result = statements.map(statement => statement.run()); sqlite.exec('COMMIT'); return result; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  try {
    const request = new Request('https://local.invalid/api/expenses/expense-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      version: interleave ? 2 : 1, job_id: 'test-job-001', date: '2026-10-21', vendor: 'Tools', category: 'Materials', amount_cents: 9000,
    }) });
    const update = saveRecord(request, { DB }, { id: 'test-crew-001', role: 'crew' }, 'expenses', 'test-expense-001');
    if (interleave) {
      await assert.rejects(update, error => error.status === 409);
      assert.deepEqual({ ...sqlite.prepare('SELECT status,version,amount_cents FROM expenses').get() }, { status: 'reviewed', version: 2, amount_cents: 1000 });
      assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM activity').get().n, 0);
    } else {
      assert.equal((await update).status, 200);
      assert.equal(sqlite.prepare('SELECT amount_cents FROM expenses').get().amount_cents, 9000);
    }
  } finally { sqlite.close(); }
});
