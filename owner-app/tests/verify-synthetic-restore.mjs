import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const sql=await readFile(new URL('../.test-output/restore-test.sql',import.meta.url),'utf8');
const restored=new DatabaseSync(':memory:');
try{
  restored.exec(sql);
  assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.deepEqual(restored.prepare('PRAGMA foreign_key_check').all(),[]);
  const receipts=restored.prepare('SELECT id,bytes FROM receipts ORDER BY id').all();assert.ok(receipts.length>=9);
  let total=0;
  for(const receipt of receipts){
    const parts=restored.prepare('SELECT data FROM receipt_chunks WHERE receipt_id=? ORDER BY part').all(receipt.id);
    const bytes=Buffer.concat(parts.map(p=>Buffer.from(p.data)));assert.equal(bytes.length,receipt.bytes);
    const expected=Buffer.alloc(receipt.bytes);expected.set([255,216,255]);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),createHash('sha256').update(expected).digest('hex'));total+=bytes.length;
  }
  assert.equal(restored.prepare('SELECT used_bytes FROM receipt_storage').get().used_bytes,total);
  console.log(JSON.stringify({integrity:'ok',foreignKeyErrors:0,receipts:receipts.length,verifiedPhotoBytes:total,expenses:restored.prepare('SELECT count(*) count FROM expenses').get().count,checksum:'all synthetic photos matched SHA-256'}));
}finally{restored.close();}
