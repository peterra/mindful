export interface EmotionWordGroup {
  category: string;
  words: string[];
}

export const EMOTION_WORD_BANK: EmotionWordGroup[] = [
  {
    category: "Uplifted",
    words: ["joyful", "grateful", "hopeful", "content", "proud"],
  },
  {
    category: "Calm",
    words: ["peaceful", "relaxed", "steady", "safe"],
  },
  {
    category: "Uneasy",
    words: ["anxious", "overwhelmed", "restless", "on edge"],
  },
  {
    category: "Heavy",
    words: ["sad", "lonely", "tired", "discouraged"],
  },
  {
    category: "Charged",
    words: ["frustrated", "angry", "irritated", "impatient"],
  },
  {
    category: "Curious",
    words: ["curious", "reflective", "uncertain", "surprised"],
  },
];
