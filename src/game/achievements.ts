// Quests + Achievements — retention & onboarding (GDD §13 battle-pass-adjacent, §2 cadences).
// Stats are the permanent account layer (survive season resets, GDD §15).

export interface Stats {
  plotsClaimed: number;
  raidsWon: number;
  siegesWon: number;
  empiresEliminated: number;
  techsResearched: number;
  commandersRecruited: number;
  trades: number;
  seasonsPlayed: number;
}

export const EMPTY_STATS: Stats = {
  plotsClaimed: 0, raidsWon: 0, siegesWon: 0, empiresEliminated: 0,
  techsResearched: 0, commandersRecruited: 0, trades: 0, seasonsPlayed: 0,
};

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  desc: string;
  stat: keyof Stats;
  threshold: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "firstBlood", name: "First Blood", icon: "🩸", desc: "Win your first raid.", stat: "raidsWon", threshold: 1 },
  { id: "raider", name: "Raider", icon: "🗡️", desc: "Win 10 raids.", stat: "raidsWon", threshold: 10 },
  { id: "conqueror", name: "Conqueror", icon: "🏰", desc: "Win 5 sieges.", stat: "siegesWon", threshold: 5 },
  { id: "warlord", name: "Warlord", icon: "💀", desc: "Eliminate a rival empire.", stat: "empiresEliminated", threshold: 1 },
  { id: "landBaron", name: "Land Baron", icon: "🏞️", desc: "Claim 10 plots.", stat: "plotsClaimed", threshold: 10 },
  { id: "scientist", name: "Scientist", icon: "🔬", desc: "Research 5 technologies.", stat: "techsResearched", threshold: 5 },
  { id: "general", name: "General", icon: "🎖️", desc: "Recruit 5 commanders.", stat: "commandersRecruited", threshold: 5 },
  { id: "merchant", name: "Merchant", icon: "💱", desc: "Complete 25 market trades.", stat: "trades", threshold: 25 },
  { id: "veteran", name: "Veteran", icon: "⭐", desc: "Play through 3 seasons.", stat: "seasonsPlayed", threshold: 3 },
];

export interface Quest {
  id: string;
  name: string;
  desc: string;
  stat: keyof Stats;
  target: number;
  reward: number; // $HEXAR (one-time, sink-funded grant)
}

export const QUESTS: Quest[] = [
  { id: "q_first_plot", name: "Stake a Claim", desc: "Claim your first plot.", stat: "plotsClaimed", target: 1, reward: 1500 },
  { id: "q_expand", name: "Expand the Empire", desc: "Claim 3 plots.", stat: "plotsClaimed", target: 3, reward: 4000 },
  { id: "q_first_raid", name: "Draw Blood", desc: "Win a raid.", stat: "raidsWon", target: 1, reward: 2000 },
  { id: "q_research", name: "Enter the Lab", desc: "Research a technology.", stat: "techsResearched", target: 1, reward: 2500 },
  { id: "q_commander", name: "Field Command", desc: "Recruit a commander.", stat: "commandersRecruited", target: 1, reward: 2000 },
  { id: "q_trade", name: "Open for Business", desc: "Complete 5 trades.", stat: "trades", target: 5, reward: 1500 },
  { id: "q_siege", name: "Break the Walls", desc: "Win a siege.", stat: "siegesWon", target: 1, reward: 3500 },
  { id: "q_empire", name: "Kingslayer", desc: "Eliminate a rival empire.", stat: "empiresEliminated", target: 1, reward: 10000 },
];
