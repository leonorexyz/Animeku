export interface AppSettings {
  // Tampilan
  theme: "dark" | "netflix" | "oled";
  cardSize: "small" | "medium" | "large";
  heroBannerAutoPlay: boolean;
  compactSidebar: boolean;
  language: "id" | "en";

  // Pemutar
  defaultQuality: "auto" | "1080p" | "720p" | "480p" | "360p";
  defaultSubtitle: "id" | "en" | "none";
  playbackSpeed: number;
  autoPlayNext: boolean;
  skipIntroSeconds: number;
  resumePlayback: boolean;

  // Sumber & Sinkronisasi
  autoSyncDrive: boolean;
  syncIntervalHours: number;
  cacheLimitMb: number;
  allowCellularStream: boolean;

  // Profil
  userName: string;
  userEmail: string;
  avatarId: string;
}

export const MOCK_SETTINGS: AppSettings = {
  theme: "netflix",
  cardSize: "medium",
  heroBannerAutoPlay: true,
  compactSidebar: false,
  language: "id",

  defaultQuality: "1080p",
  defaultSubtitle: "id",
  playbackSpeed: 1.0,
  autoPlayNext: true,
  skipIntroSeconds: 85,
  resumePlayback: true,

  autoSyncDrive: true,
  syncIntervalHours: 6,
  cacheLimitMb: 500,
  allowCellularStream: true,

  userName: "Pengguna Animeku",
  userEmail: "user@animeku.local",
  avatarId: "avatar-1",
};
