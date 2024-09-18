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
}

export type { Mentor, User };
