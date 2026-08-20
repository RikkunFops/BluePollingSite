import BaseStatus from "./baseStatus";
export interface CharacterField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "image" | "statusSelector";
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
  { key: "owner", label: "Owner Tag",       type: "text",   minLength: 1, maxLength: 50},
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
  { key: "speed",   label: "Speed",   type: "number", min:1, max:15},
  { key: "attack",  label: "Attack",  type: "number", min:1, max:15 },
  { key: "defense", label: "Defense", type: "number", min:1, max:15},
  { key: "style",   label: "Style",   type: "number", min:1, max:15},
  { key: "special", label: "Special", type: "number", min:1, max:15},
  { key: "status", label: "Statuses Applied", type: "statusSelector"}
];

export interface Character {
  id: number;
  image: File | null;
  iconurl: string | null;
  name: string;
  owner_tag: string;
  description: string;
  team: string;
  speed: number;
  attack: number;
  defense: number;
  style: number;
  special: number;
  missAttack: boolean;
  applies_statuses: BaseStatus[];
  status: string;
  stuck: boolean;
  statuses: Record<string, BaseStatus>
}

export interface CharacterResponse {
  success: boolean
  count: number
  data: Character[]
}