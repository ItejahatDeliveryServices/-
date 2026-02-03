import { ProcessingStep } from "./types";

export const INITIAL_STEPS: ProcessingStep[] = [
  { label: 'Extracting text from document', status: 'pending' },
  { label: 'AI Analysis & Structural Organization', status: 'pending' },
  { label: 'Fixing grammar and consistency', status: 'pending' },
  { label: 'Generating Table of Contents', status: 'pending' },
  { label: 'Drafting initial summary', status: 'pending' },
];

export const MOCK_BOOK_TITLE = "The Lost Chronicles of Aethelgard";
