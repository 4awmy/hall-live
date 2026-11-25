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
const slideDiagrams = {
  O03: {steps:['Input context','Next-token distribution','Selected token','Updated context'], detail:'Repeat with the updated context.'},
  A02: {steps:['Human goal','Model chooses next step','Authorized tool','Result or error'], detail:'The result returns to the model. The model can answer or stop, or seek human review when approval is required.'},
  A04: {steps:['AI application / host','MCP server','Authorized resources'], connector:'⇄', detail:'The host connects via an MCP client. The server can connect to allowed files and allowed databases or services.'},
  A07: {steps:['Audience phone','Local router','Laptop website'], connector:'⇄', detail:'The hall website works on the local network without WAN access.'},
  S02: {steps:['Requirements','Design','Build','Test','Release','Maintain'], detail:'Test feedback returns to design. Maintenance feedback returns to requirements.'},
  L05: {steps:['Try first','Ask for a hint','Explain it','Practice alone','Revisit later'], detail:'If you get stuck during solo practice, return to the hint step.'}
};
function slideDiagram(id) {
  const diagram = slideDiagrams[id];
  if (!diagram) return '';
  return '<figure class="slide-diagram"><ol>'+diagram.steps.map((step,index)=>
    '<li>'+(index ? '<span aria-hidden="true">'+(diagram.connector || '→')+'</span>' : '')+
    '<strong>'+escapeHTML(step)+'</strong></li>').join('')+
    '</ol><figcaption>'+escapeHTML(diagram.detail)+'</figcaption></figure>';
}
function slideCopy(body) {
  return body.split(/(```[\s\S]*?```)/).filter(part => part.trim()).map(part => {
    if (part.startsWith('```')) {
      return '<pre><code>'+escapeHTML(part.replace(/^```[^\n]*\n|\n?```$/g,''))+'</code></pre>';
    }
    const lines = part.trim().split('\n');
    if (lines.length >= 3 && lines.every(line => line.startsWith('|') && line.endsWith('|'))) {
      const cells = line => line.slice(1,-1).split('|').map(cell=>escapeHTML(cell.trim()));
      const headings = cells(lines[0]);
      return '<table class="slide-table"><thead><tr>'+headings.map(heading=>
        '<th scope="col">'+heading+'</th>').join('')+'</tr></thead><tbody>'+
        lines.slice(2).map(line=>'<tr>'+cells(line).map((cell,index)=>index===0
          ? '<th scope="row">'+cell+'</th>'
          : '<td>'+cell+'</td>').join('')+'</tr>').join('')+
        '</tbody></table>';
    }
    return '<p>'+escapeHTML(part.trim())+'</p>';
  }).join('');
}
function ballotResult(options, counts, label = '') {
  const total = counts.reduce((sum, count) => sum + count, 0);
  return '<section class="ballot-result">'+(label ? '<h2>'+label+'</h2>' : '')+
    '<p>'+(total ? total+' '+(total===1?'vote':'votes') : 'No votes received.')+'</p>'+
    '<ol class="results">'+options.map((option,index)=>{
      const count = counts[index];
      const percent = total ? ' · '+Math.round(100*count/total)+'%' : '';
      return '<li>'+escapeHTML(option)+' · '+count+percent+
        '<meter min="0" max="'+Math.max(1,total)+'" value="'+count+
        '" aria-label="'+escapeHTML(option)+'"></meter></li>';
    }).join('')+'</ol></section>';
}
async function refreshPublic() {
  const data = await request('/state');
  if (busy) return;
  offset = data.now - Date.now();
  snapshot = data;
  const key = JSON.stringify({...data,now:0});
  if (signature === key) return;
  signature = key;
  const {live,phase,end,counts,prior,voted} = data;
  const e = escapeHTML;
  const audience = mode === 'audience';
  const stageLabel = live ? 'Live on stage' : 'Waiting for the stage';
  const pollLabels = {ready:'Get ready to vote',open:'Voting open',closed:'Voting closed',revealed:'Poll results'};
  const status = live?.options.length ? pollLabels[phase] : stageLabel;
  let interaction = '';
  if (phase === 'revealed') {
    interaction = prior
      ? '<div class="ballot-comparison">'+ballotResult(prior.options,prior.counts,'First vote')+
        ballotResult(live.options,counts,'Second vote')+'</div>'
      : ballotResult(live.options,counts);
  } else if (phase === 'open' && audience && !voted) {
    interaction = '<div class="ballot" aria-label="Choose one answer">'+live.options.map((o,i)=>'<button data-choice="'+i+'"><span class="choice-letter" aria-hidden="true">'+String.fromCharCode(65+i)+'</span><span>'+e(o)+'</span></button>').join('')+'</div>';
  } else if (phase === 'open') {
    interaction = '<p class="poll-message" role="status">'+ (audience ? 'Your vote is in.' : 'Vote on your phone.')+'</p>';
    if (!audience) interaction += '<ol class="projector-choices">'+live.options.map(o=>'<li>'+e(o)+'</li>').join('')+'</ol>';
  } else if (phase === 'closed') {
    interaction = '<p>Voting closed. Results are coming.</p>';
  }
  main.innerHTML = '<article class="stage" data-phase="'+phase+'"><div class="stage-content"><h1>'+
    e(live?.title || 'You’re in the hall.')+'</h1>'+slideCopy(live?.body || (live ? '' : 'Keep this page open for the next activity.'))+
    slideDiagram(live?.id)+
    '</div>'+(interaction ? '<div class="stage-interaction">'+interaction+'</div>' : '')+
    '<footer class="stage-top"><span class="stage-status">'+status+'</span>'+
    (end ? '<div class="timer"><span>Debate time left</span><time class="clock" aria-label="Debate time remaining"></time></div>' : '')+'</footer></article>';
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
  main.innerHTML = '<h1>Presenter studio</h1><form class="login"><label>Password<input type="password" name="password" required autocomplete="current-password"></label><button class="primary">Sign in</button></form>';
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
  const {slides,names,user,host,live,phase,end,voteCount} = data;
  const e = escapeHTML;
  const current = slides.find(s=>s.id===selected) || slides[0];
  selected = current.id;
  const orderedSlides = names.flatMap((_,section)=>slides.filter(slide=>slide.section===section));
  const liveIndex = orderedSlides.findIndex(slide=>slide.id===live?.id);
  const previous = orderedSlides[liveIndex-1];
  const next = orderedSlides[liveIndex+1];
  const moveButton = (direction, label, target) => '<button data-direction="'+direction+'" data-move="'+e(target?.id || '')+'"'+
    (target ? ' title="'+e(target.title)+'"' : ' disabled')+'>'+label+'</button>';
  const deck = names.map((name,section)=>'<section><h3>'+e(name)+'</h3>'+
    slides.filter(s=>s.section===section).map(s=>'<button data-select="'+s.id+'" aria-current="'+(s.id===selected)+'">'+e(s.title)+
      (s.id===live?.id ? '<span class="deck-live">Live</span>' : '')+'</button>').join('')+
    '<button data-add="'+section+'">Add slide</button>'+'</section>').join('');
  const stageControl = (label,path,value='') => '<button '+(path==='/phase' || (path==='/cue' && !phaseAction) ? 'class="primary" ' : '')+'data-stage="'+path+'" data-value="'+value+'">'+label+'</button>';
  const phaseAction = live?.options.length ? {ready:['Open voting','open'],open:['Close voting','closed'],closed:['Reveal results','revealed']}[phase] : null;
  const controls = stageControl('Cue saved slide','/cue')+
    (live?.options.length && phaseAction ? stageControl(phaseAction[0],'/phase',phaseAction[1]) : '')+
    (live?.section===4 ? stageControl(end?'Clear debate clock':'Start 30-minute clock','/clock',end?'clear':'start') : '');
  const deckScroll = main.querySelector('.deck')?.scrollTop ?? 0;
  main.innerHTML = '<div class="studio-header"><h1>Presenter studio</h1><p><a href="/join">Audience QR</a> · Signed in as <strong>'+user+'</strong></p></div><section class="stage-panel" aria-label="Live stage"><div class="live-summary"><div><p class="stage-status">'+host+' has the stage</p><h2>'+e(live?.title || 'Waiting for a cue')+'</h2></div>'+
    (live?.options.length?'<p class="poll-count">'+voteCount+' '+(voteCount===1?'vote':'votes')+' · '+({ready:'Ready',open:'Open',closed:'Closed',revealed:'Revealed'}[phase] || 'Waiting')+'</p>':'')+'</div>'+
    (end?'<div class="timer"><span>Debate time left</span><time class="clock" aria-label="Debate time remaining"></time></div>':'')+
    '<div class="actions" role="group" aria-label="Slide navigation">'+
    moveButton('previous','Previous slide',previous)+moveButton('next','Next slide',next)+
    (liveIndex>=0?'<span class="slide-position">'+(liveIndex+1)+' / '+orderedSlides.length+'</span>':'')+'</div>'+
    '<div class="actions">'+controls+'<button id="refresh">Refresh studio</button><button id="logout">Sign out</button></div></section>'+
    '<div class="studio"><aside class="deck" aria-label="Presentation deck"><h2 class="deck-heading">Presentation deck</h2>'+deck+'</aside><div class="editor">'+
    '<section class="slide-preview" aria-label="Selected slide preview"><h2>'+e(current.title)+'</h2>'+slideCopy(current.body)+slideDiagram(current.id)+'</section>'+
    '<form><fieldset><legend>Edit slide</legend><label>Title<input name="title" required maxlength="100" value="'+e(current.title)+'"></label>'+
    '<label>Slide text<textarea name="body" maxlength="700">'+e(current.body)+'</textarea></label>'+
    '<label>Poll choices <small>Optional. Enter two to six choices, one per line.</small><textarea name="options">'+e(current.options.join('\n'))+'</textarea></label>'+
    '<button class="primary">Save slide</button></fieldset></form>'+
    (current.notes?'<details class="speaker-notes"><summary>Speaker notes · '+e(current.timing)+'</summary><pre>'+e(current.notes)+'</pre></details>':'')+'</div></div>';
  main.querySelector('.deck').scrollTop = deckScroll;
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
  main.querySelectorAll('[data-move]:enabled').forEach(button=>button.onclick=()=>{if(proceed()) act(async()=>{
    await request('/cue',{id:button.dataset.move,ballot:live?.ballot ?? null});
    selected = button.dataset.move;
    await studio();
    const sameDirection = main.querySelector('[data-direction="'+button.dataset.direction+'"]:enabled');
    (sameDirection || main.querySelector('[data-move]:enabled'))?.focus();
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
