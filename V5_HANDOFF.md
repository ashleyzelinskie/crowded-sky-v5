# Crowded Sky v5 — where we left off (12 Nov 2026)

Nothing has been pushed to GitHub or deployed. Everything is local and on branch `crowded-sky-v5`.

## Done and committed locally
- `autonomous-v5.html`: data loading (cache → /api/catalog → CelesTrak → v3 snapshot), daily full refresh, 10-year projections from real constellation ceilings, projected cards marked "THIS OBJECT DOES NOT EXIST YET", gallery key read from `#gallery=<key>` instead of being in the source.
- `companion-v5.html`: no live indicator, fits on a phone without scrolling, "Orbital Period" and "Rev / Day" labels.
- Worker reference code (`crowded-sky-worker/worker.js`), which still needs deploying with a new key.

## Look we settled on (built into autonomous-v5.html, 12 Nov: see `applyExhibitionLook()` at the end of the file)
- Soft relief dots that press into a grey ground. Pricks of light at the centres: gov blue [0.40,0.64,1.00], private copper [0.96,0.58,0.26], prospective white. Debris is three black dots on its own layer beneath the colour.
- Dynamic sizing: bigger when zoomed out, smaller when zoomed in. Thinned and hazed in the overview so it isn't mushy.
- Shiny bronze gradient for everything that was red (reticle, timeline, TODAY, info toggle).
- Info tray identical to the companion card. The new-object notice sits inside the tray.
- No text on the crosshairs. TODAY sits inside the timeline bar.
- Full-catalog binary column on the left.
- New tonight: large-screen scaling. UI and dot sizes scale with screen height, using the laptop as the reference, so a 4K or bigger display keeps the same composition.

## Next steps
1. Large screen: get the specs (resolution, physical size, viewing distance, and which computer drives it). Check 4K frame rate and render the relief at reduced resolution if needed.
2. Done 12 Nov: the look is built into `autonomous-v5.html` as one block. Later this could be merged into the main code instead of being patched on at load.
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

## 12 Nov evening: refinements (built into `applyRefinements()` in autonomous-v5.html)
- Palette: government silver, private bronze, prospective mood-board blue drawn as light only (no relief: they don't exist yet).
- Darker graphite ground (24%), no scanlines or grain.
- Crosshairs: bronze brackets only, no centre cross, and no white sprite over the target.
- The selected target glows in its own colour (debris: no halo).
- Camera approaches each target from the angle with the fewest objects behind it.
- Orbit lines are always drawn (fixed a culling bug that hid them up close), stay visible on the night side, and get a little brighter up close.
- Feathered relief dots. They are delicate in the overview (smaller, lighter shadows), and low-orbit objects are smaller only when zoomed out. Everything is larger up close.
- A third of the targets come from a curated list of notable objects, each with a note: ISS, Tiangong, Hubble, Vanguard 1, Telstar 1, Syncom 2/3, LAGEOS, Envisat, Landsat, Terra, Aqua, Aura, Fermi, ICESat-2, BlueWalker 3, GPS, and debris from the 2007/2021 anti-satellite tests and the 2009 collision.
- Companion badges match: silver, bronze, blue.
