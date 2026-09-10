import goldHoops from "@/assets/p-gold-hoops.jpg";
import pearlEarrings from "@/assets/p-pearl-earrings.jpg";
import goldNecklace from "@/assets/p-gold-necklace.jpg";
import layeredNecklace from "@/assets/p-layered-necklace.jpg";
import charmBracelet from "@/assets/p-charm-bracelet.jpg";
import ringSet from "@/assets/p-ring-set.jpg";
import anklet from "@/assets/p-anklet.jpg";
import scrunchies from "@/assets/p-scrunchies.jpg";
import hairClips from "@/assets/p-hair-clips.jpg";
import miniBag from "@/assets/p-mini-bag.jpg";
import sunglasses from "@/assets/p-sunglasses.jpg";
import silkScarf from "@/assets/p-silk-scarf.jpg";

const IMAGES: Record<string, string> = {
  "p-gold-hoops.jpg": goldHoops,
  "p-pearl-earrings.jpg": pearlEarrings,
  "p-gold-necklace.jpg": goldNecklace,
  "p-layered-necklace.jpg": layeredNecklace,
  "p-charm-bracelet.jpg": charmBracelet,
  "p-ring-set.jpg": ringSet,
  "p-anklet.jpg": anklet,
  "p-scrunchies.jpg": scrunchies,
  "p-hair-clips.jpg": hairClips,
  "p-mini-bag.jpg": miniBag,
  "p-sunglasses.jpg": sunglasses,
  "p-silk-scarf.jpg": silkScarf,
};

export function productImage(key: string | null | undefined): string {
  if (!key) return goldHoops;
  if (key.startsWith("http") || key.startsWith("/")) return key;
  return IMAGES[key] ?? goldHoops;
}

export function money(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}
