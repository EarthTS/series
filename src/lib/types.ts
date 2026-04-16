export type Episode = {
  id: string;
  title: string;
  url: string;
  order: number;
};

export type Series = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  views: number;
  createdAt: string;
  episodes: Episode[];
  tags: string[];
};

export type UserSession = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  expiredDate: string | null;
};

export type Subscription = {
  active: boolean;
  /** ISO date */
  expiresAt: string | null;
};

export type ContinueItem = {
  seriesId: string;
  episodeId: string;
  seriesTitle: string;
  episodeTitle: string;
  coverUrl: string;
  progress: number;
};
