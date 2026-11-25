# Hall Live

Hall Live is a review prototype for Omar and Ezzat. See [DESIGN.md](DESIGN.md) for the event flow, permissions and fallback plan.

## Try it on one computer

Open PowerShell in this folder with Node.js available. Set the presenter password before launch.

```powershell
$env:HALL_OMAR = 'replace-with-omar-password'
node server.mjs
```

- Audience: http://127.0.0.1:8080/
- Presenter studio: http://127.0.0.1:8080/?view=studio
- Projector: http://127.0.0.1:8080/?view=projector

Sign in to the studio and cue **You Are the LLM**, then cue each numbered prediction round to open voting, close it, and reveal results. In Debate, cue the introduction and start the 30-minute clock. Each motion has a first and second ballot. Reveal both to see the comparison after the second vote. The clock continues across debate slides.

The studio loads its initial deck from [AI_Event_Presentation_Master.md](AI_Event_Presentation_Master.md). Expand **Speaker notes** in the studio to see the private notes and visual directions. To start with the master when you already have saved drafts, set `HALL_DATA` to a new file path before launching. Existing data files retain their saved deck.

Drafts and live state are stored in hall-data.json in the launch folder. Keep a copy while the server is stopped. Set HALL_DATA to another file path to rehearse with separate data. Stop the server with Ctrl+C. Presenter sessions reset on restart.

## Try it on hall Wi-Fi after review

Set HALL_BIND to 0.0.0.0 before startup. On another device connected to the same router, open http://HOST-LAN-IP:8080 with the actual address. Confirm that the host firewall and router allow access. Disconnect the internet uplink and repeat the rehearsal. The prototype has no package installs, hosted assets or calls to an AI provider. It requires a working connection to the local host. Review access isolation and encrypted presenter transport before using the shared hall network for a real event.

## Audience QR and venue setup

Open `/join` on the running server to generate a printable QR from the verified hall Wi-Fi address. Follow the [router quickstart](ROUTER-QUICKSTART.md) for the phone rehearsal and printing steps.
