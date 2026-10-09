export function receiptType(bytes: Uint8Array): string|null {
  if(bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff) return 'image/jpeg';
  if([137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x)) return 'image/png';
  if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF' && new TextDecoder().decode(bytes.slice(8,12))==='WEBP') return 'image/webp';
  return null;
}
