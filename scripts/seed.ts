import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { entries, entryPlayers, nflTeams, players } from "@/db/schema";

const playoffTeamAbbr = new Set([
  "BUF",
  "DEN",
  "NE",
  "LAC",
  "JAX",
  "SEA",
  "PHI",
  "CHI",
  "SF",
  "LAR",
  "GB",
  "HOU",
  "CAR",
  "PIT",
]);

const teamSeed = [
  { name: "Buffalo Bills", abbreviation: "BUF", conference: "AFC" },
  { name: "Houston Texans", abbreviation: "HOU", conference: "AFC" },
  { name: "Seattle Seahawks", abbreviation: "SEA", conference: "NFC" },
  { name: "Los Angeles Chargers", abbreviation: "LAC", conference: "AFC" },
  { name: "Jacksonville Jaguars", abbreviation: "JAX", conference: "AFC" },
  { name: "San Francisco 49ers", abbreviation: "SF", conference: "NFC" },
  { name: "Philadelphia Eagles", abbreviation: "PHI", conference: "NFC" },
  { name: "Los Angeles Rams", abbreviation: "LAR", conference: "NFC" },
  { name: "Green Bay Packers", abbreviation: "GB", conference: "NFC" },
  { name: "Carolina Panthers", abbreviation: "CAR", conference: "NFC" },
  { name: "New York Jets", abbreviation: "NYJ", conference: "AFC" },
  { name: "New England Patriots", abbreviation: "NE", conference: "AFC" },
  { name: "Dallas Cowboys", abbreviation: "DAL", conference: "NFC" },
  { name: "Las Vegas Raiders", abbreviation: "LV", conference: "AFC" },
  { name: "Denver Broncos", abbreviation: "DEN", conference: "AFC" },
  { name: "Detroit Lions", abbreviation: "DET", conference: "NFC" },
  { name: "Cincinnati Bengals", abbreviation: "CIN", conference: "AFC" },
  { name: "Arizona Cardinals", abbreviation: "ARI", conference: "NFC" },
  { name: "New Orleans Saints", abbreviation: "NO", conference: "NFC" },
  { name: "Chicago Bears", abbreviation: "CHI", conference: "NFC" },
  { name: "Pittsburgh Steelers", abbreviation: "PIT", conference: "AFC" },
  { name: "Tampa Bay Buccaneers", abbreviation: "TB", conference: "NFC" },
  { name: "Minnesota Vikings", abbreviation: "MIN", conference: "NFC" },
  { name: "Cleveland Browns", abbreviation: "CLE", conference: "AFC" },
  { name: "Draft Prospect", abbreviation: "DRAFT", conference: "AFC" },
  { name: "Free Agent", abbreviation: "FA", conference: "AFC" },
].map((team) => ({
  ...team,
  madePlayoffs: playoffTeamAbbr.has(team.abbreviation),
}));

const playerSeed = [
  { name: "Josh Allen", position: "QB", team: "BUF" },
  { name: "Bo Nix", position: "QB", team: "HOU" },
  { name: "Drake Maye", position: "QB", team: "SEA" },
  { name: "Justin Herbert", position: "QB", team: "LAC" },
  { name: "Trevor Lawrence", position: "QB", team: "JAX" },
  { name: "Sam Darnold", position: "QB", team: "SF" },
  { name: "Jalen Hurts", position: "QB", team: "PHI" },
  { name: "Caleb Williams", position: "QB", team: "DRAFT" },
  { name: "Brock Purdy", position: "QB", team: "SF" },
  { name: "Matthew Stafford", position: "QB", team: "LAR" },
  { name: "Jordan Love", position: "QB", team: "GB" },
  { name: "C.J. Stroud", position: "QB", team: "HOU" },
  { name: "Bryce Young", position: "QB", team: "CAR" },
  { name: "Aaron Rodgers", position: "QB", team: "NYJ" },
  { name: "James Cook", position: "RB", team: "BUF" },
  { name: "RJ Harvey", position: "RB", team: "DRAFT" },
  { name: "Trey Henderson", position: "RB", team: "DRAFT" },
  { name: "Rhamondre Stevenson", position: "RB", team: "NE" },
  { name: "Omarion Hampton", position: "RB", team: "DRAFT" },
  { name: "Kimani Vidal", position: "RB", team: "DRAFT" },
  { name: "Travis Etienne", position: "RB", team: "JAX" },
  { name: "Bhayshul Tuten", position: "RB", team: "DRAFT" },
  { name: "Kenneth Walker III", position: "RB", team: "SEA" },
  { name: "Zach Charbonnet", position: "RB", team: "SEA" },
  { name: "Saquon Barkley", position: "RB", team: "PHI" },
  { name: "D'Andre Swift", position: "RB", team: "PHI" },
  { name: "Kyle Monangai", position: "RB", team: "DRAFT" },
  { name: "Christian McCaffrey", position: "RB", team: "SF" },
  { name: "Blake Corum", position: "RB", team: "DRAFT" },
  { name: "Kyren Williams", position: "RB", team: "LAR" },
  { name: "Josh Jacobs", position: "RB", team: "LV" },
  { name: "Will Marks", position: "RB", team: "DRAFT" },
  { name: "Rico Dowdle", position: "RB", team: "DAL" },
  { name: "Chuba Hubbard", position: "RB", team: "CAR" },
  { name: "Jaylen Warren", position: "RB", team: "PIT" },
  { name: "Kenneth Gainwell", position: "RB", team: "PHI" },
  { name: "Josh Palmer", position: "WR", team: "LAC" },
  { name: "Keon Coleman", position: "WR", team: "DET" },
  { name: "Khalil Shakir", position: "WR", team: "BUF" },
  { name: "Courtland Sutton", position: "WR", team: "DEN" },
  { name: "Troy Franklin", position: "WR", team: "DRAFT" },
  { name: "Marvin Mims", position: "WR", team: "DEN" },
  { name: "Stefon Diggs", position: "WR", team: "BUF" },
  { name: "Kayshon Boutte", position: "WR", team: "DRAFT" },
  { name: "Mack Hollins", position: "WR", team: "HOU" },
  { name: "Ladd McConkey", position: "WR", team: "CIN" },
  { name: "Quentin Johnston", position: "WR", team: "LAC" },
  { name: "Keenan Allen", position: "WR", team: "LAC" },
  { name: "Brian Thomas Jr", position: "WR", team: "DRAFT" },
  { name: "Jakobi Meyers", position: "WR", team: "LV" },
  { name: "Parker Washington", position: "WR", team: "ARI" },
  { name: "Jaxon Smith-Njigba", position: "WR", team: "SEA" },
  { name: "Cooper Kupp", position: "WR", team: "LAR" },
  { name: "Rashid Shaheed", position: "WR", team: "NO" },
  { name: "A.J. Brown", position: "WR", team: "PHI" },
  { name: "DeVonta Smith", position: "WR", team: "PHI" },
  { name: "Rome Odunze", position: "WR", team: "CHI" },
  { name: "DJ Moore", position: "WR", team: "CHI" },
  { name: "L. Burnden III", position: "WR", team: "DRAFT" },
  { name: "Jauan Jennings", position: "WR", team: "SF" },
  { name: "Ricky Pearsall", position: "WR", team: "SF" },
  { name: "Kendrick Bourne", position: "WR", team: "DET" },
  { name: "Davante Adams", position: "WR", team: "LV" },
  { name: "Puka Nacua", position: "WR", team: "LAR" },
  { name: "Christian Watson", position: "WR", team: "GB" },
  { name: "Romeo Doubs", position: "WR", team: "GB" },
  { name: "Jayden Reed", position: "WR", team: "GB" },
  { name: "Nico Collins", position: "WR", team: "HOU" },
  { name: "Tee Higgins", position: "WR", team: "CIN" },
  { name: "J. Noel", position: "WR", team: "DRAFT" },
  { name: "Tetairoa McMillan", position: "WR", team: "DRAFT" },
  { name: "J. Coker", position: "WR", team: "DRAFT" },
  { name: "Xavier Legette", position: "WR", team: "DRAFT" },
  { name: "DK Metcalf", position: "WR", team: "SEA" },
  { name: "Calvin Austin III", position: "WR", team: "PIT" },
  { name: "Adam Thielen", position: "WR", team: "CAR" },
  { name: "Dalton Kincaid", position: "TE", team: "BUF" },
  { name: "Dawson Knox", position: "TE", team: "BUF" },
  { name: "Evan Engram", position: "TE", team: "JAX" },
  { name: "Hunter Henry", position: "TE", team: "NE" },
  { name: "Oronde Gadsden II", position: "TE", team: "DRAFT" },
  { name: "Brenton Strange", position: "TE", team: "NYJ" },
  { name: "AJ Barner", position: "TE", team: "DRAFT" },
  { name: "Dallas Goedert", position: "TE", team: "PHI" },
  { name: "Colston Loveland", position: "TE", team: "DRAFT" },
  { name: "Cole Kmet", position: "TE", team: "CHI" },
  { name: "George Kittle", position: "TE", team: "SF" },
  { name: "Colby Parkinson", position: "TE", team: "SEA" },
  { name: "Luke Musgrave", position: "TE", team: "GB" },
  { name: "Dalton Schultz", position: "TE", team: "LV" },
  { name: "Tommy Tremble", position: "TE", team: "CAR" },
  { name: "Pat Freiermuth", position: "TE", team: "PIT" },
  { name: "J. Smith", position: "TE", team: "DRAFT" },
  { name: "Tyler Bass", position: "K", team: "BUF" },
  { name: "Wil Lutz", position: "K", team: "NO" },
  { name: "Andres Borregales", position: "K", team: "CLE" },
  { name: "Cameron Dicker", position: "K", team: "LAC" },
  { name: "Chase Little", position: "K", team: "DRAFT" },
  { name: "Jake Meyers", position: "K", team: "DRAFT" },
  { name: "Jake Elliott", position: "K", team: "PHI" },
  { name: "Cairo Santos", position: "K", team: "TB" },
  { name: "Eddy Pineiro", position: "K", team: "MIN" },
  { name: "Harrison Mevis", position: "K", team: "JAX" },
  { name: "Brandon McManus", position: "K", team: "FA" },
  { name: "Ka'imi Fairbairn", position: "K", team: "FA" },
  { name: "Ross Fitzgerald", position: "K", team: "DRAFT" },
  { name: "Chris Boswell", position: "K", team: "PIT" },
  { name: "Bills", position: "DST", team: "BUF" },
  { name: "Broncos", position: "DST", team: "DEN" },
  { name: "Patriots", position: "DST", team: "NE" },
  { name: "Chargers", position: "DST", team: "LAC" },
  { name: "Jaguars", position: "DST", team: "JAX" },
  { name: "Seahawks", position: "DST", team: "SEA" },
  { name: "Eagles", position: "DST", team: "PHI" },
  { name: "Bears", position: "DST", team: "CHI" },
  { name: "49ers", position: "DST", team: "SF" },
  { name: "Rams", position: "DST", team: "LAR" },
  { name: "Packers", position: "DST", team: "GB" },
  { name: "Texans", position: "DST", team: "HOU" },
  { name: "Panthers", position: "DST", team: "CAR" },
  { name: "Steelers", position: "DST", team: "PIT" },
] as const;

const demoRoster = [
  { slot: "QB1", name: "Josh Allen", team: "BUF" },
  { slot: "QB2", name: "C.J. Stroud", team: "HOU" },
  { slot: "QB3", name: "Jalen Hurts", team: "PHI" },
  { slot: "QB4", name: "Jordan Love", team: "GB" },
  { slot: "RB1", name: "Kenneth Walker III", team: "SEA" },
  { slot: "RB2", name: "Christian McCaffrey", team: "SF" },
  { slot: "RB3", name: "Kyren Williams", team: "LAR" },
  { slot: "WR1", name: "Courtland Sutton", team: "DEN" },
  { slot: "WR2", name: "DJ Moore", team: "CHI" },
  { slot: "WR3", name: "Adam Thielen", team: "CAR" },
  { slot: "FLEX", name: "Travis Etienne", team: "JAX" },
  { slot: "TE", name: "Hunter Henry", team: "NE" },
  { slot: "K", name: "Cameron Dicker", team: "LAC" },
  { slot: "DST", name: "Steelers", team: "PIT" },
] as const;

async function seed() {
  const existingTeams = await db.query.nflTeams.findMany();
  const existingByAbbr = new Map(existingTeams.map((team) => [team.abbreviation, team]));

  for (const team of teamSeed) {
    const existing = existingByAbbr.get(team.abbreviation);
    if (existing) {
      await db
        .update(nflTeams)
        .set({
          name: team.name,
          conference: team.conference,
          madePlayoffs: team.madePlayoffs,
        })
        .where(eq(nflTeams.id, existing.id));
    } else {
      await db.insert(nflTeams).values(team);
    }
  }

  const teams = await db.query.nflTeams.findMany();
  const teamMap = new Map(teams.map((team) => [team.abbreviation, team]));

  const unknownTeams = new Set<string>();
  for (const player of playerSeed) {
    if (!teamMap.has(player.team)) {
      unknownTeams.add(player.team);
    }
  }

  if (unknownTeams.size > 0) {
    throw new Error(`Unknown team abbreviations: ${Array.from(unknownTeams).join(", ")}`);
  }

  const existingPlayers = await db.query.players.findMany();
  const existingByKey = new Map(
    existingPlayers.map((player) => [`${player.name}|${player.nflTeamId}`, player])
  );

  const desiredPlayers = playerSeed.map((player) => ({
    name: player.name,
    position: player.position,
    nflTeamId: teamMap.get(player.team)!.id,
    isActive: true,
  }));

  const allowedKeys = new Set(
    desiredPlayers.map((player) => `${player.name}|${player.nflTeamId}`)
  );

  for (const desired of desiredPlayers) {
    const key = `${desired.name}|${desired.nflTeamId}`;
    const existing = existingByKey.get(key);
    if (existing) {
      await db
        .update(players)
        .set({ position: desired.position, isActive: true })
        .where(eq(players.id, existing.id));
    } else {
      await db.insert(players).values(desired);
    }
  }

  for (const player of existingPlayers) {
    const key = `${player.name}|${player.nflTeamId}`;
    if (!allowedKeys.has(key) && player.isActive) {
      await db.update(players).set({ isActive: false }).where(eq(players.id, player.id));
    }
  }

  const entryEmail = "demo@playoffchallenge.com";
  const existingEntry = await db.query.entries.findFirst({ where: eq(entries.email, entryEmail) });

  if (!existingEntry) {
    const [entry] = await db
      .insert(entries)
      .values({
        teamName: "Demo Dynasty",
        participantName: "Sample Manager",
        email: entryEmail,
        paid: true,
      })
      .returning();

    const rosterPlayers = await db.query.players.findMany();
    const rosterMap = new Map(
      rosterPlayers.map((player) => [`${player.name}|${player.nflTeamId}`, player])
    );

    const rosterRows = demoRoster.map((slot) => {
      const teamId = teamMap.get(slot.team)!.id;
      const key = `${slot.name}|${teamId}`;
      const player = rosterMap.get(key);
      if (!player) {
        throw new Error(`Missing demo roster player: ${slot.name} (${slot.team})`);
      }
      return {
        entryId: entry.id,
        playerId: player.id,
        slot: slot.slot,
      };
    });

    await db.insert(entryPlayers).values(rosterRows);
  }

  console.log("Seed complete.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
