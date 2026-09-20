import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.argv[2] || "dist");
const origin = "https://phuketvisaservice.com";
const failures = [];
const warnings = [];
async function walk(dir) { const files=[]; for (const entry of await readdir(dir,{withFileTypes:true})) { const file=path.join(dir,entry.name); if(entry.isDirectory()) files.push(...await walk(file)); else if(entry.name.endsWith(".html")&&!file.endsWith("assets/index.html")) files.push(file); } return files; }
function attr(tag,name){ return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`,"i"))?.[1] || ""; }
function routeFor(file){ const rel=path.relative(root,file).replaceAll(path.sep,"/"); return rel==="index.html"?"/":rel.endsWith("/index.html")?`/${rel.slice(0,-10)}`:`/${rel}`; }
function fileForUrl(value){ const pathname=new URL(value,origin).pathname; return path.join(root,pathname.slice(1),pathname.endsWith("/")?"index.html":""); }

const files=await walk(root); const pages=[]; const unique={title:new Map(),description:new Map(),canonical:new Map()};
for(const file of files){ const html=await readFile(file,"utf8"); if(/(?:4\.9\/5|500\+\s*(?:clients|expats|reviews|bewertungen|клиент|отзыв)|reply in minutes|antwort in minuten)/i.test(html)) failures.push(`${routeFor(file)}: unverified rating, volume or response-time claim`); if(/name=["']robots["'][^>]+noindex/i.test(html)) continue; const title=html.match(/<title>([^<]+)<\/title>/i)?.[1].trim()||""; const description=[...html.matchAll(/<meta\b[^>]*>/gi)].find(t=>attr(t[0],"name").toLowerCase()==="description"); const desc=description?attr(description[0],"content").trim():""; const canonicalTag=[...html.matchAll(/<link\b[^>]*>/gi)].find(t=>attr(t[0],"rel").toLowerCase()==="canonical"); const canonical=canonicalTag?attr(canonicalTag[0],"href"):""; const h1=(html.match(/<h1(?:\s|>)/gi)||[]).length; if(h1!==1) failures.push(`${routeFor(file)}: expected one H1, found ${h1}`); for(const [type,value] of [["title",title],["description",desc],["canonical",canonical]]){ if(!value) failures.push(`${routeFor(file)}: missing ${type}`); else { const list=unique[type].get(value)||[]; list.push(routeFor(file)); unique[type].set(value,list); } } const alternates=[...html.matchAll(/<link\b[^>]*>/gi)].filter(t=>attr(t[0],"rel").toLowerCase()==="alternate"&&attr(t[0],"hreflang")).map(t=>({lang:attr(t[0],"hreflang"),href:attr(t[0],"href")})); pages.push({file,html,canonical,alternates,route:routeFor(file)}); }
for(const [type,map] of Object.entries(unique)) for(const [value,routes] of map) if(routes.length>1) failures.push(`duplicate ${type}: ${routes.join(", ")}`);
const byCanonical=new Map(pages.map(page=>[page.canonical,page]));
for(const page of pages){ const langs=new Set(page.alternates.map(a=>a.lang)); if(page.alternates.length&&(!langs.has("x-default")||![...langs].some(l=>["en","de","ru"].includes(l)))) failures.push(`${page.route}: incomplete hreflang cluster`); for(const alt of page.alternates){ if(!alt.href.startsWith(origin)) { failures.push(`${page.route}: foreign hreflang ${alt.href}`); continue; } const target=byCanonical.get(alt.href); if(!target) failures.push(`${page.route}: hreflang target is not canonical/indexable: ${alt.href}`); else if(alt.lang!=="x-default"&&!target.alternates.some(back=>back.href===page.canonical)) failures.push(`${page.route}: hreflang target does not link back: ${alt.href}`); } }
const linked=new Set(["/"]); for(const page of pages) for(const m of page.html.matchAll(/href=["']([^"'#]+)["']/gi)){ try{const url=new URL(m[1],origin);if(url.origin===origin)linked.add(url.pathname);}catch{}}
for(const page of pages) if(!linked.has(new URL(page.canonical).pathname)) warnings.push(`${page.route}: no internal HTML link found`);
if(warnings.length) console.warn(`SEO warnings (${warnings.length}):\n${warnings.join("\n")}`);
if(failures.length){ console.error(`SEO gate failed (${failures.length}):\n${failures.join("\n")}`); process.exit(1); }
console.log(`SEO gate passed: ${pages.length} indexable pages, unique metadata and reciprocal hreflang.`);
