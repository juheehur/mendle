export type AdCopy = {
  id?: string;
  userId: string;
  mainCopy: string;
  subCopy: string;
  editCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type User = {
  id: string;
  email: string;
};

export type EditHistoryEntry = {
  id?: string;
  adCopyId: string;
  mainCopy: string;
  subCopy: string;
  createdAt?: string;
};

export type CreatorProfile = {
  id: string;
  user_id: string;
  nickname: string;
  instagram_handle?: string;
  youtube_channel?: string;
  tiktok_handle?: string;
  blog_url?: string;
  content_category: string;
  followers_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type SocialData = {
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  blog?: string;
  threads?: string;
}; 