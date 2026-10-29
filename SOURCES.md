# Data sources: Renault Mégane II (X84) 1.6 16V K4M, JR5 manual

Every number links to a source with a tier. Procedures are paraphrased and never copied.

> **Correction (2026-10-29).** The workshop manual reproduced on manuelmeg.org is for the **Mégane II (X84, 2002–2009)**, not the Mégane III. Its vehicle codes are BM0, CM0 and SM0 (M is the Mégane II project code), and it covers the K4J engine and B84/C84/S84 axles. Only the owner's handbook on that site is for the Mégane III. The app's car is now the Mégane II. Any value that came only from the Mégane III handbook or from Mégane III catalogue pages (Autodoc BZ0, Mégane III service intervals) has been removed and shows "No sourced value".

| Tier | Meaning | Used for |
|------|---------|----------|
| `oem` | Renault workshop data (Dialogys / dealer printout) | none yet |
| `manufacturer` | Part maker's official data | none yet |
| `secondary` | Published reproduction of the Renault Mégane II workshop manual (manuelmeg.org); oil-filter cross-reference (Autodoc) | all current values |
| `community` | Forums, videos | not shown by default |

## Files

| File | Contents |
|------|----------|
| `src/data/catalog.ts` | car, brands, 7 core jobs (wheel, front pads/discs, plugs and coils, oil filter, air filter, battery) |
| `src/data/megane3/chassis.json`, `chassis2.json` | brakes, suspension, steering, wheels, pedals |
| `src/data/megane3/engine.json`, `engine2.json` | K4M engine, timing, cooling, fuel, intake, exhaust, engine internals that have a manual page |
| `src/data/megane3/transmission.json` | JR5 gearbox removal, flywheel, seals, driveshafts, gearshift cables |
| `src/data/megane3/hvac-electrical.json` | A/C, heating, cabin electrics |
| `src/data/megane3/body.json` | lighting, wipers, sensors, body; `vehicle-data` is merged into the car's specs |
| `src/data/megane3/taxonomy.json` | every replaceable part (1,106 names in 79 groups) with a manual page link where one exists. Names only, no values. |

(The folder is still called `megane3` to keep imports stable.) Each value has a URL and the original French snippet in `locator`. `npm run validate` checks that every value has a source, units match the stage kind, steps point to real torques, 3D keys exist and ids are unique.

Status on 2026-10-29: 142 jobs, 306 sourced values, 120 not found.

## Spot checks against the live source page

- Strut piston-rod nut 62 Nm (replace the nut); rear carrier 105 Nm; rear guide pins 36 Nm, FRENBLOC; rear hub nut 280 Nm.
- Right driveshaft: hub nut 280, lower ball joint 62, track-rod end 37, anti-roll-bar nut 44, intermediate bearing 44 Nm.
- Subframe: rear crossmember 62, tie rod 105, torque rod on engine (K engines) 105 Nm.
- Master cylinder nuts 50 Nm, pipe nuts 17 Nm; steering-wheel bolt 44 Nm.
- JR5 removal page: torque rod on the engine is 105 Nm in the K4J/K4M/K9K list and 180 Nm in the F-engine list. The app uses the K list.
- K4M camshaft bearing housing (head-gasket page): pre-tighten screws 22, 23, 20 and 13 to 8 Nm, then 1–12, 14–19, 21 and 24 to 12 Nm, slacken 22, 23, 20 and 13, then tighten them to 12 Nm. LOCTITE 518 on the face.

## Known conflicts (shown as "Sources disagree", no value)

- **Rear caliper guide-pin bolts:** the rear pad page (`plaquettes_de_frein-316`) says 0.7 daN·m; the rear disc and caliper pages say 3.6 daN·m.
- **Ignition coil screws:** the coil page (`bobines-200`) says 1.5 daN·m; the K4J/K4M head-gasket page says 1.3 daN·m.
- **Throttle body screws:** the throttle-body and inlet-manifold pages say 1.3 daN·m; the head-gasket refit section says 1.5 daN·m.

A/C line fittings at 8 and 10 Nm are not a conflict; they are different pipe joints.

## Shown with a warning

- **JR5 filler plug, 3 Nm:** the source prints 0.3 daN·m twice; that is unusually low and no second source was found.

## Not available from free sources

- **Cylinder-head bolt sequence and angles:** the manual points to the "Valeurs et réglages" chapter, which is not reproduced.
- **Engine internals:** pistons, rings, bearings, crankshaft, valves.
- **JR5 internals:** shafts, gears, synchros, differential, with their clearances and torques.
- Most body and trim torques, tyre sizes and pressures, oil capacity, service intervals and part numbers for this generation.

The **Every part** page lists all of these, so the gaps are visible. Filling them needs Renault Dialogys (the official Renault data) or licensed data (HaynesPro WorkshopData / TecAlliance); HaynesPro is what the screenshot example uses.
