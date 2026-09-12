import type { Rarity } from "@questline/shared";
import { rarityLabel } from "@questline/shared";

export const rarityClass = (rarity: Rarity) => `ql-rarity-${rarity}`;
export { rarityLabel };
