const main = document.querySelector('main');
const notice = document.querySelector('#notice');
const view = new URLSearchParams(location.search).get('view');
const mode = view === 'projector' || view === 'studio' ? view : 'audience';
document.body.dataset.view = mode;
const currentLink = document.querySelector({audience:'nav a:first-child',projector:'nav a:nth-child(2)',studio:'nav a:last-child'}[mode]);
currentLink.setAttribute('aria-current','page');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let snapshot, selected, signature, offset = 0, busy = false;
async function request(path,data) {
  const res = await fetch(path,data === undefined ? {} : {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result = await res.json();
  if (!res.ok) throw Object.assign(Error(result.error),{status:res.status});
  return result;
}
function clock() {
  const el = document.querySelector('.clock');
  if (!el || !snapshot?.end) return;
  const seconds = Math.max(0,Math.ceil((snapshot.end-Date.now()-offset)/1000));
  el.textContent = Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
}
async function act(work, message) {
  if (busy) return;
  busy = true;
  notice.textContent = '';
  try { await work(); notice.textContent = message || ''; }
  catch (e) { notice.textContent = e.message; }
  finally { busy = false; }
}
async function refreshPublic() {
  const data = await request('/state');
  if (busy) return;
  offset = data.now - Date.now();
  snapshot = data;
  const key = JSON.stringify({...data,now:0});
  if (signature === key) return;
  signature = key;
  const {live,phase,end,counts,voted,host} = data;
  const e = escapeHTML;
  const audience = mode === 'audience';
  const stageLabel = live ? 'Live on stage' : 'Waiting for the stage';
  const pollLabels = {ready:'Get ready to vote',open:'Voting open',closed:'Voting closed',revealed:'Poll results'};
  const status = live?.options.length ? pollLabels[phase] : stageLabel;
  let interaction = '';
  if (phase === 'revealed') {
    const total = counts.reduce((a,b)=>a+b,0);
    interaction = '<ol class="results">'+live.options.map((o,i)=>'<li>'+e(o)+' · '+counts[i]+
      '<meter min="0" max="'+Math.max(1,total)+'" value="'+counts[i]+'" aria-label="'+e(o)+'"></meter></li>').join('')+'</ol><p>'+total+' '+(total===1?'vote':'votes')+'</p>';
  } else if (phase === 'open' && audience && !voted) {
    interaction = '<div class="ballot" aria-label="Choose one answer">'+live.options.map((o,i)=>'<button data-choice="'+i+'"><span class="choice-letter" aria-hidden="true">'+String.fromCharCode(65+i)+'</span><span>'+e(o)+'</span></button>').join('')+'</div>';
  } else if (phase === 'open') {
    interaction = '<p class="poll-message" role="status">'+ (audience ? 'Your vote is in.' : 'Vote on your phone.')+'</p>';
  } else if (phase === 'closed') {
    interaction = '<p>Voting closed. Results are coming.</p>';
  }
  main.innerHTML = '<article class="stage" data-phase="'+phase+'"><div class="stage-top"><span class="stage-status">'+status+'</span>'+
    '<span>'+e(host)+'</span></div><div class="stage-content"><h1>'+e(live?.title || 'You’re in the hall.')+'</h1><p>'+e(live?.body || (live ? '' : 'Keep this page open. You’ll see the next activity here.'))+'</p>'+
    (end ? '<div class="timer"><span>Debate time left</span><time class="clock" aria-label="Debate time remaining"></time></div>' : '')+interaction+'</div></article>';
  clock();
  main.querySelectorAll('[data-choice]').forEach(button => button.onclick = async () => {
    main.querySelectorAll('[data-choice]').forEach(b=>b.disabled=true);
    await act(()=>request('/vote',{ballot:live.ballot,choice:Number(button.dataset.choice)}));
    try { await refreshPublic(); }
    catch { notice.textContent = 'Connection lost. Rejoin the hall Wi-Fi to check your vote.'; }
    main.querySelectorAll('[data-choice]').forEach(b=>b.disabled=false);
  });
}
function login() {
  main.innerHTML = '<h1>Presenter studio</h1><form class="login"><label>Presenter<select name="user"><option>Omar</option><option>Ezzat</option></select></label><label>Password<input type="password" name="password" required autocomplete="current-password"></label><button class="primary">Sign in</button></form>';
  main.querySelector('form').onsubmit = event => {
    event.preventDefault();
    act(async()=>{await request('/login',Object.fromEntries(new FormData(event.target)));await studio();});
  };
}
async function studio() {
  let data;
  try { data = await request('/studio'); }
  catch(e) { if (e.status === 401) return login(); throw e; }
  snapshot = data;
  const {slides,names,owners,user,host,live,phase,end,voteCount} = data;
  const e = escapeHTML;
  const current = slides.find(s=>s.id===selected) || slides.find(s=>owners[s.section]===user);
  selected = current.id;
  const edit = owners[current.section] === user;
  const onStage = host === user;
  const deck = names.map((name,section)=>'<section><h2>'+e(name)+'</h2><p>'+owners[section]+'</p>'+
    slides.filter(s=>s.section===section).map(s=>'<button data-select="'+s.id+'" aria-current="'+(s.id===selected)+'">'+e(s.title)+'</button>').join('')+
    (owners[section]===user?'<button data-add="'+section+'">Add slide</button>':'')+'</section>').join('');
  const stageControl = (label,path,value='') => '<button '+(path==='/phase' || (path==='/cue' && !phaseAction) ? 'class="primary" ' : '')+'data-stage="'+path+'" data-value="'+value+'">'+label+'</button>';
  const phaseAction = live?.options.length ? {ready:['Open voting','open'],open:['Close voting','closed'],closed:['Reveal results','revealed']}[phase] : null;
  const controls = (edit && onStage ? stageControl('Cue saved slide','/cue') : '')+
    (onStage && live?.options.length && phaseAction ? stageControl(phaseAction[0],'/phase',phaseAction[1]) : '')+
    (onStage && live?.section===4 ? stageControl(end?'Clear debate clock':'Start 30-minute clock','/clock',end?'clear':'start') : '')+
    (onStage ? stageControl('Hand off to '+(user==='Omar'?'Ezzat':'Omar'),'/handoff') : '');
  main.innerHTML = '<div class="studio-header"><h1>Presenter studio</h1><p><a href="/join">Audience QR</a> · Signed in as <strong>'+user+'</strong></p></div><section class="stage-panel" aria-label="Live stage"><div class="live-summary"><div><p class="stage-status">'+host+' has the stage</p><h2>'+e(live?.title || 'Waiting for a cue')+'</h2></div>'+
    (live?.options.length?'<p class="poll-count">'+voteCount+' '+(voteCount===1?'vote':'votes')+' · '+({ready:'Ready',open:'Open',closed:'Closed',revealed:'Revealed'}[phase] || 'Waiting')+'</p>':'')+'</div>'+
    (end?'<div class="timer"><span>Debate time left</span><time class="clock" aria-label="Debate time remaining"></time></div>':'')+
    '<div class="actions">'+controls+'<button id="refresh">Refresh studio</button><button id="logout">Sign out</button></div></section>'+
    '<div class="studio"><aside class="deck" aria-label="Shared deck"><h2 class="deck-heading">Shared deck</h2>'+deck+'</aside><div class="editor"><h2>'+e(names[current.section])+' · '+e(owners[current.section])+'</h2>'+
    '<form><fieldset '+(edit?'':'disabled')+'><legend>'+ (edit?'Edit slide':'Read-only slide')+'</legend><label>Title<input name="title" required maxlength="100" value="'+e(current.title)+'"></label>'+
    '<label>Slide text<textarea name="body" maxlength="700">'+e(current.body)+'</textarea></label>'+
    '<label>Poll choices <small>Optional. Enter two to six choices, one per line.</small><textarea name="options">'+e(current.options.join('\n'))+'</textarea></label>'+
    (edit?'<button class="primary">Save slide</button>':'')+'</fieldset></form></div></div>';
  main.querySelector('form').onsubmit = event => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.target));
    act(async()=>{
      await request('/save',{...form,id:selected,revision:current.revision,options:form.options.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)});
      await studio();
    },'Slide saved.');
  };
  let dirty = false;
  main.querySelector('form').oninput = () => { dirty = true; };
  const proceed = () => !dirty || (notice.textContent = 'Save your slide before switching views or using stage controls.', false);
  main.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{if (proceed()) act(async()=>{selected=b.dataset.select;await studio();});});
  main.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{if(proceed()) act(async()=>{
    const section=Number(b.dataset.add);
    await request('/add',{section});
    const updated=await request('/studio');
    selected=updated.slides.filter(s=>s.section===section).at(-1).id;
    await studio();
  },'Slide added.');});
  main.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{if(proceed()) act(async()=>{
    await request(b.dataset.stage,{id:selected,ballot:live?.ballot ?? null,phase:b.dataset.value,start:b.dataset.value==='start'});
    await studio();
  });});
  main.querySelector('#refresh').onclick=()=>{if(!dirty || confirm('Discard unsaved edits and reload the shared deck?')) act(studio);};
  main.querySelector('#logout').onclick=()=>{if(proceed()) act(async()=>{await request('/logout',{});login();});};
  clock();
}
if (view === 'studio') act(studio);
else {
  const poll = async () => {
    try {
      await refreshPublic();
      if (notice.dataset.offline) {
        delete notice.dataset.offline;
        notice.textContent = '';
      }
    } catch {
      notice.dataset.offline = 'true';
      notice.textContent = 'Connection lost. Stay on the hall Wi-Fi. Reconnecting…';
    } finally {setTimeout(poll,1600+Math.random()*500);}
  };
  poll();
}
setInterval(clock,250);
