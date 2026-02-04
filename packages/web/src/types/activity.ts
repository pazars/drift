export interface ActivityPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
}

export interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  date: string;
  distance: number; // in meters
  duration: number; // in seconds
  elevation?: number; // total elevation gain in meters
  polyline: string; // encoded polyline
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  tags?: string[];
}

export type ActivityType = 'run' | 'ride' | 'walk' | 'hike' | 'swim' | 'ski' | 'other';

export interface ActivityFilter {
  types?: ActivityType[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  minDistance?: number;
  maxDistance?: number;
}
