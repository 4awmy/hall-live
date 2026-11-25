# Hall Live

Hall Live is a review prototype for Omar and Ezzat. See [DESIGN.md](DESIGN.md) for the event flow, permissions and fallback plan.

## Try it on one computer

Open PowerShell in this folder with Node.js available. Choose two distinct rehearsal passwords of at least ten characters.

```powershell
$env:HALL_OMAR = 'replace-with-omar-password'
$env:HALL_EZZAT = 'replace-with-ezzat-password'
node server.mjs
```

- Audience: http://127.0.0.1:8080/
- Presenter studio: http://127.0.0.1:8080/?view=studio
- Projector: http://127.0.0.1:8080/?view=projector

Use different browser profiles for the two presenter accounts. Start as Omar and select the seeded You Are the LLM slide. Cue it, open voting and vote from the audience view. Close voting and reveal the results. Hand off to Ezzat, then refresh Ezzat's studio. Cue the debate motion, start the 30-minute clock, and cue the final vote when ready. The clock continues across debate slides.

Drafts and live state are stored in hall-data.json in the launch folder. Keep a copy while the server is stopped. Set HALL_DATA to another file path to rehearse with separate data. Stop the server with Ctrl+C. Presenter sessions reset on restart.

## Try it on hall Wi-Fi after review

Set HALL_BIND to 0.0.0.0 before startup. On another device connected to the same router, open http://HOST-LAN-IP:8080 with the actual address. Confirm that the host firewall and router allow access. Disconnect the internet uplink and repeat the rehearsal. The prototype has no package installs, hosted assets or calls to an AI provider. It requires a working connection to the local host. Review access isolation and encrypted presenter transport before using the shared hall network for a real event.

## Audience QR and venue setup

Open `/join` on the running server to generate a printable QR from the verified hall Wi-Fi address. Follow the [router quickstart](ROUTER-QUICKSTART.md) for the phone rehearsal and printing steps.
