import "dotenv/config";
import { db, units, roles, individuals, postings } from "../lib/db";

async function reset() {
  await db.delete(postings);
  await db.delete(roles);
  await db.delete(individuals);
  await db.delete(units);
}

async function seed() {
  await reset();

  // Units: L1 RAiD, L2 branches
  const [raid] = await db
    .insert(units)
    .values({ name: "RAiD", code: "RAID", level: "L1" })
    .returning();
  const [branchA] = await db
    .insert(units)
    .values({ name: "Branch A", code: "BRA", level: "L2", parentUnitId: raid.id })
    .returning();
  const [branchB] = await db
    .insert(units)
    .values({ name: "Branch B", code: "BRB", level: "L2", parentUnitId: raid.id })
    .returning();
  const [branchC] = await db
    .insert(units)
    .values({ name: "Branch C", code: "BRC", level: "L2", parentUnitId: raid.id })
    .returning();

  // Roles
  const [headRaid] = await db
    .insert(roles)
    .values({ title: "Head RAiD", unitId: raid.id, level: "L1", isHead: true, standardTenureMonths: 36 })
    .returning();
  const [headA] = await db
    .insert(roles)
    .values({ title: "Head Branch A", unitId: branchA.id, level: "L2", isHead: true, standardTenureMonths: 30 })
    .returning();
  const [headB] = await db
    .insert(roles)
    .values({ title: "Head Branch B", unitId: branchB.id, level: "L2", isHead: true, standardTenureMonths: 30, isVacant: true })
    .returning();
  const [headC] = await db
    .insert(roles)
    .values({ title: "Head Branch C", unitId: branchC.id, level: "L2", isHead: true, standardTenureMonths: 30 })
    .returning();

  const [engA1] = await db
    .insert(roles)
    .values({ title: "Senior Engineer", unitId: branchA.id, level: "L3", specialisation: "Software Engineering", standardTenureMonths: 24 })
    .returning();
  const [engA2] = await db
    .insert(roles)
    .values({ title: "Engineer", unitId: branchA.id, level: "L3", specialisation: "Software Engineering", standardTenureMonths: 24 })
    .returning();
  const [anaB1] = await db
    .insert(roles)
    .values({ title: "Data Scientist", unitId: branchB.id, level: "L3", specialisation: "Data", standardTenureMonths: 24 })
    .returning();
  const [anaB2] = await db
    .insert(roles)
    .values({ title: "Analyst", unitId: branchB.id, level: "L3", specialisation: "Data", standardTenureMonths: 24 })
    .returning();
  const [engC1] = await db
    .insert(roles)
    .values({ title: "Cyber Engineer", unitId: branchC.id, level: "L3", specialisation: "Cyber", standardTenureMonths: 24 })
    .returning();
  const [engC2] = await db
    .insert(roles)
    .values({ title: "Cyber Analyst", unitId: branchC.id, level: "L3", specialisation: "Cyber", standardTenureMonths: 24, isVacant: true })
    .returning();

  // Individuals
  const people = await db
    .insert(individuals)
    .values([
      { name: "Col Tan Wei Ming", rank: "COL", specialisation: "Software Engineering", employeeId: "E1001" },
      { name: "LTC Siti Aminah", rank: "LTC", specialisation: "Software Engineering", employeeId: "E1002" },
      { name: "LTC Raj Kumar", rank: "LTC", specialisation: "Data", employeeId: "E1003" },
      { name: "MAJ Jane Lim", rank: "MAJ", specialisation: "Software Engineering", employeeId: "E1004" },
      { name: "MAJ Alex Chua", rank: "MAJ", specialisation: "Data", employeeId: "E1005" },
      { name: "CPT Daniel Ong", rank: "CPT", specialisation: "Cyber", employeeId: "E1006" },
      { name: "CPT Priya Nair", rank: "CPT", specialisation: "Cyber", employeeId: "E1007" },
      { name: "CPT Marcus Teo", rank: "CPT", specialisation: "Software Engineering", employeeId: "E1008" },
    ])
    .returning();

  const [tan, siti, raj, jane, alex, daniel, priya, marcus] = people;

  // Postings — timeline centred roughly on today (seed assumes "now" ≈ 2026)
  await db.insert(postings).values([
    // Col Tan — currently Head RAiD, was Head Branch A before
    { individualId: tan.id, roleId: headA.id, status: "Past", startDate: "2021-01-01", endDate: "2023-12-31", notes: "Previous posting as Head Branch A." },
    { individualId: tan.id, roleId: headRaid.id, status: "Current", startDate: "2024-01-01", endDate: "2026-12-31" },

    // LTC Siti — currently Head Branch A, candidate for Head RAiD next cycle
    { individualId: siti.id, roleId: engA1.id, status: "Past", startDate: "2019-06-01", endDate: "2021-12-31" },
    { individualId: siti.id, roleId: headA.id, status: "Current", startDate: "2024-01-01", endDate: "2026-06-30" },
    { individualId: siti.id, roleId: headRaid.id, status: "Candidate", notes: "Strong succession candidate; pending COL promotion." },

    // LTC Raj — was Head Branch B, currently on extension, planned to move out; Head Branch B is now marked vacant
    { individualId: raj.id, roleId: anaB1.id, status: "Past", startDate: "2018-01-01", endDate: "2020-12-31" },
    { individualId: raj.id, roleId: headB.id, status: "Past", startDate: "2023-01-01", endDate: "2025-12-31", notes: "Posted out to external staff appointment." },

    // MAJ Jane — currently Senior Engineer Branch A, planned to move to Head Branch B (filling the vacancy)
    { individualId: jane.id, roleId: engA2.id, status: "Past", startDate: "2022-01-01", endDate: "2023-12-31" },
    { individualId: jane.id, roleId: engA1.id, status: "Current", startDate: "2024-01-01", endDate: "2026-06-30" },
    { individualId: jane.id, roleId: headB.id, status: "Planned", startDate: "2026-07-01", endDate: "2028-12-31", notes: "Approved succession. LTC promotion on hold until takeover." },

    // MAJ Alex — currently Data Scientist Branch B, candidate for Head Branch C later
    { individualId: alex.id, roleId: anaB2.id, status: "Past", startDate: "2021-06-01", endDate: "2023-12-31" },
    { individualId: alex.id, roleId: anaB1.id, status: "Current", startDate: "2024-01-01", endDate: "2026-12-31" },
    { individualId: alex.id, roleId: headC.id, status: "Candidate", startDate: "2027-01-01", notes: "Option if current Head Branch C posts out next cycle." },

    // CPT Daniel — currently Cyber Engineer Branch C, candidate for the vacant Cyber Analyst slot
    { individualId: daniel.id, roleId: engC1.id, status: "Current", startDate: "2024-01-01", endDate: "2026-12-31" },

    // CPT Priya — just posted in as Cyber Engineer Branch C
    { individualId: priya.id, roleId: engC1.id, status: "Past", startDate: "2022-01-01", endDate: "2023-12-31", notes: "First tour." },
    { individualId: priya.id, roleId: engC2.id, status: "Candidate", startDate: "2026-07-01", notes: "Natural rotation." },

    // CPT Marcus — currently Engineer Branch A, multiple candidate slots under consideration
    { individualId: marcus.id, roleId: engA2.id, status: "Current", startDate: "2024-06-01", endDate: "2026-12-31" },
    { individualId: marcus.id, roleId: engA1.id, status: "Candidate", notes: "Lateral upgrade within Branch A." },
    { individualId: marcus.id, roleId: anaB2.id, status: "Candidate", notes: "Cross-branch move being considered." },
  ]);

  console.log("Seed complete.");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => process.exit(0));
