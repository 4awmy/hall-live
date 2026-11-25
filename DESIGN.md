# Hall Live — design for review

Use a warm paper palette for phones and the studio, with purple controls and a high-contrast dark projector. The room should feel like a live show. Phones show one action at a time. The projector carries the joke, question or reveal. Presenters work in a separate studio with a shared running order.

| Session | Owner | Audience moment |
| --- | --- | --- |
| Opening | Omar | Omar supplies the opening and any jokes. Add a ballot if it fits the opening. |
| Agentic AI | Omar | Play You Are the LLM. Everyone guesses the next word, then the room sees its prediction. Cue several rounds as separate slides. |
| Software engineering | Omar | Pick what you would check before shipping a plausible AI-generated change. Compare choices before the explanation. |
| Learning | Ezzat | Privately reflect on what you ask AI to do before trying it yourself, then vote anonymously. |
| Debate | Ezzat | Vote on the opening motion and revisit it after hearing both sides. |

## From the door to the final vote

- At entry, print Wi-Fi details and a separate website QR plus the literal local address. Joining Wi-Fi and opening the site are two explicit steps. Test common phones and include instructions for staying on Wi-Fi when it reports no internet. Avoid making captive portal behavior a requirement.
- The phone starts in a waiting state, then shows the currently cued slide or ballot. Large tap targets, one choice, immediate confirmation and a visible reconnect state. Late arrivals see the current cue. Closing voting freezes the ballot. The host reveals aggregate results separately.
- The projector mirrors the cue with large type and aggregate results. It carries the debate clock. Open it in a separate window and use browser full screen. Keep editing, credentials and controls on the presenter display.
- Debate clock proposal: 3 minutes for the motion and first vote, 5 minutes per side, 12 minutes for moderated discussion, 3 minutes for closing arguments, and 2 minutes for the final vote and reveal. Ezzat cues each phase. Use distinct slide ballots for the first and final votes.
- For live moderation, the session owner controls what appears, when voting closes, and when results appear. Audience input is limited to predefined choices. Ezzat can take spoken questions in the room.

## Studio and permissions

| Role | Drafts | Live controls |
| --- | --- | --- |
| Omar | Edit opening, agentic AI and software engineering. Read Ezzat’s draft sections. | Cue and moderate Omar’s sections when active. Hand off to Ezzat. |
| Ezzat | Edit learning and debate. Read Omar’s draft sections. | Cue and moderate Ezzat’s sections when active. Hand off to Omar. |
| Audience | None | View live cue and cast one counted vote per browser per ballot. |
| Projector | None | Read the public cue and revealed aggregates. |

Both presenters can work at once on their sections of the shared deck. Saves check slide revisions, so two tabs editing one slide cannot silently overwrite each other. Cueing takes a snapshot of that slide. Changing a draft takes effect on the next cue. Each cue creates a fresh ballot. Only the current owner can hand off the stage. The host operator provisions credentials and holds the backup.

## Local setup and fallback

Run one Node server on an available computer attached to the router’s LAN. The router supplies Wi-Fi. Serve HTML, CSS and JavaScript locally over one origin. Browser polling keeps clients synchronized and recovers after brief disconnects. The prototype uses an atomic local JSON snapshot, a single writer, and in-memory presenter logins. Anonymous ballot receipts use browser cookies and deter casual repeat votes within the same browser. Presenter passwords are supplied at startup. Confirm the venue network trust and transport plan before using presenter credentials on the audience network.

Keep a printed running order, slide copy on the projector computer, a stopwatch and a tally sheet. If phones fail, close the digital poll, ask for a show of hands and tally on paper. If projector networking fails, open the local copy. For a host restart, retain the data file and sign in again. Rehearse WAN disconnected, across the actual Wi-Fi, and simulate simultaneous joins and voting before printing signage. Verify client isolation and the stability of the host address.

Review the role matrix, handoff, debate timing and moderated spoken-question format with both presenters before choosing venue equipment, final credentials, network configuration or the production launch setup. This prototype uses text slides and manually cued results. A production rehearsal should establish backup and restore, a frozen deck export, and the capacity target based on the venue and expected audience.

