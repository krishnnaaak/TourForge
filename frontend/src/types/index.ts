export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface TourImage {
  _id: string;
  url: string;
  filename: string;
  label: string;
  order: number;
}

export type TourNiche =
  | "real-estate"
  | "architecture"
  | "interior-design"
  | "art-gallery"
  | "other";

export interface Tour {
  _id: string;
  title: string;
  description: string;
  niche: TourNiche;
  images: TourImage[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type HotspotStatus = "pending" | "processing" | "completed" | "failed";

export interface Hotspot {
  _id: string;
  tourId: string;
  imageId: string;
  label: string;
  x: number; // % of image width (0-100)
  y: number; // % of image height (0-100)
  description: string;
  accessibilityNotes: string;
  salesCopy: string;
  status: HotspotStatus;
  retryCount: number;
  lastError: string;
  userContext: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
