import {InputError} from './validation.ts';
export function parseCsv(input:string):string[][] {
  if(input.length>500000) throw new InputError('Use a CSV smaller than 500 KB.');
  const text=input.replace(/^\uFEFF/,''); const rows:string[][]=[];let row:string[]=[],cell='',quoted=false,closed=false;
  for(let i=0;i<text.length;i++) {
    const ch=text[i];
    if(quoted) { if(ch==='"') { if(text[i+1]==='"'){cell+='"';i++;}else {quoted=false;closed=true;} }else cell+=ch; }
    else if(ch==='"') { if(cell || closed) throw new InputError('Invalid CSV quoting.');quoted=true; }
    else if(ch===',' || ch==='\n' || ch==='\r') {row.push(cell);cell='';closed=false;if(ch!==','){if(ch==='\r'&&text[i+1]==='\n')i++;if(row.some(c=>c.trim()))rows.push(row);row=[];} }
    else {if(closed && ch.trim())throw new InputError('Invalid CSV quoting.');if(!closed)cell+=ch;}
    if(cell.length>8000 || row.length>50 || rows.length>201) throw new InputError('Use up to 200 rows, 50 columns, and short text fields.');
  }
  if(quoted)throw new InputError('The CSV has an unfinished quoted field.');
  row.push(cell);if(row.some(c=>c.trim()))rows.push(row);
  if(rows.length<2 || rows.length>201) throw new InputError('Include a header and 1 to 200 data rows.');
  if(rows.some(r=>r.length!==rows[0].length))throw new InputError('Each row must have the same number of columns.');
  if(new Set(rows[0]).size!==rows[0].length)throw new InputError('Give each column a unique heading.');
  return rows;
}
export const IMPORT_STEP_ROWS=3;
export function csvCell(value:unknown):string {
  let text=String(value??'');
  if(/^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))text=`'${text}`;
  return `"${text.replace(/"/g,'""')}"`;
}
export function exportCsv(rows:Record<string,unknown>[],columns:string[]) {
  return '\uFEFF'+[columns.map(csvCell).join(','),...rows.map(row=>columns.map(c=>csvCell(row[c])).join(','))].join('\r\n');
}
export const importFields={
  expenses:['date','vendor','amount','category','notes'],
  invoices:['date','number','customer','total','paid'],
} as const;
export function suggestMapping(headers:string[],kind:keyof typeof importFields):Record<string,string> {
  const aliases:Record<string,string[]>={date:['date','invoice date','expense date'],vendor:['vendor','merchant','supplier','payee','description'],amount:['amount','total','expense amount'],category:['category'],notes:['notes','description'],number:['invoice number','invoice #','invoice no','number','num'],customer:['customer','client','customer name','client name','name'],total:['total','amount','invoice total','total amount'],paid:['paid','amount paid','paid amount','payments']};
  return Object.fromEntries(importFields[kind].map(field=>[field,headers.find(h=>aliases[field].includes(h.trim().toLowerCase()))??'']));
}
