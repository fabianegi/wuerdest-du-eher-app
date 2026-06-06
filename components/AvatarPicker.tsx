"use client";

import clsx from "clsx";
import { AVATARS } from "@/lib/game-helpers";

interface Props {
  value: string;
  onChange: (avatar: string) => void;
}

// 6er Raster mit allen Avatar Emojis. Der aktuell ausgewählte Avatar
// wird mit dem Lime Akzent hervorgehoben.
export default function AvatarPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {AVATARS.map((emoji, i) => (
        <button
          key={`${emoji}-${i}`}
          type="button"
          onClick={() => onChange(emoji)}
          className={clsx(
            "aspect-square text-3xl transition-all brut-border",
            value === emoji
              ? "bg-lime scale-105"
              : "bg-cream hover:bg-mist",
          )}
          aria-label={`Avatar ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
