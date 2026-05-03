export type Era =
  | 'Founding'
  | 'Jeffersonian'
  | 'Era of Good Feelings'
  | 'Jacksonian'
  | 'Antebellum'
  | 'Civil War'
  | 'Reconstruction'
  | 'Gilded Age'
  | 'Progressive Era'
  | 'WWI'
  | '1920s'
  | 'Great Depression'
  | 'WWII'
  | 'Early Cold War'
  | '1950s'
  | '1960s'
  | '1970s'
  | '1980s'
  | '1990s'
  | '2000s'
  | '2010s'
  | '2020s';

export interface President {
  /** Presidency number. Cleveland appears as both 22 and 24. */
  number: number;
  name: string;
  /** e.g. "Democrat", "Republican", "Whig". "None" for Washington. */
  party: string;
  /** e.g. "1789–1797" */
  term: string;
  /** Start year as a number for sorting. */
  startYear: number;
  era: Era;
  /** APUSH-relevant facts. Aim for 3–5 per presidency. */
  facts: string[];
  /** Filename in /public/i/presidents/ — undefined if no portrait is available yet. */
  image?: string;
}

export type Mode = 'flashcards' | 'multiple' | 'lineage' | 'lineage-study';
