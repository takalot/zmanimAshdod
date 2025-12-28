
export interface SolarData {
  sunrise: string;
  sunset: string;
  first_light: string;
  last_light: string;
  dawn: string;
  dusk: string;
  solar_noon: string;
  day_length: string;
  timezone: string;
}

export interface HebrewDateData {
  gy: number;
  gm: number;
  gd: number;
  afternoon: boolean;
  hy: number;
  hm: string;
  hd: number;
  hebrew: string;
  events?: string[];
}

export interface Zman {
  id: string;
  label: string;
  labelHebrew: string;
  time: string;
  fullTime: Date;
  description: string;
  icon: string;
  importance: 'primary' | 'secondary';
}

export interface LocationInfo {
  name: string;
  lat: number;
  lng: number;
}

export interface UserPreferences {
  notifications: string[]; // List of Zman IDs to notify for
}
