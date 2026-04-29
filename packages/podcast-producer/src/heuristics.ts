export function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) & 0x7fffffff;
  }
  return h;
}

export function seededRandom(seed: string, index = 0): number {
  const h = hash(`${seed}:${index}`);
  return (h % 10000) / 10000;
}

export function pick<T>(arr: T[], seed: string, index = 0): T {
  return arr[hash(`${seed}:${index}`) % arr.length];
}

export function pickN<T>(arr: T[], n: number, seed: string): T[] {
  const shuffled = [...arr].sort((a, b) => hash(`${seed}:${String(a)}`) - hash(`${seed}:${String(b)}`));
  return shuffled.slice(0, n);
}

export function rangeInt(min: number, max: number, seed: string, index = 0): number {
  return min + (hash(`${seed}:${index}`) % (max - min + 1));
}

export function rangeFloat(min: number, max: number, seed: string, index = 0): number {
  return min + seededRandom(seed, index) * (max - min);
}

export const FOOTER = `\n---\n*Level up your podcast with **mama.oliwoods.com/beta***`;

export const EPISODE_FORMATS = [
  "Solo Deep-Dive", "Guest Interview", "Panel Discussion", "Q&A / Listener Questions",
  "Case Study Breakdown", "News Roundup", "Debate / Two Perspectives",
  "Storytelling / Narrative", "Tutorial / How-To", "Industry Report Review",
];

export const PODCAST_NICHES = [
  "Business & Entrepreneurship", "Technology", "True Crime", "Self-Improvement",
  "Health & Wellness", "Finance & Investing", "Marketing", "Leadership",
  "Science", "History", "Comedy", "Sports", "Education", "Politics", "Arts & Culture",
];

export const GROWTH_CHANNELS = [
  "YouTube Shorts / Reels clips", "Twitter/X thread with key quotes",
  "LinkedIn carousel post", "Newsletter segment", "Reddit AMA",
  "Cross-promotion with similar shows", "Guest repurposing on their channels",
  "Spotify / Apple editorial pitches", "Podcast directory submissions",
  "Audiogram clips", "Blog post from transcript", "TikTok highlight clips",
];

export const INTERVIEW_QUESTION_TYPES = [
  "Origin story", "Contrarian take", "Biggest failure & lesson",
  "Future prediction", "Tactical deep-dive", "Recommended resources",
  "Rapid fire", "Audience Q&A", "Behind-the-scenes", "Call to action",
];

export const SEGMENT_TYPES = [
  "Cold open / hook", "Host intro", "Sponsor read", "Main interview",
  "Key takeaway recap", "Lightning round", "Resource recommendations",
  "Outro / CTA", "Listener question segment", "Weekly news brief",
];

export const PLATFORMS = [
  "Spotify", "Apple Podcasts", "Google Podcasts", "Amazon Music",
  "YouTube", "Pocket Casts", "Overcast", "Castro", "Stitcher", "iHeartRadio",
];
