# Hall Live — AI, Unfiltered

A presentation website for Omar and Ezzat. Navigate the talk directly with chapter buttons, Previous / Next, arrow keys, Home / End and fullscreen. There is no separate presenter studio screen. Content and poll options are authored in code.

## Review without a server

Run `node scripts/build-pages.mjs` to produce `_site/`. Serve that directory with a static web server. It includes all 48 slides, diagrams, code examples, questions and individual reflection choices. Personal choices are session-only and are explicitly labeled as having no shared tally. The standalone HTML supplied with this review also opens directly as a file.

## Run a shared local session

Requires Node.js 24, with no package installation or internet access.

```powershell
$env:HALL_OMAR = 'choose-a-long-session-password'
node server.mjs
```

1. Open http://127.0.0.1:8080/ on the host display. Choose **Room controls**, enter the password, and unlock the session.
2. Host navigation now cues that slide to the room. The control panel can also cue the current slide, open/close voting, reveal results and start/clear the 30-minute debate clock. Lock controls when finished. Presenter authorization remains on the server.
3. Audience devices use `http://HOST-LAN-IP:8080/?follow=1`. The page follows the current cue and reconnects after brief interruptions. Audience devices can explore independently, then follow again.
4. Open `/join` to make a printable QR pointing at the audience follow view. Set `HALL_BIND` to `0.0.0.0` for the LAN and complete the venue checks in ROUTER-QUICKSTART.md.

This rewrite starts with `hall-presentation-data.json`; older `hall-data.json` drafts are left untouched. Use `HALL_DATA` to select a separate rehearsal data file. Back up data while the host is stopped. Restarting resets presenter sessions. Changes to the source deck require a fresh data path to seed a new session.

## Edit the presentation

`deck.mjs` reads the original Markdown master. `presentation.mjs` enriches that deck with the new flow, SELF framework, diagrams and question options. `app.js` renders slides and diagrams and connects to the original server-controlled ballot lifecycle. Add poll choices in `presentation.mjs`; no studio editing workflow is required. The server retains its authenticated draft endpoints for compatibility.

The prepared Claude walkthrough is explicitly illustrative; no live model response is implied. SELF is attributed to Dan Martell. Diagram captions explain simplifications. Existing research slides retain the citations in the master source register. Vote charts use actual local-server data only. Before/after debate charts compare ballot distributions, not individual changes of mind.

## GitHub Pages — deferred until review

The existing Pages workflow builds this same presentation from `main`. Its output excludes notes, credentials and runtime data. GitHub Pages supports independent navigation and personal reflection; it does not run the Node server or shared polls. A repository administrator must enable **Settings → Pages → Source → GitHub Actions** before publishing. Deployment of this rebuild is deferred pending review.
