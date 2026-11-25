const select = document.querySelector('#slide');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const chapters = ['Opening', 'Agentic AI', 'Software engineering', 'Learning', 'Debate', 'Closing'];
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try {
  const response = await fetch('./deck.json');
  if (!response.ok) throw Error('The deck could not be loaded. Please reload this page.');
  const slides = await response.json();
  if (!slides.length) throw Error('No slides are available.');
  select.innerHTML = slides.map((slide,index) => `<option value="${index}">${escape(chapters[slide.section])} · ${escape(slide.title)}</option>`).join('');
  function render() {
    const index = Math.max(0, slides.findIndex(slide => '#'+slide.id === location.hash));
    const slide = slides[index];
    select.value = String(index);
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    document.querySelector('#chapter').textContent = chapters[slide.section];
    document.querySelector('#position').textContent = `${index + 1} / ${slides.length}`;
    const copy = slide.body.split(/(```[\s\S]*?```)/).filter(part => part.trim()).map(part => {
      if (part.startsWith('```')) return '<pre><code>'+escape(part.replace(/^```[^\n]*\n|\n?```$/g,''))+'</code></pre>';
      const lines = part.trim().split('\n');
      if (lines.length >= 3 && lines.every(line => line.startsWith('|') && line.endsWith('|'))) {
        const row = (line,tag) => '<tr>'+line.slice(1,-1).split('|').map(cell=>`<${tag}>${escape(cell.trim())}</${tag}>`).join('')+'</tr>';
        return '<table><thead>'+row(lines[0],'th')+'</thead><tbody>'+lines.slice(2).map(line=>row(line,'td')).join('')+'</tbody></table>';
      }
      return '<p>'+escape(part.trim())+'</p>';
    }).join('');
    document.querySelector('#content').innerHTML = '<h1>'+escape(slide.title)+'</h1>'+copy+(slide.options.length ? '<ol class="preview-options">'+slide.options.map(option=>'<li>'+escape(option)+'</li>').join('')+'</ol>' : '');
    document.title = slide.title+' | Hall Live';
  }
  function go(index) { if (index >= 0 && index < slides.length) location.hash = slides[index].id; }
  select.onchange = () => go(Number(select.value));
  previous.onclick = () => go(Number(select.value)-1);
  next.onclick = () => go(Number(select.value)+1);
  addEventListener('hashchange',render);
  addEventListener('keydown',event => {
    if (['SELECT','INPUT','TEXTAREA'].includes(event.target.tagName) || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'ArrowRight') { event.preventDefault();go(Number(select.value)+1); }
    if (event.key === 'ArrowLeft') { event.preventDefault();go(Number(select.value)-1); }
  });
  render();
} catch(error) {
  document.querySelector('#error').textContent = error.message;
  previous.disabled = next.disabled = select.disabled = true;
}
