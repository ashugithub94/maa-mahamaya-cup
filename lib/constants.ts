export const TOURNAMENT = {
  name: "MAA MAHAMAYA CUP",
  location: "KUMHARI",
  season: "SEASON 01",
  tagline: "Cricket Se Hi Dosti Hai",
  fee: 1200,
  upiId: "rakeshkhatra8055@okhdfcbank",
  payee: "Rakesh Yadav",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
} as const;

export const PRIZES = [
  { label: "1st Prize", amount: "₹2,00,000", tone: "gold", emphasis: true },
  { label: "2nd Prize", amount: "₹1,00,000", tone: "silver" },
  { label: "3rd Prize", amount: "₹40,000", tone: "bronze" },
  { label: "Man of the Series", amount: "₹11,001", tone: "red" },
  { label: "Best Batsman", amount: "₹5,001", tone: "neutral" },
  { label: "Best Bowler", amount: "₹5,001", tone: "neutral" },
  { label: "Best 35+", amount: "₹2,100", tone: "neutral" },
  { label: "Ownership", amount: "₹35,000", tone: "red" },
  { label: "Player Registration", amount: "₹1,200", tone: "gold" }
] as const;

export const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;

export const ROLES = ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"] as const;

export const BATTING_STYLES = ["Right-hand", "Left-hand"] as const;

export const BOWLING_STYLES = [
  "Right-arm fast",
  "Right-arm medium",
  "Right-arm off-spin",
  "Left-arm spin",
  "Left-arm fast",
  "None"
] as const;
