export type EntrySource = 'role' | 'magic' | 'manual';

export type CardOrigin = 'tavern' | 'library';

export type CardHubItem = {
  id: string;
  name: string;
  avatar: string | null;
  tags: string[];
  origin: CardOrigin;
  tagKey?: string;
  fingerprint?: string;
  importFileName?: string;
  tagsEdited?: boolean;
  rawType?: 'png' | 'json';
  raw?: string;
  createdAt?: number;
  lastChatAt?: number;
};
