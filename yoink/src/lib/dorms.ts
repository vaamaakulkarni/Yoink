// Single source of truth for dorm/accommodation names.
// Both the feed (Frontend 1) and signup (Frontend 3) import this
// same list, so dorm names always stay in sync between the two.

export const DORMS = [
  // University Residences
  'Queen Mary Building',
  'Regiment Building',
  'Darlington House',
  'Abercrombie Student Accommodation',

  // Residential Colleges
  'Mandelbaum House',
  'Sancta Sophia College',
  "St Andrew's College",
  "St John's College",
  "St Paul's College",
  'Wesley College',
  "The Women's College",

  // Independent providers near campus
  'Sydney University Village',
  'Scape',
  'UniLodge',
  'Iglu',
] as const

export type Dorm = (typeof DORMS)[number]
