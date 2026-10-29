# MechGuide (prototype)

Interactive car repair guide: pick a brand, then a car, explore the 3D car, click a component and get its specs and procedure, with an exploded view.

> Prototype only, not a verified workshop manual. The 3D parts and tightening diagrams are schematic, coverage is incomplete, and secondary sources contain unresolved conflicts. Confirm the exact vehicle variant and repair instructions against current OEM data before working on a vehicle.

```bash
npm install
npm run dev   # http://localhost:3000
```

## Using it

- **Click a dot or a part** on the car, or pick a job on the left. Expanding a system in the sidebar shows its dots on the car.
- **✥ Move parts (M):** drag any part off the car with the mouse. **↺ Reassemble (R)** puts everything back.
- **⇱ Explode (E):** exploded view of the selected job. **Esc** returns to the whole car.
- **Guide → Start:** steps through removal and refitting; the parts come off and go back on in 3D.
- **⚙ in the panel:** hide sections, set the minimum source level, switch Nm or lbf·ft.
- **Diagram tab:** a tightening sheet for the job, with every bolt called out with its torque and angle, renew and thread-lock marks, and a red mark where no value is sourced. **⤢ Enlarge** opens a printable sheet.
- **⚙ All torques** (`/cars/<id>/torques`): every fastener on the car in one searchable table.
- **☰ Every part** (`/cars/<id>/parts`): all replaceable parts, colour-coded by how far the data reaches.
- `npm run validate` checks the research data.

## Realistic car body

The app uses a car body built in code. A glTF model can be added with `model3d` in `src/data/catalog.ts`; it is rotated, scaled and placed on the ground automatically. The Mégane III model used earlier was removed when the car was corrected to the Mégane II (see SOURCES.md).

## Structure

- `src/data/catalog.ts` holds brands, the car and the core jobs, and merges the research files in `src/data/megane3/*.json` (see [SOURCES.md](SOURCES.md)). New research follows the brief kept with the project notes; `scripts/validate-data.mjs` is the gate.
- `src/lib/types.ts` defines the data model. Each `SpecSource` has a tier: `oem`, `manufacturer`, `secondary` or `community`.
- `src/lib/prefs.ts` holds the user's filters (hidden sections, minimum source tier, Nm or lbf·ft), saved in localStorage.
- `src/components/CarExplorer.tsx` links procedure steps to the 3D view. Parts listed in a step's `detach` move off the car, and parts in `focus` are highlighted.
- `src/components/CarViewer.tsx` sets up the 3D scene, lighting, camera fly-to and the body opacity slider.
- `src/components/three/parts.tsx` contains the part models: wheels (5×114.3), vented disc and caliper with pads, struts and springs, a K4M-style engine with coils and spark plugs, sump plug, oil filter, gearbox, battery, airbox, radiator, exhaust and rear torsion beam.
- `src/components/three/scene.tsx` contains `<Sub>`, a selectable and explodable sub-assembly. `tags` controls which component it is highlighted for, and `moves` controls where it travels in the exploded view.
- `src/components/three/CarBody.tsx` contains the code-built coupé body and the glTF loader with auto-alignment.
- `src/components/ProcedurePanel.tsx` has four tabs: Guide (step player), Diagram (`AssemblyDiagram.tsx`), Specs (torques, specifications, parts) and Info (safety, tools, checks, troubleshooting). The ⚙ filter is in the panel header.
- `src/app/api/catalog` serves the catalog as JSON (`GET /api/catalog`).

## Safety rule

Never enter a number without a source. Missing values show **No sourced value**. Every value shows its source tier, and the user can hide anything below a chosen tier. The current values are `secondary` tier (a published reproduction of the Renault Mégane II workshop manual). Before release, check them against Renault Dialogys or licensed data (HaynesPro WorkshopData / TecAlliance). Procedures are paraphrased, never copied.

## Next steps

1. Get licensed or OEM data to bring values up to `oem` tier and fill the gaps listed in SOURCES.md.
2. Move the catalog into a database (Postgres + Prisma) and add a review step before any spec goes live.
3. Replace the generic parts with accurate models (bought, or made by a 3D artist from measurements).
4. Draw real exploded drawings per assembly (the Diagram tab is a schematic of the fasteners).

## Repository history

The existing prototype was imported in 25 logically grouped commits. These commits organize the initial code and data snapshot; they do not represent the original development timeline.
