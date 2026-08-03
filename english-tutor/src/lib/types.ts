export interface Correction {
  wrong: string;
  right: string;
  tip: string;
}

export interface ChatApiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatApiResponse {
  reply: string;
  corrections: Correction[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface ReadingData {
  title: string;
  passage: string;
  questions: QuizQuestion[];
}

export interface ListeningLine {
  speaker: "A" | "B";
  text: string;
}

export interface ListeningData {
  title: string;
  lines: ListeningLine[];
  questions: QuizQuestion[];
}

export interface Profile {
  id: string;
  display_name: string | null;
  level: string;
  streak_days: number;
  last_practice_date: string | null;
  created_at: string;
}
