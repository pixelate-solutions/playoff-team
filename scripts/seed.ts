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

type Conference = "AFC" | "NFC";
type TeamSeedInput = {
  name: string;
  abbreviation: string;
  conference: Conference;
};

const teamSeedBase: TeamSeedInput[] = [
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
];

const teamSeed = teamSeedBase.map((team) => ({
  ...team,
  madePlayoffs: playoffTeamAbbr.has(team.abbreviation),
}));

const playerSeed = [
  { name: "Josh Palmer", position: "WR", team: "BUF" },
  { name: "Keon Coleman", position: "WR", team: "BUF" },
  { name: "Khalil Shakir", position: "WR", team: "BUF" },
  { name: "Dalton Kincaid", position: "TE", team: "BUF" },
  { name: "Dawson Knox", position: "TE", team: "BUF" },
  { name: "James Cook", position: "RB", team: "BUF" },
  { name: "Josh Allen", position: "QB", team: "BUF" },
  { name: "Matt Prater", position: "K", team: "BUF" },
  { name: "Bills", position: "DST", team: "BUF" },
  { name: "Courtland Sutton", position: "WR", team: "DEN" },
  { name: "Troy Franklin", position: "WR", team: "DEN" },
  { name: "Marvin Mims Jr.", position: "WR", team: "DEN" },
  { name: "Evan Engram", position: "TE", team: "DEN" },
  { name: "RJ Harvey", position: "RB", team: "DEN" },
  { name: "Bo Nix", position: "QB", team: "DEN" },
  { name: "Wil Lutz", position: "K", team: "DEN" },
  { name: "Broncos", position: "DST", team: "DEN" },
  { name: "Stefon Diggs", position: "WR", team: "NE" },
  { name: "Kayshon Boutte", position: "WR", team: "NE" },
  { name: "DeMario Douglas", position: "WR", team: "NE" },
  { name: "Hunter Henry", position: "TE", team: "NE" },
  { name: "TreVeyon Henderson", position: "RB", team: "NE" },
  { name: "Rhamondre Stevenson", position: "RB", team: "NE" },
  { name: "Drake Maye", position: "QB", team: "NE" },
  { name: "Andy Borregales", position: "K", team: "NE" },
  { name: "Patriots", position: "DST", team: "NE" },
  { name: "Ladd McConkey", position: "WR", team: "LAC" },
  { name: "Quentin Johnston", position: "WR", team: "LAC" },
  { name: "Keenan Allen", position: "WR", team: "LAC" },
  { name: "Oronde Gadsen II", position: "TE", team: "LAC" },
  { name: "Omarion Hampton", position: "RB", team: "LAC" },
  { name: "Kimani Vidal", position: "RB", team: "LAC" },
  { name: "Justin Herbert", position: "QB", team: "LAC" },
  { name: "Cameron Dicker", position: "K", team: "LAC" },
  { name: "Chargers", position: "DST", team: "LAC" },
  { name: "Brian Thomas Jr.", position: "WR", team: "JAX" },
  { name: "Jakobi Meyers", position: "WR", team: "JAX" },
  { name: "Parker Washington", position: "WR", team: "JAX" },
  { name: "Brenton Strange", position: "TE", team: "JAX" },
  { name: "Travis Etienne Jr.", position: "RB", team: "JAX" },
  { name: "Bhayshul Tuten", position: "RB", team: "JAX" },
  { name: "Trevor Lawrence", position: "QB", team: "JAX" },
  { name: "Cam Little", position: "K", team: "JAX" },
  { name: "Jaguars", position: "DST", team: "JAX" },
  { name: "Jaxon Smith-Njigba", position: "WR", team: "SEA" },
  { name: "Cooper Kupp", position: "WR", team: "SEA" },
  { name: "Rashid Shaheed", position: "WR", team: "SEA" },
  { name: "AJ Barner", position: "TE", team: "SEA" },
  { name: "Kenneth Walker III", position: "RB", team: "SEA" },
  { name: "Zach Charbonnet", position: "RB", team: "SEA" },
  { name: "Sam Darnold", position: "QB", team: "SEA" },
  { name: "Jason Myers", position: "K", team: "SEA" },
  { name: "Seahawks", position: "DST", team: "SEA" },
  { name: "AJ Brown", position: "WR", team: "PHI" },
  { name: "DeVonta Smith", position: "WR", team: "PHI" },
  { name: "Dallas Goedert", position: "TE", team: "PHI" },
  { name: "Saquon Barkley", position: "RB", team: "PHI" },
  { name: "Jalen Hurts", position: "QB", team: "PHI" },
  { name: "Jake Elliot", position: "K", team: "PHI" },
  { name: "Eagles", position: "DST", team: "PHI" },
  { name: "Rome Odunze", position: "WR", team: "CHI" },
  { name: "DJ Moore", position: "WR", team: "CHI" },
  { name: "Luther Burden III", position: "WR", team: "CHI" },
  { name: "Colston Loveland", position: "TE", team: "CHI" },
  { name: "Cole Kmet", position: "TE", team: "CHI" },
  { name: "D'Andre Swift", position: "RB", team: "CHI" },
  { name: "Kyle Monangai", position: "RB", team: "CHI" },
  { name: "Caleb Williams", position: "QB", team: "CHI" },
  { name: "Cairo Santos", position: "K", team: "CHI" },
  { name: "Bears", position: "DST", team: "CHI" },
  { name: "Jauan Jennings", position: "WR", team: "SF" },
  { name: "Ricky Pearsall", position: "WR", team: "SF" },
  { name: "Kendrick Bourne", position: "WR", team: "SF" },
  { name: "George Kittle", position: "TE", team: "SF" },
  { name: "Christian McCaffery", position: "RB", team: "SF" },
  { name: "Brock Purdy", position: "QB", team: "SF" },
  { name: "Eddy Pineiro", position: "K", team: "SF" },
  { name: "49ers", position: "DST", team: "SF" },
  { name: "Davante Adams", position: "WR", team: "LAR" },
  { name: "Puka Nacua", position: "WR", team: "LAR" },
  { name: "Colby Parkinson", position: "TE", team: "LAR" },
  { name: "Tyler Higbee", position: "TE", team: "LAR" },
  { name: "Blake Corum", position: "RB", team: "LAR" },
  { name: "Kyren Williams", position: "RB", team: "LAR" },
  { name: "Matthew Stafford", position: "QB", team: "LAR" },
  { name: "Harrison Mevis", position: "K", team: "LAR" },
  { name: "Rams", position: "DST", team: "LAR" },
  { name: "Christian Watson", position: "WR", team: "GB" },
  { name: "Romeo Doubs", position: "WR", team: "GB" },
  { name: "Jayden Reed", position: "WR", team: "GB" },
  { name: "Luke Musgrave", position: "TE", team: "GB" },
  { name: "Josh Jacobs", position: "RB", team: "GB" },
  { name: "Jordan Love", position: "QB", team: "GB" },
  { name: "Brandon McManus", position: "K", team: "GB" },
  { name: "Packers", position: "DST", team: "GB" },
  { name: "Nico Collins", position: "WR", team: "HOU" },
  { name: "Jayden Higgins", position: "WR", team: "HOU" },
  { name: "Jaylin Noel", position: "WR", team: "HOU" },
  { name: "Dalton Shultz", position: "TE", team: "HOU" },
  { name: "Woody Marks", position: "RB", team: "HOU" },
  { name: "CJ Stroud", position: "QB", team: "HOU" },
  { name: "Ka'imi Fairbairn", position: "K", team: "HOU" },
  { name: "Texans", position: "DST", team: "HOU" },
  { name: "Tetairoa McMillan", position: "WR", team: "CAR" },
  { name: "Jalen Coker", position: "WR", team: "CAR" },
  { name: "Xavier Legette", position: "WR", team: "CAR" },
  { name: "Tommy Tremble", position: "TE", team: "CAR" },
  { name: "Rico Dowdle", position: "RB", team: "CAR" },
  { name: "Chuba Hubbard", position: "RB", team: "CAR" },
  { name: "Bryce Young", position: "QB", team: "CAR" },
  { name: "Ryan Fitzgerald", position: "K", team: "CAR" },
  { name: "Panthers", position: "DST", team: "CAR" },
  { name: "DK Metcalf", position: "WR", team: "PIT" },
  { name: "Calvin Austin III", position: "WR", team: "PIT" },
  { name: "Adam Thielen", position: "WR", team: "PIT" },
  { name: "Pat Freiermuth", position: "TE", team: "PIT" },
  { name: "Jonnu Smith", position: "TE", team: "PIT" },
  { name: "Jaylen Warren", position: "RB", team: "PIT" },
  { name: "Kenneth Gainwell", position: "RB", team: "PIT" },
  { name: "Aaron Rodgers", position: "QB", team: "PIT" },
  { name: "Chris Boswell", position: "K", team: "PIT" },
  { name: "Steelers", position: "DST", team: "PIT" },
] as const;

const demoRoster = [
  { slot: "QB1", name: "Josh Allen", team: "BUF" },
  { slot: "QB2", name: "CJ Stroud", team: "HOU" },
  { slot: "QB3", name: "Jalen Hurts", team: "PHI" },
  { slot: "QB4", name: "Jordan Love", team: "GB" },
  { slot: "RB1", name: "Kenneth Walker III", team: "SEA" },
  { slot: "RB2", name: "Christian McCaffery", team: "SF" },
  { slot: "RB3", name: "Kyren Williams", team: "LAR" },
  { slot: "WR1", name: "Courtland Sutton", team: "DEN" },
  { slot: "WR2", name: "DJ Moore", team: "CHI" },
  { slot: "WR3", name: "Adam Thielen", team: "PIT" },
  { slot: "FLEX", name: "Travis Etienne Jr.", team: "JAX" },
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
