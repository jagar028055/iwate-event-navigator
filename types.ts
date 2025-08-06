
export interface EventInfo {
  id: string;
  name: string;
  description: string;
  date: string;
  locationName: string;
  latitude: number;
  longitude: number;
  category: string;
  officialUrl?: string;
}

export interface Source {
  uri: string;
  title: string;
}
