export type Grade = 2;

export type Subject = "Math" | "Reading" | "Science" | "Spelling";

export type Question = {
  id: string;
  grade: Grade;
  subject: Subject;
  question: string;
  choices: string[];
  answerIndex: number;
  hint: string;
  explanation: string;
  skill?: string;
  source?: "starter" | "imported" | "practice";
};

export type QuestionPack = {
  title?: string;
  grade?: Grade;
  subject?: Subject;
  questions: Array<Omit<Question, "id"> | Question>;
};

export type QuizRun = {
  id: string;
  date: string;
  subject: Subject;
  score: number;
  total: number;
  starsEarned: number;
  missedQuestionIds: string[];
  missedSkills: string[];
};

export type ReadingLevel = "easy" | "normal" | "challenge";

export type ProfileFavorites = {
  colors: string[];
  animals: string[];
  activities: string[];
  places: string[];
  foods: string[];
  styles: string[];
  readingLevel: ReadingLevel;
};

export type LearnerProfile = {
  id: string;
  name: string;
  age: number;
  grade: Grade;
  parentNames: string[];
  siblingNames: string[];
  favorites: ProfileFavorites;
  avatarColor: string;
};

export type ProfileProgress = {
  score: {
    stars: number;
    sessions: number;
  };
  history: QuizRun[];
  recentIds: string[];
};

export type ProfileStore = {
  activeProfileId: string;
  profiles: LearnerProfile[];
  progressByProfile: Record<string, ProfileProgress>;
};
