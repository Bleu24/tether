export type InterestItem = { key: string; label: string };
export type InterestCategory = { name: string; items: InterestItem[] };

// Single source of truth for interests used across setup/profile/discover
export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    name: "Food & drink",
    items: [
      { key: "beer", label: "🍺 Beer" },
      { key: "boba", label: "🧋 Boba tea" },
      { key: "coffee", label: "☕ Coffee" },
      { key: "foodie", label: "🍽️ Foodie" },
      { key: "gin", label: "🍸 Gin" },
      { key: "pizza", label: "🍕 Pizza" },
      { key: "sushi", label: "🍣 Sushi" },
      { key: "sweet_tooth", label: "🍬 Sweet tooth" },
      { key: "tacos", label: "🌮 Tacos" },
      { key: "tea", label: "🫖 Tea" },
      { key: "vegan", label: "🌱 Vegan" },
      { key: "vegetarian", label: "🥗 Vegetarian" },
      { key: "whisky", label: "🥃 Whisky" },
      { key: "wine", label: "🍷 Wine" },
    ],
  },
  {
    name: "Traveling",
    items: [
      { key: "backpacking", label: "🎒 Backpacking" },
      { key: "beaches", label: "🏖️ Beaches" },
      { key: "camping", label: "🏕️ Camping" },
      { key: "exploring_cities", label: "🧭 Exploring new cities" },
      { key: "fishing_trips", label: "🎣 Fishing trips" },
      { key: "hiking", label: "🥾 Hiking trips" },
      { key: "road_trips", label: "🛣️ Road trips" },
      { key: "spa_weekends", label: "💆 Spa weekends" },
      { key: "staycations", label: "🏡 Staycations" },
      { key: "winter_sports", label: "🎿 Winter sports" },
      { key: "water_sports", label: "🌊 Water sports" },
    ],
  },
  {
    name: "Gym & Fitness",
    items: [
      { key: "gym", label: "🏋️ Gym" },
      { key: "yoga", label: "🧘 Yoga" },
      { key: "running", label: "🏃 Running" },
    ],
  },
  {
    name: "Music",
    items: [
      { key: "pop", label: "🎤 Pop" },
      { key: "rock", label: "🎸 Rock" },
      { key: "hiphop", label: "🎧 Hip-hop" },
      { key: "jazz", label: "🎷 Jazz" },
      { key: "classical", label: "🎻 Classical" },
    ],
  },
  {
    name: "Education",
    items: [
      { key: "study_buddy", label: "📚 Study" },
      { key: "lifelong_learning", label: "🧠 Lifelong learning" },
    ],
  },
  {
    name: "Religion",
    items: [
      { key: "christian", label: "✝️ Christian" },
      { key: "muslim", label: "☪️ Muslim" },
      { key: "hindu", label: "🕉️ Hindu" },
      { key: "buddhist", label: "☸️ Buddhist" },
      { key: "spiritual", label: "🔮 Spiritual" },
    ],
  },
  {
    name: "Political views",
    items: [
      { key: "apolitical", label: "⚖️ Apolitical" },
      { key: "moderate", label: "⚖️ Moderate" },
      { key: "progressive", label: "⚖️ Progressive" },
      { key: "conservative", label: "⚖️ Conservative" },
    ],
  },
];

// Max number of interests the user can select in setup
export const INTEREST_MAX = 5;

// Number of chips shown in compact mode across the app
export const VISIBLE_TAGS_COLLAPSED = 4;

// Lookup map for quick label resolution
const LOOKUP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const cat of INTEREST_CATEGORIES) {
    for (const it of cat.items) map[it.key] = it.label;
  }
  return map;
})();

export function interestLabel(key: string): string {
  return LOOKUP[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
