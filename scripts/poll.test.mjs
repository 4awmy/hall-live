import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

test('presenter cues, two independent voters, live count, reveal, stale ballots', {timeout:20000}, async () => {
  const dir = await mkdtemp(join(tmpdir(),'hall-polls-'));
  const password = 'test-password-only';
  const child = spawn(process.execPath,[fileURLToPath(new URL('../server.mjs',import.meta.url))],{
    env:{...process.env,HALL_BIND:'127.0.0.1',HALL_PORT:'0',HALL_OMAR:password,HALL_DATA:join(dir,'test.json')},
    stdio:['ignore','pipe','pipe']
  });
  const exited = once(child,'exit');
  let stderr = '';
  child.stderr.on('data',chunk=>{stderr += chunk;});
  try {
    const base = await new Promise((resolve,reject)=>{
      let output = '';
      const timer = setTimeout(()=>reject(Error('Server startup timed out: '+stderr)),5000);
      child.on('error',e=>{clearTimeout(timer);reject(e);});
      child.once('exit',()=>{clearTimeout(timer);reject(Error('Server exited: '+stderr));});
      child.stdout.on('data',chunk=>{
        output += chunk;
        const match = output.match(/listening on 127\.0\.0\.1:(\d+)/);
        if (match) {clearTimeout(timer);resolve('http://127.0.0.1:'+match[1]);}
      });
    });
    function client() {
      const cookies = new Map();
      return async (path, data, expected = 200) => {
        const headers = {Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; ')};
        if (data !== undefined) headers['Content-Type']='application/json';
        const res = await fetch(base+path,{headers,...(data===undefined?{}:{method:'POST',body:JSON.stringify(data)})});
        for (const cookie of res.headers.getSetCookie()) {
          const [name,value] = cookie.split(';')[0].split('=');
          cookies.set(name,value);
        }
        const body = await res.json();
        assert.equal(res.status,expected,JSON.stringify(body));
        return body;
      };
    }
    const host=client(), a=client(), b=client(), late=client();
    await host('/login',{password});
    await a('/state'); await b('/state');
    await a('/live-status',undefined,401);
    const studio=await host('/studio');
    const polls=studio.slides.filter(s=>s.options.length>=2);
    assert.ok(polls.length>=2);
    await host('/cue',{id:polls[0].id,ballot:null,open:true});
    const open=await a('/state');
    assert.equal(open.phase,'open');
    assert.equal((await b('/state')).live.ballot,open.live.ballot);
    const ballot=open.live.ballot;
    await a('/vote',{ballot,choice:0});
    await a('/vote',{ballot,choice:0});
    await a('/vote',{ballot,choice:1},409);
    await b('/vote',{ballot,choice:1});
    assert.equal((await host('/live-status')).voteCount,2);
    assert.equal((await a('/state')).voted,true);
    assert.equal((await a('/state')).counts,null);
    await a('/phase',{ballot,phase:'closed'},401);
    await host('/phase',{ballot,phase:'closed'});
    await late('/state'); await late('/vote',{ballot,choice:0},409);
    await host('/phase',{ballot,phase:'revealed'});
    assert.deepEqual((await b('/state')).counts,[1,1,...polls[0].options.slice(2).map(()=>0)]);
    await host('/cue',{id:polls[1].id,ballot});
    assert.equal((await a('/state')).phase,'ready');
    const next=(await a('/state')).live.ballot;
    await host('/phase',{ballot:next,phase:'open'});
    await a('/vote',{ballot,choice:0},409);
    await a('/vote',{ballot:next,choice:0});
    assert.equal((await host('/live-status')).voteCount,1);
  } finally {
    if (child.exitCode===null && child.signalCode===null) child.kill();
    await exited.catch(()=>{});
    await rm(dir,{recursive:true,force:true});
  }
});
