import publicValues from "@/content/replay-public-values.json";

// Exact reviewed public values, never values learned from a visitor's DOM.
// Unknown/dynamic text and attributes remain masked before serialization.
const publicText = new Set(publicValues.text);
const publicAttributes = new Set(publicValues.attributes.map(([name, value]) => `${name}\0${value}`));
export function maskReplayText(text: string) {
  return publicText.has(text.trim()) ? text : text.replace(/\S/g, "*");
}
export function maskReplayAttribute(name: string, value: string) {
  if (name === "href" && /^\/_next\/static\/[a-zA-Z0-9_./-]+\.css$/.test(value)) return value;
  if (name === "src" && /^\/_next\/static\/[a-zA-Z0-9_./-]+\.(?:woff2?|png|svg)$/.test(value)) return value;
  if (["value", "placeholder", "srcdoc", "data", "rr_dataURL"].includes(name)) return "";
  return publicAttributes.has(`${name}\0${value}`) ? value : "";
}
