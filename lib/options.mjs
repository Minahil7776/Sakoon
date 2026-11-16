// Single source of truth for dropdown values. Used by the UI, validation and the seed script.
export const TITLES = [
  "Clinical Psychologist",
  "Counselling Psychologist",
  "Child & Adolescent Psychologist",
  "Health Psychologist",
  "Neuropsychologist",
  "Psychotherapist",
  "Counsellor",
];

export const SPECIALIZATIONS = [
  "Anxiety", "Depression", "Panic disorders", "Stress management", "Trauma & PTSD",
  "Relationship & marriage", "Child & adolescent", "Addiction & substance use", "OCD",
  "Grief & loss", "Sleep & insomnia", "Anger management", "Career & academic stress",
  "Eating disorders", "Personality disorders", "Bipolar disorder", "Self-esteem", "CBT",
];

export const LANGUAGES = ["English", "Urdu", "Punjabi", "Sindhi", "Pashto", "Balochi", "Saraiki", "Arabic", "Hindi"];

export const SESSION_DURATIONS = [30, 45, 60, 90];

export const fmtPKR = (n) => `PKR ${Number(n).toLocaleString("en-PK")}`;
