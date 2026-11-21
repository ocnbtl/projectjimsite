import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

export async function fixture({path='/',initial={},signal={},eligible=false,storageFailure=false,deferPolicy=false,serverSignal=false}={}) {
 const saved=new Map(Object.entries(initial)), sent=[], calls=[], scripts=new Map(), listeners=new Map(), cache=new Map();
 class XHR {open(...args){this.args=args}send(body){sent.push({url:this.args[1],body})}abort(){}}
 const window={location:new URL('https://masonrycolorcorrections.com'+path),navigator:{webdriver:false,...signal,sendBeacon:(url,body)=>{sent.push({url,body});return true}},localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>{if(storageFailure)throw Error();saved.set(k,v)},removeItem:k=>saved.delete(k)},fetch:async(url,init)=>{if(url==='/api/analytics-eligibility')return Response.json({version:2,defaults:{analytics:eligible,heatmaps:eligible,replay:eligible},privacySignal:serverSignal});sent.push({url,body:init?.body});return new Response(null,{status:204})},addEventListener:(name,fn)=>listeners.set(name,fn),dispatchEvent:e=>{listeners.get(e.type)?.(e)}};
 const document={referrer:'https://google.com/search?q=CANARY_PRIVATE',getElementById:id=>scripts.get(id),createElement:()=>({dataset:{},remove(){scripts.delete(this.id)}}),head:{appendChild:s=>scripts.set(s.id,s)},body:{appendChild:s=>scripts.set(s.id,s)},cookie:''};
 const ph=Object.fromEntries(['init','capture','opt_in_capturing','opt_out_capturing','startSessionRecording','stopSessionRecording','set_config'].map(method=>[method,(...args)=>calls.push([method,...args])]));
 const context=vm.createContext({window,navigator:window.navigator,document,XMLHttpRequest:XHR,URL,URLSearchParams,Request,Response,Event,atob,console,fetch:window.fetch,process:{env:{NODE_ENV:'production',NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:'fixture',NEXT_PUBLIC_POSTHOG_HOST:'https://us.i.posthog.com'}}});
 function load(name){if(name==='posthog-js')return{__esModule:true,default:ph};if(name==='@/content/replay-public-values.json')return{__esModule:true,default:JSON.parse(readFileSync(new URL('../content/replay-public-values.json',import.meta.url)))};name=name.replace(/^\.\//,'');if(cache.has(name))return cache.get(name);const exp={};cache.set(name,exp);const source=readFileSync(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInContext('(function(require,exports){'+js+'\n})',context)(load,exp);return exp}
 if(!deferPolicy)await load('analytics-preferences').resolvePrivacyEligibility();
 return{load,window,document,saved,sent,calls,scripts,listeners,XHR};
}
const key='mcc_privacy_choices_v3';
test('fresh unknown location remains off; reviewed default does not overwrite earlier decline',async()=>{for(const legacy of [undefined,'denied']){const f=await fixture({initial:legacy?{mcc_analytics_consent_v2:legacy}:{},eligible:true,deferPolicy:true});const prefs=f.load('analytics-preferences');assert.equal(prefs.getPrivacyPreferences().replay,false);await prefs.resolvePrivacyEligibility();assert.equal(prefs.getPrivacyPreferences().replay,legacy!=='denied')}});
test('each preference is independent, saved, and reloadable',async()=>{const f=await fixture();const p=f.load('analytics-preferences');p.setPrivacyPreference('replay',true);assert.equal(p.getPrivacyPreferences().replay,true);assert.equal(p.getPrivacyPreferences().analytics,false);const next=await fixture({initial:Object.fromEntries(f.saved)});assert.equal(next.load('analytics-preferences').getPrivacyPreferences().replay,true);p.setPrivacyPreference('replay',false);assert.equal(p.getPrivacyPreferences().replay,false)});
test('GPC/DNT override prior grants and cannot be bypassed by controls',async()=>{for(const signal of [{globalPrivacyControl:true},{doNotTrack:'1'},{doNotTrack:'yes'}]){const f=await fixture({signal,initial:{mcc_analytics_consent_v2:'granted'}});const p=f.load('analytics-preferences');p.setPrivacyPreference('replay',true);assert.equal(Object.values(p.getPrivacyPreferences()).some(Boolean),false);f.load('analytics').initializeAnalytics();assert.equal(f.calls.length,0);assert.equal(f.scripts.size,0)}});
test('contact/privacy/private/query/hash and office never initialize providers',async()=>{for(const path of ['/contact','/privacy','/office','/admin','/uploads','/?email=CANARY_PRIVATE','/#CANARY_PRIVATE']){const f=await fixture({path,initial:{mcc_analytics_consent_v2:'granted'}});f.load('analytics').captureAnalyticsPageview(path);assert.equal(f.calls.length,0,path);assert.equal(f.scripts.size,0,path)}const f=await fixture({initial:{mcc_analytics_consent_v2:'granted'}});f.window.location.hostname='office.masonrycolorcorrections.com';assert.equal(f.load('analytics-runtime').isAnalyticsRuntimeAllowed(),false)});
test('blocked storage still honors an immediate session withdrawal',async()=>{const f=await fixture({storageFailure:true,initial:{mcc_analytics_consent_v2:'granted'}});const p=f.load('analytics-preferences');p.setPrivacyPreference('analytics',false);assert.equal(p.getPrivacyPreferences().analytics,false)});
test('dynamic text and attributes are masked while approved public copy is readable',async()=>{const f=await fixture();const m=f.load('replay-privacy');assert.equal(m.maskReplayText('Make mismatched'), 'Make mismatched');assert.ok(!m.maskReplayText('CANARY_PRIVATE@example.com').includes('CANARY'));assert.equal(m.maskReplayAttribute('title','CANARY_PRIVATE'), '');assert.equal(m.maskReplayAttribute('value','CANARY_PRIVATE'), '')});
test('replay-only grant does not initialize GA or send analytics events',async()=>{const f=await fixture({initial:{[key]:JSON.stringify({analytics:false,replay:true,heatmaps:false})}});const a=f.load('analytics');a.captureAnalyticsPageview('/');await new Promise(setImmediate);assert.equal(f.scripts.size,0);assert.ok(f.calls.some(c=>c[0]==='startSessionRecording'));assert.ok(!f.calls.some(c=>c[0]==='capture'));const cfg=f.calls.find(c=>c[0]==='init')[2];assert.equal(cfg.before_send({event:'$pageview',properties:{}}),null);assert.notEqual(cfg.before_send({event:'$snapshot',properties:{}}),null);assert.equal(cfg.session_recording.maskCapturedNetworkRequestFn({name:'CANARY_PRIVATE'}),null)});
test('queued/retried PostHog payloads are checked again at send time for each category',async()=>{const f=await fixture({initial:{mcc_analytics_consent_v2:'granted'}});f.load('analytics').initializeAnalytics();const p=f.load('analytics-preferences');p.setPrivacyPreference('analytics',false);await f.window.fetch('/mcc-route/e/',{body:JSON.stringify({event:'$pageview'})});assert.equal(f.sent.length,0);await f.window.fetch('/mcc-route/e/',{body:JSON.stringify({event:'$heatmaps'})});assert.equal(f.sent.length,1);p.setPrivacyPreference('replay',false);f.window.navigator.sendBeacon('/mcc-route/s/',JSON.stringify({event:'$snapshot'}));assert.equal(f.sent.length,1);const xhr=new f.XHR();xhr.open('POST','/mcc-route/s/');xhr.send(JSON.stringify({event:'$snapshot'}));assert.equal(f.sent.length,1)});
test('withdrawal stops recording and public-to-sensitive route also blocks delayed transport',async()=>{const f=await fixture({initial:{mcc_analytics_consent_v2:'granted'}});const a=f.load('analytics');a.initializeAnalytics();await new Promise(setImmediate);f.load('analytics-preferences').setPrivacyPreference('replay',false);a.syncAnalyticsPreferences();assert.ok(f.calls.some(c=>c[0]==='stopSessionRecording'));f.window.location.pathname='/contact';await f.window.fetch('/mcc-route/e/',{body:JSON.stringify({event:'$pageview'})});assert.equal(f.sent.length,0)});
test('no global popup; footer goes straight to three in-page switches',async()=>{const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');const ui=read('components/analytics-consent.tsx');assert.match(ui,/privacy#privacy-choices/);assert.match(ui,/role="switch"/);assert.match(ui,/"analytics", "Website analytics"/);assert.match(ui,/"heatmaps", "Heatmaps"/);assert.match(ui,/"replay", "Masked page recordings"/);assert.doesNotMatch(read('app/layout.tsx'),/AnalyticsConsent/);assert.match(read('components/analytics-provider.tsx'),/addEventListener\("storage", sync\)/);assert.doesNotMatch(read('lib/analytics.ts'),/initializeCloudflareAnalytics/)});

test('genuine $$heatmap category stays independent and Request bodies cannot bypass opt-out',async()=>{const f=await fixture({initial:{mcc_privacy_choices_v3:JSON.stringify({analytics:true,heatmaps:false,replay:false})}});f.load('analytics').initializeAnalytics();await f.window.fetch('/mcc-route/e/',{body:JSON.stringify({event:'$$heatmap'})});assert.equal(f.sent.length,0);const p=f.load('analytics-preferences');p.setPrivacyPreference('analytics',false);p.setPrivacyPreference('heatmaps',true);await f.window.fetch(new Request('https://masonrycolorcorrections.com/mcc-route/e/',{method:'POST',body:JSON.stringify({event:'$pageview'})}));assert.equal(f.sent.length,0);await f.window.fetch(new Request('https://masonrycolorcorrections.com/mcc-route/e/',{method:'POST',body:JSON.stringify({event:'$$heatmap'})}));assert.equal(f.sent.length,1)});

test('header-only server privacy signals override an explicit stored grant',async()=>{const f=await fixture({initial:{mcc_analytics_consent_v2:'granted'},eligible:true,serverSignal:true});assert.equal(Object.values(f.load('analytics-preferences').getPrivacyPreferences()).some(Boolean),false);f.load('analytics').initializeAnalytics();assert.equal(f.scripts.size,0);assert.equal(f.calls.length,0)});

test('real PostHog batch envelope supports heatmaps alone and rejects mixed withdrawn events',async()=>{const f=await fixture({initial:{mcc_privacy_choices_v3:JSON.stringify({analytics:false,heatmaps:true,replay:false})}});f.load('analytics').initializeAnalytics();await f.window.fetch('/mcc-route/e/',{body:JSON.stringify({api_key:'fixture',batch:[{event:'$$heatmap'}]})});assert.equal(f.sent.length,1);await f.window.fetch('/mcc-route/e/',{body:JSON.stringify({api_key:'fixture',batch:[{event:'$$heatmap'},{event:'$pageview'}]})});assert.equal(f.sent.length,1)});

test('stored consent cannot start collection before header eligibility resolves', async () => {
  const f = await fixture({ initial: { mcc_analytics_consent_v2: 'granted' }, deferPolicy: true, serverSignal: true });
  f.load('analytics').initializeAnalytics();
  assert.equal(f.calls.length, 0);
  assert.equal(f.scripts.size, 0);
  await f.load('analytics-preferences').resolvePrivacyEligibility();
  assert.equal(f.load('analytics-preferences').getPrivacyPreferences().analytics, false);
});

function edgePolicyFixture() {
  const exp = {};
  const source = readFileSync(new URL('../app/api/analytics-eligibility/route.ts', import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const require = name => {
    assert.equal(name, '@/content/iso-country-codes.json');
    return { __esModule: true, default: JSON.parse(readFileSync(new URL('../content/iso-country-codes.json', import.meta.url), 'utf8')) };
  };
  vm.runInNewContext('(function(exports,require){' + js + '})', { Request, Response, process: { env: { VERCEL: '1' } } })(exp, require);
  return async headers => (await exp.GET(new Request('https://masonrycolorcorrections.com/api/analytics-eligibility', { headers }))).json();
}

test('edge policy is feature-specific and honors header signals and missing location', async () => {
  const policy = edgePolicyFixture();
  for (const state of ['OH', 'KY', 'IN', 'WV', 'MI', 'TX', 'AZ', 'NM']) {
    const p = await policy({ 'x-vercel-ip-country': 'US', 'x-vercel-ip-country-region': state });
    assert.equal(p.defaults.replay, true, state);
  }
  for (const state of ['CA', 'FL', 'IL', 'MD', 'MT', 'NH', 'NV', 'PA', 'WA']) {
    const p = await policy({ 'x-vercel-ip-country': 'US', 'x-vercel-ip-country-region': state });
    assert.equal(p.defaults.analytics, true, state);
    assert.equal(p.defaults.heatmaps, true, state);
    assert.equal(p.defaults.replay, false, state);
  }
  for (const headers of [{}, { 'x-vercel-ip-country': 'ZZ' }, { 'x-vercel-ip-country': 'GB', 'x-vercel-ip-country-region': 'ENG' }, { 'x-vercel-ip-country': 'US', 'x-vercel-ip-country-region': 'OH', 'sec-gpc': '1' }, { 'x-vercel-ip-country': 'US', 'x-vercel-ip-country-region': 'OH', dnt: '1' }]) {
    const p = await policy(headers);
    assert.equal(Object.values(p.defaults).some(Boolean), false);
  }
});

test('eligible known non-US locations default to all supported categories', async () => {
  const policy = edgePolicyFixture();
  for (const country of ['JP', 'AU', 'CA', 'NZ']) {
    const p = await policy({ 'x-vercel-ip-country': country });
    assert.equal(p.defaults.analytics, true, country);
    assert.equal(p.defaults.heatmaps, true, country);
    assert.equal(p.defaults.replay, true, country);
  }
});

test('named prior-choice and vendor locations stay off by default', async () => {
  const policy = edgePolicyFixture();
  for (const country of ['DE', 'GB', 'CH', 'TR', 'CN', 'BR', 'AX', 'GF', 'GP', 'MF', 'MQ', 'RE', 'YT']) {
    const p = await policy({ 'x-vercel-ip-country': country });
    assert.equal(Object.values(p.defaults).some(Boolean), false, country);
  }
});

test('known US with an unknown state allows ordinary measurement and holds replay', async () => {
  const policy = edgePolicyFixture();
  for (const region of ['', 'ZZ', 'California']) {
    const p = await policy({ 'x-vercel-ip-country': 'US', 'x-vercel-ip-country-region': region });
    assert.equal(p.defaults.analytics, true);
    assert.equal(p.defaults.heatmaps, true);
    assert.equal(p.defaults.replay, false);
    assert.equal(p.jurisdiction, 'US-unknown');
  }
});

test('invalid and unavailable country values never activate a default', async () => {
  const policy = edgePolicyFixture();
  for (const country of ['', 'ZZ', 'XX', 'UK', 'USA', 'jp', '1A']) {
    const p = await policy({ 'x-vercel-ip-country': country });
    assert.equal(Object.values(p.defaults).some(Boolean), false, country);
    assert.equal(p.jurisdiction, 'unknown');
  }
});

test('navigation stops replay before a query/private URL enters History', async () => {
  const f = await fixture();
  const order = [];
  f.window.history = {
    pushState(_data, _unused, url) { order.push('history'); if (url) f.window.location = new URL(url, f.window.location); },
    replaceState(_data, _unused, url) { order.push('history'); if (url) f.window.location = new URL(url, f.window.location); },
  };
  const nav = f.load('analytics-navigation');
  nav.installAnalyticsNavigationGuard(() => { assert.equal(f.window.location.search, ''); order.push('pause'); });
  f.window.addEventListener(nav.analyticsNavigationEvent, () => order.push('sync'));
  f.window.history.pushState({}, '', '/?secret=CANARY_QUERY');
  assert.deepEqual(order, ['pause', 'history', 'sync']);
});

test('SDK title, search terms, and private referrer hosts are removed', async () => {
  const f = await fixture();
  const sanitizer = f.load('analytics-privacy');
  const data = sanitizer.sanitizeAnalyticsProperties({ $title: 'CANARY_TITLE', $initial_title: 'CANARY_TITLE', $referring_domain: 'CANARY_PRIVATE.example.com', $initial_search_keyword: 'CANARY_SEARCH', $referrer: 'https://CANARY_PRIVATE.example.com/path?q=CANARY_QUERY' });
  assert.equal(JSON.stringify(data).includes('CANARY'), false);
});
