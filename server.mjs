import { createServer } from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { loadDeck } from './deck.mjs';

const names = ['Opening','Agentic AI','Software engineering','Learning','Debate','Closing'];
const presenter = 'Omar';
function slide(section, title, body = '', options = []) {
  return { id: randomUUID(), section, title, body, options, revision: 0 };
}
const file = process.env.HALL_DATA || 'hall-data.json';
let state;
try { state = JSON.parse(readFileSync(file)); }
catch (e) {
  if (e.code !== 'ENOENT') throw e;
  state = { slides: loadDeck(), live:null, phase:'waiting', votes:{}, end:null };
}
function save(next) {
  writeFileSync(file + '.tmp', JSON.stringify(next));
  renameSync(file + '.tmp', file);
  state = next;
}
const bind = process.env.HALL_BIND || '127.0.0.1';
const password = process.env.HALL_OMAR;
const minimumLength = ['127.0.0.1', '::1', 'localhost'].includes(bind) ? 3 : 10;
if (!password || password.length < minimumLength) {
  throw Error('Set HALL_OMAR to a password of at least '+minimumLength+' characters.');
}
const expectedPassword = Buffer.from(password);
const sessions = new Map();
const assets = Object.fromEntries(Object.entries({'/':'index.html','/app.js':'app.js','/style.css':'style.css','/join':'join.html','/join.js':'join.js','/qrcode.js':'qrcode.js'}).map(([url,path]) => [url,readFileSync(new URL(path,import.meta.url))]));
const send = (res, code, value) => {
  res.writeHead(code, {'Content-Type':'application/json','Cache-Control':'no-store'});
  res.end(JSON.stringify(value));
};
function reject(status, message) { throw Object.assign(Error(message), {status}); }
function cookie(req, key) { return req.headers.cookie?.match(new RegExp('(?:^|; )' + key + '=([a-f0-9-]+)'))?.[1]; }
function setCookie(res, key, id, extra = '') {
  const prev = res.getHeader('Set-Cookie') || [];
  res.setHeader('Set-Cookie', [...prev, key+'='+id+'; Path=/; HttpOnly; SameSite=Strict'+extra]);
}
async function input(req) {
  if (req.headers['content-type'] !== 'application/json') reject(415,'Expected JSON.');
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 18000) reject(413,'Request is too large.');
  }
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {}
  reject(400,'Invalid request.');
}
function ballotCounts(options, votes) {
  return options.map((_, i) => Object.values(votes).filter(vote => vote === i).length);
}
function publicState(voter) {
  const {live,phase,votes,end} = state;
  const counts = phase === 'revealed' ? ballotCounts(live.options, votes) : null;
  const prior = counts && /^debate-\d{2}-post$/.test(live.id)
    ? state.debateResults?.[live.id.replace(/-post$/, '-pre')]
    : null;
  return {host:presenter,live,phase,end,counts,prior,now:Date.now(),voted:Object.hasOwn(votes,voter)};
}
createServer(async (req,res) => {
  try {
    const path = new URL(req.url,'http://localhost').pathname;
    const token = cookie(req,'presenter');
    const session = sessions.get(token);
    const user = session?.expires > Date.now() ? session.user : undefined;
    let voter = cookie(req,'voter');
    if (req.method === 'GET') {
      if (assets[path]) {
        res.writeHead(200, {'Content-Type':path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'text/html; charset=utf-8','Cache-Control':'no-cache'});
        return res.end(assets[path]);
      }
      if (path === '/state') {
        if (!voter) { voter = randomUUID(); setCookie(res,'voter',voter,'; Max-Age=86400'); }
        return send(res,200,publicState(voter));
      }
      if (path === '/studio') {
        if (!user) reject(401,'Sign in to open the studio.');
        return send(res,200,{ user, names,slides:state.slides,host:presenter,phase:state.phase,live:state.live,end:state.end,voteCount:Object.keys(state.votes).length });
      }
    }
    if (req.method !== 'POST') reject(404,'Page not found.');
    const args = await input(req);
    if (path === '/login') {
      const supplied = Buffer.from(typeof args.password === 'string' ? args.password : '');
      if ((args.user !== undefined && args.user !== presenter) || expectedPassword.length !== supplied.length || !timingSafeEqual(expectedPassword,supplied)) reject(401,'Check your password.');
      sessions.delete(token);
      const id = randomUUID();
      sessions.set(id,{user:presenter,expires:Date.now()+8*3600000});
      setCookie(res,'presenter',id,'; Max-Age=28800');
      return send(res,200,{ok:true});
    }
    const next = structuredClone(state);
    if (path === '/vote') {
      if (!voter || next.phase !== 'open' || args.ballot !== next.live?.ballot) reject(409,'This ballot is closed or has changed.');
      if (!Number.isInteger(args.choice) || args.choice < 0 || args.choice >= next.live.options.length) reject(400,'Choose an answer.');
      if (Object.hasOwn(next.votes,voter)) {
        if (next.votes[voter] !== args.choice) reject(409,'Your vote is already counted.');
        return send(res,200,{ok:true});
      }
      next.votes[voter] = args.choice;
    } else {
      if (!user) reject(401,'Sign in to continue.');
      if (path === '/logout') {
        sessions.delete(token);
        setCookie(res,'presenter','','; Max-Age=0');
        return send(res,200,{ok:true});
      }
      const target = next.slides.find(s => s.id === args.id);
      if (path === '/add') {
        if (!Number.isInteger(args.section) || !names[args.section]) reject(400,'Choose a valid section.');
        next.slides.push(slide(args.section,'Untitled slide'));
      } else if (path === '/save') {
        if (!target) reject(404,'Slide not found.');
        if (target.revision !== args.revision) reject(409,'Someone saved a newer version. Copy your edits before refreshing.');
        const {title,body,options} = args;
        if (typeof title !== 'string' || !title.trim() || title.length > 100 || typeof body !== 'string' || body.length > 700 || !Array.isArray(options) || options.length === 1 || options.length > 6 || options.some(o => typeof o !== 'string' || !o.trim() || o.length > 90)) reject(400,'Use a title, up to 700 characters of slide text, and zero or two to six short choices.');
        Object.assign(target,{title,body,options,revision:target.revision+1});
      } else {
        if (args.ballot !== (next.live?.ballot ?? null)) reject(409,'The stage changed. Refresh the studio before cueing.');
        switch (path) {
          case '/cue':
            if (!target) reject(404,'Slide not found.');
            next.live = {id:target.id, section:target.section, title:target.title,
              body:target.body, options:target.options, ballot:randomUUID()};
            next.votes = {};
            next.phase = 'ready';
            break;
          case '/phase':
            if (!next.live?.options.length || !{ready:'open',open:'closed',closed:'revealed'}[next.phase] || {ready:'open',open:'closed',closed:'revealed'}[next.phase] !== args.phase) reject(409,'That action is unavailable for this ballot.');
            next.phase = args.phase;
            if (next.phase === 'revealed' && /^debate-\d{2}-(pre|post)$/.test(next.live.id)) {
              next.debateResults ??= {};
              next.debateResults[next.live.id] = {
                options: next.live.options,
                counts: ballotCounts(next.live.options, next.votes)
              };
            }
            break;
          case '/clock':
            if (next.live?.section !== 4) reject(409,'Cue a debate slide first.');
            next.end = args.start ? Date.now()+30*60000 : null;
            break;
          default: reject(404,'Action not found.');
        }
      }
    }
    save(next);
    send(res,200,{ok:true});
  } catch (e) {
    if (!e.status) console.error(e);
    if (!res.headersSent) send(res,e.status || 500,{error:e.status ? e.message : 'The host could not save or load the event.'});
  }
}).listen(Number(process.env.HALL_PORT || 8080),bind,function () {
  const {address,port} = this.address();
  console.log('Hall Live listening on '+address+':'+port);
});
