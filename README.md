# Hall Live — offline launch guide

The live event runs on the host laptop, not on GitHub Pages. The router only supplies the LAN. Node.js 20+ (installed before the event), a copy of this repository, and the ZTE MF296C are sufficient. No npm installation, external AI service, or internet is required at runtime.

## 1. Launch on Windows (one script)

Connect the host laptop to the MF296C by LAN cable or Wi-Fi. Open PowerShell in the repository folder and run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-event.ps1
```

Enter a presenter password of at least 10 characters when prompted. The script binds to all IPv4 interfaces and prints the local and candidate LAN URLs. It changes no global execution policy, adapter configuration, router settings or firewall settings. Keep the terminal open.

| View | Address on the host |
|---|---|
| Studio | http://127.0.0.1:8080/?view=studio |
| Projector | http://127.0.0.1:8080/?view=projector |
| Audience (host test) | http://127.0.0.1:8080/ |
| QR setup | http://127.0.0.1:8080/join |

Audience phones must use the host LAN IPv4 shown for the MF296C-connected adapter, e.g. http://192.168.0.10:8080/ (example only). They must not use localhost, the router IP or the public GitHub Pages URL. Keep the studio login on the host or a trusted presenter network; this prototype uses HTTP, not encrypted transport.

Optional switches:
```powershell
# Separate rehearsal data, without modifying the normal deck
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-event.ps1 -Rehearsal
# Test only on this computer
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-event.ps1 -LocalOnly
# Choose another port
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-event.ps1 -Port 8090
# Automated API poll test; no router required
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-event.ps1 -Test
```

For a non-Windows host, set HALL_OMAR (minimum 10 characters), HALL_BIND=0.0.0.0, HALL_PORT=8080 in the process environment and run node server.mjs from the repository root.

## 2. Test audience interaction

1. Open the studio and sign in. Open the projector in a separate window.
2. Join the same MF296C network on two phones; keep Wi-Fi connected despite the no-internet warning. Disable mobile data for the rehearsal.
3. Open the verified LAN URL on each phone. Cue a numbered **Predict the next word** round (the introduction is not itself a poll).
4. Click **Cue & open poll** to activate the chosen saved poll in one step, or click **Cue saved slide**, then **Open voting**. Both phones should show the poll within a few seconds.
5. Vote on each phone. The presenter tally should update automatically. Each browser's voter cookie allows one answer per ballot; refreshing does not reset it. Separate phones/browser profiles are needed for independent votes.
6. Click **Close voting**, then **Reveal results**. The projector and phones should display the same counts. Counts by option remain hidden until reveal, intentionally.
7. Cue another prediction round or a debate pre/post ballot. A new ballot permits another vote. For debate, reveal both ballots to display their comparison and use the 30-minute clock.
8. Test disconnecting/reconnecting one phone. Repeat with the router's WAN/mobile uplink disconnected. For a fresh rehearsal, use -Rehearsal and a new rehearsal file if needed.

## 3. If something does not work

| Symptom | Action |
|---|---|
| GitHub Pages displays slides but no votes | This is a static preview. Launch the Node server and use its LAN URL. |
| Phones cannot load the page | Confirm same Wi-Fi, correct host IPv4/port, server running, no guest/client isolation, and full http:// URL. |
| Laptop loads site but phones do not | Check Windows Defender Firewall inbound TCP 8080 (or chosen port) and the active network profile. Permit only the event network/subnet if required; do not disable the firewall or expose the port on the internet. |
| Audience sees a title but no choices | Cue an actual poll slide and open voting. |
| Vote is already counted | One cookie per ballot; use a different device or browser profile for testing. |
| No live counts by choice | They appear after Close voting and Reveal results. Studio displays total votes during voting. |
| Studio reports stage changed | Refresh studio before using stage controls. Save any edits first. |
| Port already in use | Stop the previous Hall Live instance or use -Port 8090 and update the QR URL. |
| Node missing | Install Node.js 20+ before going offline. No npm install is needed. |

Open /join on the host to generate a printable QR from the LAN URL that worked on a phone. Reserve the host address in the router if possible; if the IP or port changes, regenerate the QR. Leave router port forwarding off. See [ROUTER-QUICKSTART.md](ROUTER-QUICKSTART.md) for venue details.

## 4. Stop, back up and recover

Press Ctrl+C in the launch terminal. Normal state and saved slides are in hall-data.json (or the HALL_DATA override); -Rehearsal uses hall-rehearsal.json. Back up the file while the server is stopped. Do not delete it to fix polling: it contains your saved deck and votes. Presenter sessions reset on restart. Initial slides come from AI_Event_Presentation_Master.md only when the chosen data file does not exist.

Keep the original slide content and assets unchanged. For a real hall event, test actual audience capacity and network isolation, and review the prototype's single presenter login and unencrypted HTTP before sharing the network. If the network fails, use show-of-hands voting and a local slide backup.

## 5. Automated verification and static preview

Run node --test scripts/poll.test.mjs (or the -Test launcher switch) to exercise the local server with temporary data: two voters, duplicate/stale votes, authorization, live tally, close/reveal, and new ballots. This does not replace phone/browser and router load tests.

GitHub Pages remains a static deck preview, not an audience interaction service. Build with node scripts/build-pages.mjs; _site/ contains the static deck without speaker notes or runtime state. The existing GitHub Actions workflow publishes the preview when configured. See [DESIGN.md](DESIGN.md).
