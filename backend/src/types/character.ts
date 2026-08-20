export interface CharacterField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "image";
  options?: { value: string; label: string }[];
  minLength?: number;
  maxLength?: number;
  maxSizeMB? : number;
  min?: number;
  max?: number;
}

export const fields: CharacterField[] = [
  { key: "image", label: "Character Image", type: "image",  maxSizeMB: 10},
  { key: "name",  label: "Name",            type: "text",   minLength: 3, maxLength: 20 },
  { key: "desc",  label: "Description",     type: "text",   minLength: 10, maxLength: 200},
  {
    key: "team",
    label: "Team",
    type: "select",
    options: [
      { value: "hero",    label: "Hero" },
      { value: "villain", label: "Villain" },
    ],
  },
  { key: "health",  label: "Health",  type: "number", min:1},
  { key: "attack",  label: "Attack",  type: "number", min:1, max:15 },
  { key: "defense", label: "Defense", type: "number", min:1, max:15},
  { key: "speed",   label: "Speed",   type: "number", min:1, max:15},
  { key: "style",   label: "Style",   type: "number", min:1, max:15},
  { key: "special", label: "Special", type: "number", min:1, max:15}
];

export interface Character {
  image: File | null;
  name: string;
  desc: string;
  team: string;
  health: number;
  attack: number;
  defense: number;
  speed: number;
  style: number;
  special: number;
}
