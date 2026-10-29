import type { Brand, Car, Component, SpecSource, TorqueSpec } from "@/lib/types";
import chassis from "./megane3/chassis.json";
import engine from "./megane3/engine.json";
import body from "./megane3/body.json";
import chassis2 from "./megane3/chassis2.json";
import transmission from "./megane3/transmission.json";
import hvacElectrical from "./megane3/hvac-electrical.json";
import engine2 from "./megane3/engine2.json";

/*
 * Data rules
 * - Every number carries at least one SpecSource; values without a source stay
 *   null and the UI shows "No sourced value".
 * - Procedure text is written in our own words from general workshop practice
 *   and the cited sources; it is not a copy of Renault documentation.
 * - Source tiers: see src/lib/types.ts. Research notes: SOURCES.md.
 */

const ACC = "2026-10-29";
const s = (tier: SpecSource["tier"], title: string, url: string, locator?: string): SpecSource =>
  ({ tier, title, url, locator, accessed: ACC });

const MR = "Renault Mégane II (X84) workshop manual — reproduced on manuelmeg.org";
const SRC = {
  brakePads: s("secondary", `${MR}: Plaquettes de frein`, "https://www.manuelmeg.org/plaquettes_de_frein-304.html", "Couples de serrage: vis de colonnettes 3,2 daN.m; vis de roue 11 daN.m"),
  caliperCarrier: s("secondary", `${MR}: Support d'étrier de frein`, "https://www.manuelmeg.org/support_d_eacute_trier_de_frein-306.html", "Support d'étrier 10,5 daN.m (FRENBLOC); colonnettes 3,2; flexible 1,7; roue 11"),
  disc: s("secondary", `${MR}: Disque de frein`, "https://www.manuelmeg.org/disque_de_frein-308.html", "Vis de disque 1,5 daN.m; support d'étrier 10,5; roue 11"),
  wheelChar: s("secondary", `${MR}: Roues — caractéristiques`, "https://www.manuelmeg.org/caract_eacute_ristiques-328.html", "Couple de serrage des vis de roues 11 daN.m"),
  brakeFluid: s("secondary", `${MR}: Liquide de frein`, "https://www.manuelmeg.org/liquide_de_frein-294.html", "SAE J1703 — DOT4; ≤750 mm²/s at −40 °C; interval: see service booklet"),
  plugs: s("secondary", `${MR}: Bougies`, "https://www.manuelmeg.org/bougies-201.html", "Bougies 2,5 à 3 daN.m"),
  coils: s("secondary", `${MR}: Bobines (F4R/K4J/K4M)`, "https://www.manuelmeg.org/bobines-200.html", "Vis de bobines 1,5 daN.m; cylinders 1-4 / 2-3 paired"),
  drainKey: s("secondary", `${MR}: Moteur — vidange (K4J/K4M)`, "https://www.manuelmeg.org/moteur-108.html", "Clé à vidange carrée de 8 mm"),
  airboxK4M: s("secondary", `${MR}: Boîtier de filtre à air (F4R/K4M)`, "https://www.manuelmeg.org/bo_icirc_tier_de_filtre_agrave_air-127.html", "Vis du bac à batterie 2,1 daN.m"),
  coolant: s("secondary", `${MR}: Circuit de refroidissement`, "https://www.manuelmeg.org/vidange_remplissage_du_circuit_de_refroidissement-230.html", "Protection jusqu'à −20 °C ±2 (cold/temperate countries)"),
  adFilter: s("secondary", "Autodoc — oil filter cross-reference", "https://www.autodoc.parts/ridex/8149390", "OE 82 00 768 913; M20×1.5, Ø76 × 52 mm"),
};

const nm = (id: string, fastener: string, value: number | null, sources: SpecSource[], extra: Partial<TorqueSpec> = {}): TorqueSpec => ({
  id, fastener, stages: [{ kind: "torque", value: sources.length ? value : null, unit: "Nm" }], sources, ...extra,
});

const WHEEL_BOLTS = nm("wheel-bolts", "Wheel bolts", 110, [SRC.wheelChar, SRC.brakePads], { qty: 5, notes: "Tighten in a diagonal (star) pattern with the wheel on the ground." });
const LIFT_SAFETY = "Support the car on axle stands or a lift — never work under a car held only by a jack.";

/** Brand directory. Cars appear under a brand only once they have sourced data. */
export const brands: Brand[] = [
  ["renault", "Renault", "FR"], ["peugeot", "Peugeot", "FR"], ["citroen", "Citroën", "FR"], ["dacia", "Dacia", "RO"],
  ["volkswagen", "Volkswagen", "DE"], ["audi", "Audi", "DE"], ["bmw", "BMW", "DE"], ["mercedes-benz", "Mercedes-Benz", "DE"],
  ["opel", "Opel / Vauxhall", "DE"], ["skoda", "Škoda", "CZ"], ["seat", "SEAT / Cupra", "ES"], ["fiat", "Fiat", "IT"],
  ["alfa-romeo", "Alfa Romeo", "IT"], ["ford", "Ford", "US"], ["toyota", "Toyota", "JP"], ["honda", "Honda", "JP"],
  ["nissan", "Nissan", "JP"], ["mazda", "Mazda", "JP"], ["hyundai", "Hyundai", "KR"], ["kia", "Kia", "KR"],
  ["volvo", "Volvo", "SE"], ["tesla", "Tesla", "US"],
].map(([id, name, country]) => ({ id, name, country }));

export const cars: Car[] = [
  {
    id: "renault-megane-2-16-16v",
    brandId: "renault",
    model: "Mégane",
    generation: "II (X84)",
    body: "Hatchback",
    trim: "1.6 16V, JR5 manual",
    engine: "1.6 16V (K4M)",
    years: "2002–2009",
    // Approximate visual size for the code-built body, not a service specification.
    dimensions: { length: 4.21, width: 1.78, wheelbase: 2.625, axleOffset: -0.05, wheelRadius: 0.31, halfTrack: 0.76 },
    specs: [
      { group: "Fluids", label: "Engine oil capacity (with filter)", value: null, notes: "Fill to the dipstick.", sources: [] },
      { group: "Fluids", label: "Engine oil grade", value: null, notes: "Renault grade (RN standard) is in the service booklet.", sources: [] },
      { group: "Fluids", label: "Brake fluid", value: "DOT 4 (SAE J1703)", notes: "Low cold-viscosity type preferred (≤750 mm²/s at −40 °C).", sources: [SRC.brakeFluid] },
      { group: "Fluids", label: "Coolant protection", value: "−20 °C ±2", notes: "For cold/temperate countries. Capacity: not found.", sources: [SRC.coolant] },
      { group: "Service intervals", label: "Engine oil", value: null, notes: "See the Mégane II service booklet.", sources: [] },
      { group: "Service intervals", label: "Timing belt kit", value: null, notes: "See the Mégane II service booklet. Mégane III intervals do not apply.", sources: [] },
      { group: "Service intervals", label: "Brake fluid", value: null, notes: "Renault: see service booklet.", sources: [] },
      { group: "Wheels", label: "Wheel bolt torque", value: "110 Nm", sources: [SRC.wheelChar] },
      { group: "Wheels", label: "Tyre pressures", value: null, notes: "Printed on the label on the driver's door edge — depends on tyre size and load.", sources: [] },
    ],
    components: [
      {
        id: "front-wheel",
        name: "Front wheel",
        system: "Wheels",
        position: [1.25, 0.32, 0.78],
        difficulty: 1,
        timeMinutes: 15,
        summary: "Removing and refitting a front wheel — the first step for any brake or suspension job.",
        safety: [LIFT_SAFETY, "Loosen and final-torque bolts with the tyre on the ground, never with the car in the air."],
        tools: ["Jack + axle stands", "Wheel brace / 17 mm socket (check size)", "Torque wrench (≥110 Nm)", "Locking wheel bolt key (if fitted)", "Wheel chocks"],
        parts: [],
        torques: [WHEEL_BOLTS],
        specs: [],
        removal: [
          { text: "Chock the rear wheels and engage the handbrake. Loosen the five bolts half a turn with the wheel on the ground.", focus: ["wheel-bolts"] },
          { text: "Raise the car and set it on an axle stand at the sill jacking point.", warning: LIFT_SAFETY },
          { text: "Remove the bolts, keeping one at the top until last, then lift the wheel off.", detach: ["wheel-bolts", "wheel"] },
        ],
        installation: [
          { text: "Clean rust and dirt from the hub face and the back of the wheel.", tip: "A thin smear of copper grease on the hub spigot stops the wheel seizing — never on the bolt threads or seats." },
          { text: "Fit the wheel and spin all bolts in by hand.", attach: ["wheel"] },
          { text: "Lower the car, then torque the bolts in a star pattern.", torque: "wheel-bolts", attach: ["wheel-bolts"] },
          { text: "Re-check the torque after 50–100 km.", focus: ["wheel-bolts"] },
        ],
        checks: ["All five bolts torqued", "Hub cap / trim refitted", "Tyre pressure set to the door-label value"],
        faults: [
          { symptom: "Wheel wobble or vibration", causes: "Bolts not torqued evenly, dirt between hub and wheel, damaged rim." },
          { symptom: "Bolt won't reach torque", causes: "Stripped thread in the hub — stop and replace before driving." },
        ],
      },
      {
        id: "front-brake-pads",
        name: "Front brake pads",
        system: "Brakes",
        position: [1.25, 0.32, 0.62],
        difficulty: 2,
        timeMinutes: 60,
        summary: "Floating single-piston caliper. Pads are replaced by removing the lower guide pin bolt and pivoting the caliper up.",
        safety: [
          LIFT_SAFETY,
          "Always replace pads on both front wheels together.",
          "Brake dust is harmful — clean with brake cleaner, never blow it out with air.",
          "Do not twist the brake hose or let the caliper hang on it.",
        ],
        tools: ["Jack + axle stands", "Torque wrench (10–110 Nm range)", "Caliper piston pushback tool (Renault Fre. 1190-01 or equivalent)", "Wire brush", "Brake cleaner", "Brake grease (pad backs / pins)"],
        parts: [
          { name: "Front brake pad set", qty: "1 axle set", replace: "always", notes: "Confirm the brake system variant by VIN." },
          { name: "Guide pin bolts", qty: "as needed", replace: "if-worn" },
        ],
        torques: [
          WHEEL_BOLTS,
          nm("guide-pins", "Caliper guide pin bolts", 32, [SRC.brakePads, SRC.caliperCarrier], { qty: 2 }),
          nm("hose", "Brake hose to caliper", 17, [SRC.caliperCarrier], { notes: "Only if the hose was disconnected — then bleed the brakes." }),
        ],
        specs: [
          { group: "Disc", label: "Front disc size", value: null, notes: "Depends on version — check by VIN.", sources: [] },
          { group: "Disc", label: "Disc minimum thickness", value: null, notes: "Stamped on the disc — use that value.", sources: [] },
          { group: "Pads", label: "Pad thickness new", value: null, sources: [] },
          { group: "Pads", label: "Pad wear limit", value: null, sources: [] },
          { group: "Hydraulics", label: "Brake fluid", value: "DOT 4", sources: [SRC.brakeFluid] },
        ],
        removal: [
          { text: "Remove the front wheel.", detach: ["wheel-bolts", "wheel"], warning: LIFT_SAFETY },
          { text: "Unclip the brake hose from the strut so it can move freely.", focus: ["caliper"] },
          { text: "Remove the lower guide pin bolt and pivot the caliper upwards (or take both pins out and hang the caliper from the spring).", detach: ["guide-pins", "caliper"], warning: "Never let the caliper hang on the hose." },
          { text: "Take out the outer and inner pads.", detach: ["pad-outer", "pad-inner"] },
          { text: "Inspect the disc: measure thickness, check for lips, scoring or cracks.", focus: ["disc"], tip: "If the disc is under minimum thickness, do the brake disc job instead." },
        ],
        installation: [
          { text: "Clean the pad abutments on the carrier and lightly grease the contact points.", focus: ["carrier"] },
          { text: "Push the piston fully back with the pushback tool.", focus: ["caliper"], warning: "Watch the fluid reservoir — it rises as the piston retracts." },
          { text: "Fit the new pads, inner pad first.", attach: ["pad-inner", "pad-outer"] },
          { text: "Lower the caliper, fit the guide pin bolt(s) and torque.", attach: ["caliper", "guide-pins"], torque: "guide-pins" },
          { text: "Re-clip the hose and ABS sensor wire, without twisting the hose." },
          { text: "Refit the wheel and torque the bolts on the ground.", attach: ["wheel", "wheel-bolts"], torque: "wheel-bolts" },
          { text: "Pump the brake pedal several times until it is firm.", warning: "The first pedal press after pushing pistons back does nothing — do this before moving the car." },
        ],
        checks: ["Pedal firm before driving", "Brake fluid between MIN and MAX", "Both sides done", "Bed in: several gentle stops from 50 km/h, avoid hard braking for 200 km"],
        faults: [
          { symptom: "Squeal after fitting", causes: "No grease on pad backs, glazed disc, missing anti-squeal shims." },
          { symptom: "Car pulls to one side", causes: "Seized guide pin or piston on one side, contaminated pad." },
          { symptom: "Soft / long pedal", causes: "Pedal not pumped up, air in the system, hose disturbed." },
        ],
      },
      {
        id: "front-brake-disc",
        name: "Front brake disc",
        system: "Brakes",
        position: [1.25, 0.32, 0.62],
        difficulty: 3,
        timeMinutes: 90,
        summary: "The carrier must come off to remove the disc. Discs cannot be machined — replace them in pairs with new pads.",
        safety: [LIFT_SAFETY, "Replace discs and pads on both sides together.", "Carrier bolts need thread-lock (Renault FRENBLOC type)."],
        tools: ["Jack + axle stands", "Torque wrench (10–110 Nm range)", "Caliper pushback tool", "Impact driver for the disc screws", "Wire brush + brake cleaner", "Thread-lock", "Micrometer"],
        parts: [
          { name: "Front brake discs", qty: "2", replace: "always", notes: "Size depends on version — check by VIN." },
          { name: "Front brake pad set", qty: "1 axle set", replace: "always" },
        ],
        torques: [
          WHEEL_BOLTS,
          nm("guide-pins", "Caliper guide pin bolts", 32, [SRC.caliperCarrier], { qty: 2 }),
          nm("carrier", "Caliper carrier bolts", 105, [SRC.caliperCarrier, SRC.disc], { qty: 2, threadLock: true, notes: "Coat with FRENBLOC-type thread-lock before fitting." }),
          nm("disc-screws", "Disc retaining screws", 15, [SRC.disc], { qty: 2 }),
        ],
        specs: [
          { group: "Disc", label: "Size", value: null, notes: "Depends on version — check by VIN.", sources: [] },
          { group: "Disc", label: "Minimum thickness", value: null, notes: "Stamped on the disc — use that value.", sources: [] },
          { group: "Disc", label: "Machining", value: "Not allowed", notes: "Renault: discs are not to be skimmed — replace if scored.", sources: [s("secondary", `${MR}: Frein — caractéristiques`, "https://www.manuelmeg.org/frein_caract_eacute_ristiques-295.html", "Les disques de freins ne sont pas rectifiables")] },
        ],
        removal: [
          { text: "Remove the front wheel.", detach: ["wheel-bolts", "wheel"], warning: LIFT_SAFETY },
          { text: "Remove both guide pin bolts and hang the caliper from the coil spring.", detach: ["guide-pins", "caliper"], warning: "Never let the caliper hang on the hose." },
          { text: "Remove both pads.", detach: ["pad-outer", "pad-inner"] },
          { text: "Remove the two carrier bolts and the carrier.", detach: ["carrier"] },
          { text: "Remove the two disc retaining screws and pull the disc off the hub.", detach: ["disc"], tip: "A seized disc: soak with penetrant and tap the hat (not the friction face) with a mallet." },
        ],
        installation: [
          { text: "Clean the hub face to bare metal so the new disc sits flat.", tip: "Rust on the hub causes run-out and pedal judder." },
          { text: "Degrease the new disc, fit it and torque the retaining screws.", attach: ["disc"], torque: "disc-screws" },
          { text: "Apply thread-lock, fit the carrier and torque its bolts.", attach: ["carrier"], torque: "carrier" },
          { text: "Push the piston back and fit new pads, inner first.", attach: ["pad-inner", "pad-outer"] },
          { text: "Refit the caliper and torque the guide pin bolts.", attach: ["caliper", "guide-pins"], torque: "guide-pins" },
          { text: "Refit the wheel and torque on the ground.", attach: ["wheel", "wheel-bolts"], torque: "wheel-bolts" },
          { text: "Pump the pedal until firm, check fluid level.", warning: "Do not drive until the pedal is firm." },
        ],
        checks: ["Pedal firm", "Fluid level OK", "No rubbing noise when spinning the wheel", "Bed in new discs and pads gently"],
        faults: [
          { symptom: "Steering wheel judder when braking", causes: "Disc run-out from rust on the hub face, uneven wheel-bolt torque." },
          { symptom: "Grinding", causes: "Pads fitted backwards, backing plate touching the disc, debris." },
        ],
      },
      {
        id: "spark-plugs",
        name: "Spark plugs & coils",
        system: "Engine",
        position: [1.3, 0.77, -0.05],
        difficulty: 2,
        timeMinutes: 40,
        summary: "Four pencil coils sit directly on the plugs, each held by one screw on the cam cover. Cylinders 1-4 and 2-3 are fired in pairs.",
        safety: ["Work on a cold engine — the head is aluminium and hot threads strip easily.", "Disconnect the battery before unplugging coils."],
        tools: ["Spark plug socket 16 mm, thin-wall (Renault Ele. 1382 kit or equivalent)", "Extension", "Torque wrench (10–40 Nm)", "Torx/socket for coil screws", "Feeler/wire gap gauge", "Compressed air"],
        parts: [
          { name: "Spark plugs", qty: "4", replace: "always", notes: "Renault part number not confirmed for the Mégane II — check by VIN." },
          { name: "Coil O-rings", qty: "4", replace: "if-worn", sources: [SRC.coils] },
        ],
        torques: [
          nm("plugs", "Spark plugs", null, [SRC.plugs], { qty: 4, instruction: "25–30 Nm", notes: "Renault gives a range, not a single value." }),
          nm("coils", "Ignition coil screws", null, [SRC.coils], { qty: 4, conflict: "Coil page (bobines-200) says 1.5 daN·m (15 Nm); the K4J/K4M head-gasket page says 1.3 daN·m (13 Nm)." }),
        ],
        specs: [
          { group: "Plug", label: "Electrode gap", value: null, notes: "Pre-set on new plugs.", sources: [] },
          { group: "Plug", label: "Thread / reach / hex", value: null, sources: [] },
          { group: "Plug", label: "Replacement interval", value: null, notes: "Service booklet.", sources: [] },
        ],
        removal: [
          { text: "Let the engine cool fully, then disconnect the battery.", warning: "Removing plugs from a hot aluminium head risks thread damage." },
          { text: "Remove the engine cover and unplug the four coil connectors.", focus: ["coils"], tip: "Replace any cracked connector — don't reuse it." },
          { text: "Remove each coil screw and pull the coils straight up.", detach: ["coils"] },
          { text: "Blow debris out of the plug wells, then unscrew the plugs.", detach: ["plugs"], tip: "Dirt falling into the cylinder can score the bore." },
        ],
        installation: [
          { text: "Check the gap on each new plug.", focus: ["plugs"] },
          { text: "Start each plug by hand for several turns, then torque.", attach: ["plugs"], torque: "plugs", warning: "If it binds early, stop — it is cross-threaded." },
          { text: "Check the coil O-rings, refit the coils and torque the screws.", attach: ["coils"], torque: "coils" },
          { text: "Reconnect the coil connectors, engine cover and battery." },
          { text: "Carry out any relearn procedures needed after battery disconnection.", tip: "Electric windows may need re-initialising." },
        ],
        checks: ["Smooth idle, no misfire light", "All four connectors clicked home"],
        faults: [
          { symptom: "Misfire on one cylinder", causes: "Connector not seated, damaged coil, wrong gap." },
          { symptom: "Plug turns freely, won't tighten", causes: "Stripped thread — needs a thread repair insert." },
        ],
      },
      {
        id: "oil-filter",
        name: "Engine oil & filter",
        system: "Engine",
        position: [1.4, 0.35, 0.0],
        difficulty: 2,
        timeMinutes: 45,
        interval: "30 000 km / 2 yrs",
        summary: "Drain via the sump plug (8 mm square key), replace the spin-on filter, refill to the dipstick.",
        safety: [LIFT_SAFETY, "Hot oil burns — let it cool a little after warming up.", "Dispose of used oil and filter at a collection point."],
        tools: ["8 mm square drain key", "Oil filter wrench", "Drain pan (≥6 L)", "Funnel", "Torque wrench", "Gloves + rags"],
        parts: [
          { name: "Oil filter", qty: "1", replace: "always", oe: ["8200768913"], equivalents: ["MANN W 75/3", "Purflux LS932", "Bosch 0 451 103 336"], notes: "M20×1.5 spin-on, Ø76 × 52 mm.", sources: [SRC.adFilter] },
          { name: "Engine oil", replace: "always", notes: "Renault grade per service booklet; fill to the dipstick." },
          { name: "Drain plug seal", qty: "1", replace: "if-worn", notes: "Replacement requirement not confirmed in our sources — fitting a new one is cheap insurance." },
        ],
        torques: [
          nm("drain", "Sump drain plug", null, [], { notes: "Not found in sources yet." }),
          nm("filter", "Oil filter", null, [], { notes: "Follow the instruction printed on the filter." }),
        ],
        specs: [
          { group: "Oil", label: "Capacity with filter", value: null, notes: "Always finish at the dipstick.", sources: [] },
          { group: "Oil", label: "Drain tool", value: "8 mm square key", sources: [SRC.drainKey] },
        ],
        removal: [
          { text: "Run the engine for a few minutes, then switch off and raise the car level.", warning: LIFT_SAFETY },
          { text: "Remove the filler cap, then undo the drain plug and let the oil drain fully.", detach: ["drain-plug"], warning: "Oil may be hot." },
          { text: "Place the pan under the filter and unscrew it.", detach: ["oil-filter"] },
        ],
        installation: [
          { text: "Clean the drain plug, fit a new seal and refit the plug.", attach: ["drain-plug"], torque: "drain" },
          { text: "Wipe the filter seat, oil the new filter's rubber seal and screw it on.", attach: ["oil-filter"], torque: "filter" },
          { text: "Lower the car and fill with the specified oil, slightly under capacity first." },
          { text: "Run for a minute, switch off, wait, check the dipstick and top up to MAX.", tip: "The level drops once the new filter fills." },
          { text: "Reset the service indicator if fitted." },
        ],
        checks: ["No leaks at plug or filter", "Level between MIN and MAX", "Oil warning light off"],
        faults: [
          { symptom: "Leak at the filter", causes: "Old seal stuck on the housing (double gasket), seal not oiled, under-tightened." },
          { symptom: "Drain plug drips", causes: "Old seal reused, damaged sump thread." },
        ],
      },
      {
        id: "air-filter",
        name: "Air filter",
        system: "Intake",
        position: [1.64, 0.76, -0.32],
        difficulty: 3,
        timeMinutes: 45,
        summary: "On the F4R/K4M the air filter housing sits under the battery tray, so the battery and tray come out first.",
        safety: ["Disconnect the battery before removing it.", "Keep dirt out of the clean side of the housing."],
        tools: ["10 mm spanner / socket", "Torx set", "Torque wrench (5–25 Nm)", "Vacuum or clean cloth"],
        parts: [{ name: "Air filter element", qty: "1", replace: "always", notes: "Confirm reference by VIN." }],
        torques: [
          nm("tray", "Battery tray screws", 21, [SRC.airboxK4M], { qty: 3 }),
        ],
        specs: [{ group: "Filter", label: "Replacement interval", value: null, notes: "Service booklet.", sources: [] }],
        removal: [
          { text: "Remove the engine covers, then disconnect and remove the battery.", tip: "See the Battery guide for disconnection order." },
          { text: "Remove the air duct, unplug the ECU connectors and remove the battery tray and ECU bracket." },
          { text: "Open the air filter housing.", detach: ["airbox-lid"], tip: "On some versions the housing only comes out from the wheel-arch side with the left front wheel and liner removed." },
          { text: "Lift out the element and clean the housing.", detach: ["filter"] },
        ],
        installation: [
          { text: "Fit the new element with the seal seated all round.", attach: ["filter"] },
          { text: "Close the housing.", attach: ["airbox-lid"] },
          { text: "Refit the ECU, battery tray (torque), ducts and battery.", torque: "tray" },
          { text: "Reconnect the battery and run any relearn procedures." },
        ],
        checks: ["Housing clips all closed", "No air leak at ducts", "ECU connectors locked"],
        faults: [{ symptom: "Engine light / rough idle after job", causes: "Duct not seated (unmetered air), ECU connector loose." }],
      },
      {
        id: "battery",
        name: "Battery",
        system: "Electrical",
        position: [1.52, 0.76, 0.5],
        difficulty: 2,
        timeMinutes: 20,
        summary: "Maintenance-free 12 V battery. Renault advises replacing it with an equivalent unit.",
        safety: [
          "Battery acid — wear eye protection and gloves.",
          "No flames or sparks near the battery: explosive gas.",
          "The cooling fan can start at any time near the engine.",
        ],
        tools: ["10 mm spanner (terminal clamps — check)", "Socket for hold-down", "Terminal brush", "Torque wrench"],
        parts: [
          { name: "12 V battery", qty: "1", replace: "always", notes: "Match the rating on your current battery's label." },
        ],
        torques: [
          nm("neg", "Negative terminal clamp", null, []),
          nm("pos", "Positive terminal clamp", null, []),
          nm("hold", "Hold-down clamp", null, []),
        ],
        specs: [
          { group: "Battery", label: "Type", value: null, sources: [] },
          { group: "Battery", label: "Capacity / CCA", value: null, notes: "Read it from the fitted battery's label.", sources: [] },
          { group: "Battery", label: "Size", value: null, sources: [] },
        ],
        removal: [
          { text: "Switch off ignition and all consumers; have your radio code ready if needed." },
          { text: "Disconnect the negative (−) terminal first.", detach: ["neg-clamp"], warning: "Negative first prevents a short if the spanner touches the body." },
          { text: "Disconnect the positive (+) terminal.", detach: ["pos-clamp"] },
          { text: "Remove the hold-down clamp.", detach: ["hold-down"] },
          { text: "Lift the battery out upright.", detach: ["battery"], warning: "It weighs ~15 kg — lift with your legs." },
        ],
        installation: [
          { text: "Clean the tray and terminals; place the battery.", attach: ["battery"] },
          { text: "Fit and tighten the hold-down so the battery cannot move.", attach: ["hold-down"], torque: "hold" },
          { text: "Connect positive (+) first.", attach: ["pos-clamp"], torque: "pos" },
          { text: "Connect negative (−) last.", attach: ["neg-clamp"], torque: "neg" },
          { text: "Re-initialise electric windows, clock and radio.", tip: "Run each window fully down and up, holding the switch a few seconds at each end." },
        ],
        checks: ["Clamps don't twist by hand", "Battery doesn't move", "Car starts, no warning lights"],
        faults: [
          { symptom: "\"Battery low\" message", causes: "Lots of short trips, cold weather, consumers used with engine off (per handbook)." },
          { symptom: "Windows don't auto-close", causes: "Window relearn not done after disconnection." },
        ],
      },
    ],
  },
];

/* Research files: one JSON array of Components per vehicle area (see SOURCES.md). */
const researched = [...chassis, ...engine, ...body, ...chassis2, ...transmission, ...hvacElectrical, ...engine2] as unknown as Component[];
for (const c of researched) {
  const car = cars[0];
  if (c.id === "vehicle-data") {
    for (const s of c.specs) {
      const i = car.specs.findIndex((x) => x.label.toLowerCase() === s.label.toLowerCase());
      if (i < 0) car.specs.push(s);
      else if (car.specs[i].value === null && s.value !== null) car.specs[i] = s;
    }
    continue;
  }
  if (!car.components.some((x) => x.id === c.id)) car.components.push(c);
}

export const getBrand = (id: string) => brands.find((b) => b.id === id);
export const getCarsByBrand = (brandId: string) => cars.filter((c) => c.brandId === brandId);
export const getCar = (id: string) => cars.find((c) => c.id === id);
