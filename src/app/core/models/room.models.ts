export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 16;

export enum RoomPhase {
  LOBBY = 'LOBBY',
  READY_FOR_ROUND = 'READY_FOR_ROUND',
  REVEAL = 'REVEAL',
  AWAITING_VOTE_START = 'AWAITING_VOTE_START',
  VOTING = 'VOTING',
  AWAITING_NEXT_ROUND = 'AWAITING_NEXT_ROUND',
  FINISHED = 'FINISHED',
}

export enum TraitCategory {
  GENDER_AGE = 'GENDER_AGE',
  BODY = 'BODY',
  CHARACTER = 'CHARACTER',
  PROFESSION = 'PROFESSION',
  HEALTH = 'HEALTH',
  HOBBY = 'HOBBY',
  PHOBIA = 'PHOBIA',
  BAGGAGE = 'BAGGAGE',
  FACT = 'FACT',
}

export const TRAIT_CATEGORY_ORDER: TraitCategory[] = [
  TraitCategory.PROFESSION,
  TraitCategory.GENDER_AGE,
  TraitCategory.BODY,
  TraitCategory.CHARACTER,
  TraitCategory.HEALTH,
  TraitCategory.HOBBY,
  TraitCategory.PHOBIA,
  TraitCategory.BAGGAGE,
  TraitCategory.FACT,
];

export const TRAIT_CATEGORY_LABELS: Record<TraitCategory, string> = {
  [TraitCategory.GENDER_AGE]: 'Стать та вік',
  [TraitCategory.BODY]: 'Статура',
  [TraitCategory.CHARACTER]: 'Характер',
  [TraitCategory.PROFESSION]: 'Професія',
  [TraitCategory.HEALTH]: "Здоров'я",
  [TraitCategory.HOBBY]: 'Хобі',
  [TraitCategory.PHOBIA]: 'Фобія',
  [TraitCategory.BAGGAGE]: 'Багаж',
  [TraitCategory.FACT]: 'Факт',
};

export const TRAIT_CATEGORY_ICONS: Record<TraitCategory, string> = {
  [TraitCategory.GENDER_AGE]: 'wc',
  [TraitCategory.BODY]: 'accessibility_new',
  [TraitCategory.CHARACTER]: 'psychology',
  [TraitCategory.PROFESSION]: 'work',
  [TraitCategory.HEALTH]: 'favorite',
  [TraitCategory.HOBBY]: 'sports_esports',
  [TraitCategory.PHOBIA]: 'warning',
  [TraitCategory.BAGGAGE]: 'luggage',
  [TraitCategory.FACT]: 'lightbulb',
};

/** Possible stage/level pools the backend samples from for these two categories. */
export const PROFESSION_LEVELS: string[] = [
  'Новачок',
  'Стажер',
  'Любитель',
  'Досвідчений',
  'Професіонал',
  'Експерт',
];

export const HOBBY_LEVELS: string[] = ['Новачок', 'Аматор', 'Досвідчений', 'Просунутий', 'Майстер'];

export enum SpecialCardType {
  SWAP_TRAIT = 'SWAP_TRAIT',
  REROLL_OWN = 'REROLL_OWN',
  REROLL_TARGET = 'REROLL_TARGET',
  HEAL = 'HEAL',
  PEEK = 'PEEK',
  FORCE_REVEAL = 'FORCE_REVEAL',
  IMMUNITY = 'IMMUNITY',
  DOUBLE_VOTE = 'DOUBLE_VOTE',
  REVOTE = 'REVOTE',
}

export const SPECIAL_CARD_ICONS: Record<SpecialCardType, string> = {
  [SpecialCardType.SWAP_TRAIT]: 'swap_horiz',
  [SpecialCardType.REROLL_OWN]: 'casino',
  [SpecialCardType.REROLL_TARGET]: 'local_fire_department',
  [SpecialCardType.HEAL]: 'medical_services',
  [SpecialCardType.PEEK]: 'visibility',
  [SpecialCardType.FORCE_REVEAL]: 'flashlight_on',
  [SpecialCardType.IMMUNITY]: 'shield',
  [SpecialCardType.DOUBLE_VOTE]: 'exposure_plus_2',
  [SpecialCardType.REVOTE]: 'restart_alt',
};

/** Mirrors the backend's SpecialCard: own cards are always sent, others' only once played. */
export interface SpecialCard {
  id: string;
  type: SpecialCardType;
  category?: TraitCategory;
  title: string;
  description: string;
  timing: 'ANY' | 'VOTING';
  target: 'none' | 'other' | 'any';
  used: boolean;
  targetPlayerId: string | null;
}

export interface GameLogEntry {
  id: number;
  at: number;
  kind: 'round' | 'card' | 'elimination';
  text: string;
}

export interface TraitCard {
  label: string;
  detail?: string;
}

export interface TraitCardView {
  category: TraitCategory;
  revealed: boolean;
  card: TraitCard | null;
}

export interface PlayerView {
  id: string;
  name: string;
  isOwner: boolean;
  ready: boolean;
  connected: boolean;
  eliminated: boolean;
  isSelf: boolean;
  hasTraits: boolean;
  traits: TraitCardView[];
  publiclyRevealedCategories: TraitCategory[];
  specialCards: SpecialCard[];
  specialCardsLeft: number;
}

export interface VotingView {
  sessionIndex: number;
  votes: Record<string, string>;
  voteCounts: Record<string, number>;
  allVoted: boolean;
  lastResult: 'TIE' | 'ELIMINATED' | null;
  tiedPlayerIds: string[];
  immunePlayerIds: string[];
  doubleVoterIds: string[];
}

export interface RoomSnapshot {
  code: string;
  phase: RoomPhase;
  round: number;
  totalRounds: number;
  bunkerId: string | null;
  cataclysmId: string | null;
  bunkerLocked: boolean;
  cataclysmLocked: boolean;
  ownerId: string;
  activePlayerId: string | null;
  votingSessionsRemainingThisRound: number;
  phaseDeadline: number | null;
  voting: VotingView | null;
  players: PlayerView[];
  viewerPlayerId: string | null;
  log: GameLogEntry[];
}

export interface BunkerConfig {
  id: string;
  name: string;
  description: string;
  areaSqm: number;
  survivalDurationYears: number;
  foodSupplyDescription: string;
  rooms: string[];
  problems: string[];
  foodAssortment: string[];
  items: string[];
}

export interface CataclysmConfig {
  id: string;
  name: string;
  description: string;
}

export interface CreateRoomResponse {
  playerId: string;
  room: RoomSnapshot;
}

export interface JoinRoomResponse {
  playerId: string;
  room: RoomSnapshot;
}

/** Mirrors REVEAL_TURN_SECONDS / VOTING_DISCUSSION_SECONDS on the backend; used only to draw the progress line. */
export const PHASE_DURATION_SECONDS = 60;

/**
 * Mirror of the backend's ELIMINATION_SCHEDULE: votes per round indexed by the
 * player count at game start. Only used to tell players how many seats the
 * bunker has.
 */
export const ELIMINATION_SCHEDULE: Record<number, number[]> = {
  4: [0, 0, 0, 1, 1],
  5: [0, 0, 1, 1, 1],
  6: [0, 0, 1, 1, 1],
  7: [0, 1, 1, 1, 1],
  8: [0, 1, 1, 1, 1],
  9: [0, 1, 1, 1, 2],
  10: [0, 1, 1, 1, 2],
  11: [0, 1, 1, 2, 2],
  12: [0, 1, 1, 2, 2],
  13: [0, 1, 2, 2, 2],
  14: [0, 1, 2, 2, 2],
  15: [0, 2, 2, 2, 2],
  16: [0, 2, 2, 2, 2],
};
