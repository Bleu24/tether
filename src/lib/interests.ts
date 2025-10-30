export type InterestCategory = {
  name: string;
  items: { key: string; label: string }[];
};

// Curated subset reused by setup and profile edit
export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    name: "Food & drink",
    items: [
      { key: "coffee", label: "☕ Coffee" },
      { key: "sushi", label: "🍣 Sushi" },
      { key: "pizza", label: "🍕 Pizza" },
      { key: "wine", label: "🍷 Wine" },
      { key: "boba", label: "🧋 Boba tea" },
      { key: "vegan", label: "🌱 Vegan" },
    ],
  },
  {
    name: "Traveling",
    items: [
      { key: "hiking", label: "🥾 Hiking" },
      { key: "beaches", label: "🏖️ Beaches" },
      { key: "road_trips", label: "🛣️ Road trips" },
      { key: "backpacking", label: "🎒 Backpacking" },
      { key: "exploring_cities", label: "🧭 Exploring cities" },
    ],
  },
  {
    name: "Lifestyle",
    items: [
      { key: "reading", label: "📚 Reading" },
      { key: "fitness", label: "🏋️ Fitness" },
      { key: "gaming", label: "🎮 Gaming" },
      { key: "music", label: "🎵 Music" },
      { key: "movies", label: "🎬 Movies" },
    ],
  },
];

export const INTEREST_MAX = 5;
