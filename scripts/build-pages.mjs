import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { loadDeck } from '../deck.mjs';
const output = new URL('../_site/', import.meta.url);
mkdirSync(output, { recursive: true });
const slides = loadDeck().map(({id, section, title, body, options}) => ({id, section, title, body, options}));
writeFileSync(new URL('deck.json', output), JSON.stringify(slides));
copyFileSync(new URL('../style.css', import.meta.url), new URL('style.css', output));
copyFileSync(new URL('./pages.js', import.meta.url), new URL('pages.js', output));
writeFileSync(new URL('.nojekyll', output), '');
writeFileSync(new URL('index.html', output), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hall Live · Presentation</title><link rel="stylesheet" href="./style.css"><style>
.preview-nav{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem}.preview-nav label{flex:1;margin:0;min-width:12rem}.preview-nav select{width:100%}.preview-info{color:var(--muted);margin-bottom:1.5rem}.stage{min-height:55vh}.preview-options{font-size:1.2rem;padding-left:1.5rem}#position{font-variant-numeric:tabular-nums;white-space:nowrap} .stage pre{white-space:pre-wrap;overflow-wrap:anywhere} @media(max-width:600px){.preview-nav label{flex-basis:100%}}
</style></head><body data-view="audience"><header><a class="brand" href="./"><span class="brand-mark" aria-hidden="true"></span>Hall Live</a><a href="https://github.com/4awmy/hall-live">Source &amp; live setup</a></header><main><p class="preview-info">Presentation preview · Browse the deck here. Shared voting, presenter sign-in, editing and the live clock run on the local Hall Live server.</p><div class="preview-nav"><label for="slide">Slide<select id="slide"></select></label><button id="previous" type="button">Previous</button><span id="position" role="status"></span><button id="next" type="button">Next</button></div><article class="stage"><div class="stage-top"><span id="chapter"></span><span>Deck preview</span></div><div class="stage-content" id="content"><p role="status">Loading the presentation…</p></div></article><p id="error" role="alert"></p></main><script type="module" src="./pages.js"></script></body></html>`);
console.log(`Built ${slides.length} public slides in _site (speaker notes excluded).`);
