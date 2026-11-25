import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadPresentation} from '../presentation.mjs';
const directory=mkdtempSync(join(tmpdir(),'hall-presentation-'));
const child=spawn(process.execPath,['server.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,HALL_PORT:'0',HALL_DATA:join(directory,'session.json'),HALL_OMAR:'test-password-hall'},windowsHide:true,stdio:['ignore','pipe','pipe']});
try{
const base=await new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(Error('Server did not start.')),8000);child.on('error',reject);child.stderr.on('data',data=>{clearTimeout(timeout);reject(Error(String(data)));});child.stdout.on('data',data=>{output+=data;const match=output.match(/listening on 127.0.0.1:(\d+)/);if(match){clearTimeout(timeout);resolve('http://127.0.0.1:'+match[1]);}});});
const client=()=>{let cookie='';return async(path,data)=>{const res=await fetch(base+'/'+path,{method:data===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});for(const c of res.headers.getSetCookie()){const pair=c.split(';')[0],name=pair.split('=')[0];cookie=cookie.split('; ').filter(v=>!v.startsWith(name+'=')).concat(pair).filter(Boolean).join('; ');}return {status:res.status,data:await res.json()};};};
const host=client(),a=client(),b=client();
const deck=(await a('deck.json')).data;
assert.equal(deck.length,48);assert.deepEqual(deck.slice(0,3).map(s=>s.id),['welcome','farewell','in-memoriam']);assert.equal(new Set(deck.map(s=>s.id)).size,48);assert.equal(new Set(deck.map(s=>s.section)).size,6);assert(deck.every(s=>!('notes' in s)&&!('revision' in s)));assert(deck.some(s=>s.visual==='self'));assert(deck.some(s=>s.visual==='sdlc'));
assert.equal((await a('studio')).status,401);assert.equal((await a('cue',{id:deck[0].id,ballot:null})).status,401);
assert.equal((await host('login',{password:'test-password-hall'})).status,200);
await b('state');
async function action(path,args={}){const current=(await host('state')).data;const result=await host(path,{ballot:current.live?.ballot??null,...args});assert.equal(result.status,200,JSON.stringify(result));}
let firstBallot;
for(const phase of ['pre','post']){
await action('cue',{id:'debate-01-'+phase});await action('phase',{phase:'open'});const current=(await a('state')).data;assert.equal(current.counts,null);
if(phase==='post')assert.equal((await a('vote',{ballot:firstBallot,choice:0})).status,409);else firstBallot=current.live.ballot;
assert.equal((await a('vote',{ballot:current.live.ballot,choice:phase==='pre'?0:1})).status,200);
assert.equal((await a('vote',{ballot:current.live.ballot,choice:4})).status,409);
assert.equal((await b('vote',{ballot:current.live.ballot,choice:3})).status,200);
await action('phase',{phase:'closed'});assert.equal((await a('vote',{ballot:current.live.ballot,choice:0})).status,409);await action('phase',{phase:'revealed'});
const result=(await a('state')).data;assert.equal(result.counts.reduce((x,y)=>x+y),2);if(phase==='post')assert.equal(result.prior.counts.reduce((x,y)=>x+y),2);
}
await action('clock',{start:true});assert((await a('state')).data.end>Date.now());await action('clock',{start:false});assert.equal((await a('state')).data.end,null);
const publicKeys=Object.keys((await a('state')).data);assert(!publicKeys.includes('password'));assert(!publicKeys.includes('slides'));
assert.equal((await host('logout',{})).status,200);assert.equal((await host('studio')).status,401);
const generated=JSON.parse(readFileSync(new URL('../_site/deck.json',import.meta.url)));assert.equal(generated.length,loadPresentation().length);assert(generated.every(s=>!('notes' in s)));
console.log('PASS: 48 slides, unique IDs, 6 chapters, SELF/SDLC, public data isolation, authentication, duplicate/stale/closed ballots, before/after results, debate clock, logout and static build.');
}finally{child.kill();await new Promise(resolve=>child.once('exit',resolve));rmSync(directory,{recursive:true,force:true});}
