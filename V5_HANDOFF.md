# Crowded Sky v5 — where we left off (12 Nov 2026)

Nothing has been pushed to GitHub or deployed. Everything is local and on branch `crowded-sky-v5`.

## Done and committed locally
- `autonomous-v5.html`: data loading (cache → /api/catalog → CelesTrak → v3 snapshot), daily full refresh, 10-year projections from real constellation ceilings, projected cards marked "THIS OBJECT DOES NOT EXIST YET", gallery key read from `#gallery=<key>` instead of being in the source.
- `companion-v5.html`: no live indicator, fits on a phone without scrolling, "Orbital Period" and "Rev / Day" labels.
- Worker reference code (`crowded-sky-worker/worker.js`), which still needs deploying with a new key.

## Look we settled on (currently test layers in Chrome, not in the file yet)
These live in Chrome's localStorage on art.ashleyzelinskie.com (keys `__v5…`). Tab "A · soft dots" applies them on top of v5. Don't clear site data for art.ashleyzelinskie.com.
- Soft relief dots that press into a grey ground. Pricks of light at the centres: gov blue [0.40,0.64,1.00], private copper [0.96,0.58,0.26], prospective white. Debris is three black dots on its own layer beneath the colour.
- Dynamic sizing: bigger when zoomed out, smaller when zoomed in. Thinned and hazed in the overview so it isn't mushy.
- Shiny bronze gradient for everything that was red (reticle, timeline, TODAY, info toggle).
- Info tray identical to the companion card. The new-object notice sits inside the tray.
- No text on the crosshairs. TODAY sits inside the timeline bar.
- Full-catalog binary column on the left.
- New tonight: large-screen scaling. UI and dot sizes scale with screen height, using the laptop as the reference, so a 4K or bigger display keeps the same composition.

## Next steps
1. Large screen: get the specs (resolution, physical size, viewing distance, and which computer drives it). Check 4K frame rate and render the relief at reduced resolution if needed.
2. Fold all the test layers into `autonomous-v5.html` and `companion-v5.html` properly, then re-run the tests.
3. Open questions:
   - Deepen the copper in dense areas?
   - The "SCANNING / TRANSMITTING" state text: move it into the tray, or remove it?
   - Should projections also grow MEO/GEO?
4. Publishing (only with Ashley's go-ahead):
   1. Deploy the Worker with a new key.
   2. Push the branch and deploy.
   3. On the gallery machine, open `autonomous-v5.html#gallery=<key>`.
   4. Point the QR code at companion-v5.

To resume, reopen this same Claude conversation and say "pick up Crowded Sky v5".
