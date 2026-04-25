// DATABASE_URL is loaded by `tsx --env-file-if-exists=.env.local --env-file=.env`
// in the npm script — see package.json.
import { db, units, roles, individuals, postings } from "../lib/db";

async function reset() {
  await db.delete(postings);
  await db.delete(roles);
  await db.delete(individuals);
  await db.delete(units);
}

/**
 * RAiD's 9 branches as of seed time. Each has a single head role with the
 * verbatim title HR uses (e.g. "Hd CyDef"). Branch unit names use the
 * short forms; HR can rename via the org-page CRUD UI later.
 */
const BRANCHES = [
  { unitName: "P4B", headTitle: "Hd P4B / Dy Hd RAiD" },
  { unitName: "Corporate Svcs", headTitle: "Hd Corporate Svcs Br" },
  { unitName: "SWiFT", headTitle: "Hd SWiFT" },
  { unitName: "CyDef", headTitle: "Hd CyDef" },
  { unitName: "RSAF Data Office", headTitle: "Hd RSAF Data Office" },
  { unitName: "Mission Data", headTitle: "Hd Mission Data" },
  { unitName: "A3", headTitle: "Hd A3" },
  { unitName: "Cloud", headTitle: "Hd Cloud" },
  { unitName: "IKC2", headTitle: "Hd IKC2" },
] as const;

async function seed() {
  await reset();

  // L1: RAiD HQ + Hd RAiD role
  const [raid] = await db
    .insert(units)
    .values({ name: "RAiD", code: "RAID", level: "L1" })
    .returning();

  const [hdRaid] = await db
    .insert(roles)
    .values({
      title: "Hd RAiD",
      unitId: raid.id,
      level: "L1",
      isHead: true,
      standardTenureMonths: 36,
    })
    .returning();

  // L2: 9 branches, each with its head role
  const branchUnits: { id: number; unitName: string; headRoleId: number }[] = [];
  for (const b of BRANCHES) {
    const [unit] = await db
      .insert(units)
      .values({
        name: b.unitName,
        level: "L2",
        parentUnitId: raid.id,
      })
      .returning();
    const [head] = await db
      .insert(roles)
      .values({
        title: b.headTitle,
        unitId: unit.id,
        level: "L2",
        isHead: true,
        standardTenureMonths: 30,
      })
      .returning();
    branchUnits.push({
      id: unit.id,
      unitName: b.unitName,
      headRoleId: head.id,
    });
  }

  // A few illustrative L3 roles seeded so the org chart isn't empty under
  // each branch. HR adds the rest via the + Add role buttons.
  const cyDef = branchUnits.find((b) => b.unitName === "CyDef")!;
  const cloud = branchUnits.find((b) => b.unitName === "Cloud")!;
  const swift = branchUnits.find((b) => b.unitName === "SWiFT")!;
  const mission = branchUnits.find((b) => b.unitName === "Mission Data")!;

  const [cyEng] = await db
    .insert(roles)
    .values({
      title: "Cyber Engineer",
      unitId: cyDef.id,
      level: "L3",
      specialisation: "Cyber",
      standardTenureMonths: 24,
    })
    .returning();
  const [cyAna] = await db
    .insert(roles)
    .values({
      title: "Cyber Analyst",
      unitId: cyDef.id,
      level: "L3",
      specialisation: "Cyber",
      standardTenureMonths: 24,
      isVacant: true,
    })
    .returning();
  const [cloudEng] = await db
    .insert(roles)
    .values({
      title: "Cloud Engineer",
      unitId: cloud.id,
      level: "L3",
      specialisation: "Cloud",
      standardTenureMonths: 24,
    })
    .returning();
  const [swEng] = await db
    .insert(roles)
    .values({
      title: "Software Engineer",
      unitId: swift.id,
      level: "L3",
      specialisation: "Software Engineering",
      standardTenureMonths: 24,
    })
    .returning();
  const [missionAna] = await db
    .insert(roles)
    .values({
      title: "Data Analyst",
      unitId: mission.id,
      level: "L3",
      specialisation: "Data",
      standardTenureMonths: 24,
    })
    .returning();

  // Individuals
  const people = await db
    .insert(individuals)
    .values([
      { name: "Col Tan Wei Ming", rank: "COL", specialisation: "Software Engineering", employeeId: "E1001" },
      { name: "LTC Siti Aminah", rank: "LTC", specialisation: "Software Engineering", employeeId: "E1002" },
      { name: "LTC Raj Kumar", rank: "LTC", specialisation: "Cyber", employeeId: "E1003" },
      { name: "LTC Wong Hui", rank: "LTC", specialisation: "Cloud", employeeId: "E1004" },
      { name: "MAJ Jane Lim", rank: "MAJ", specialisation: "Software Engineering", employeeId: "E1005" },
      { name: "MAJ Alex Chua", rank: "MAJ", specialisation: "Data", employeeId: "E1006" },
      { name: "CPT Daniel Ong", rank: "CPT", specialisation: "Cyber", employeeId: "E1007" },
      { name: "CPT Priya Nair", rank: "CPT", specialisation: "Cyber", employeeId: "E1008" },
      { name: "CPT Marcus Teo", rank: "CPT", specialisation: "Software Engineering", employeeId: "E1009" },
    ])
    .returning();

  const [tan, siti, raj, wong, jane, alex, daniel, priya, marcus] = people;

  // Heads of branches by unit name
  const headOf = (unitName: string) =>
    branchUnits.find((b) => b.unitName === unitName)!.headRoleId;

  await db.insert(postings).values([
    // Hd RAiD
    { individualId: tan.id, roleId: hdRaid.id, status: "Current", startDate: "2024-01-01", endDate: "2026-12-31" },
    // Hd P4B / Dy Hd RAiD — example of the dual-hatted role
    { individualId: siti.id, roleId: headOf("P4B"), status: "Current", startDate: "2024-01-01", endDate: "2026-06-30" },
    { individualId: siti.id, roleId: hdRaid.id, status: "Candidate", startDate: "2026-07-01", endDate: "2029-06-30", notes: "Strong succession candidate; pending COL promotion. Q3 2026 take-over." },
    // CyDef
    { individualId: raj.id, roleId: headOf("CyDef"), status: "Current", startDate: "2023-06-01", endDate: "2026-05-31" },
    { individualId: daniel.id, roleId: cyEng.id, status: "Current", startDate: "2024-01-01", endDate: "2026-12-31" },
    { individualId: priya.id, roleId: cyAna.id, status: "Candidate", startDate: "2026-07-01", endDate: "2028-06-30", notes: "Natural rotation. Q3 2026 take-over." },
    { individualId: priya.id, roleId: cyEng.id, status: "Past", startDate: "2022-01-01", endDate: "2023-12-31", notes: "First tour." },
    // Cloud
    { individualId: wong.id, roleId: headOf("Cloud"), status: "Current", startDate: "2024-01-01", endDate: "2026-12-31" },
    { individualId: marcus.id, roleId: cloudEng.id, status: "Candidate", startDate: "2027-01-01", endDate: "2028-12-31", notes: "Cross-branch move from SWiFT being considered." },
    // SWiFT
    { individualId: jane.id, roleId: swEng.id, status: "Current", startDate: "2024-01-01", endDate: "2026-06-30" },
    { individualId: jane.id, roleId: headOf("SWiFT"), status: "Planned", startDate: "2026-07-01", endDate: "2028-12-31", notes: "Approved succession." },
    { individualId: marcus.id, roleId: swEng.id, status: "Past", startDate: "2022-01-01", endDate: "2023-12-31" },
    // Mission Data
    { individualId: alex.id, roleId: missionAna.id, status: "Current", startDate: "2024-06-01", endDate: "2026-12-31" },
    { individualId: alex.id, roleId: headOf("Mission Data"), status: "Candidate", startDate: "2027-01-01", endDate: "2029-12-31", notes: "Earmarked for next cycle." },
  ]);

  console.log(`Seed complete: ${BRANCHES.length} branches + Hd RAiD + ${people.length} people.`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => process.exit(0));
