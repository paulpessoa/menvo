interface User {
  id: number;
  name: string;
  email: string;
  linkedin?: string;
  photo: string;
}

interface Mentor extends User {
  bio: string;
  subject: string[];
  slug: string;
  description: string;
  calendar: string;
  career: string;
  academy: string;
  region: string;
  city: string;
  talkAbout: string[];
  tags: string[];
}
interface FilterState {
  search: string;
  talkAbout: string;
  career: string;
  academy: string;
  regions: string[];
  cities: string[];
  tags: string[];
}

export type { Mentor, User, FilterState };
