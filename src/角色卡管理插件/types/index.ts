export type EntrySource = 'role' | 'magic' | 'manual';

export type CardHubItem = {
  id: string;
  name: string;
  avatar: string | null;
  tags: string[];
  origin: 'tavern' | 'library';
  tagKey?: string;
  fingerprint?: string;
  importFileName?: string;
  tagsEdited?: boolean;
  note?: string;
  rawType?: 'png' | 'json';
  raw?: string;
  createdAt?: number;
  lastChatAt?: number;
};
