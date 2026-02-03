export enum LoadingState {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  PLANNING = 'PLANNING',
  WRITING = 'WRITING', // New state for chapter-by-chapter generation
  GENERATING_COVER = 'GENERATING_COVER',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

export interface Chapter {
  id: string;
  title: string;
  description?: string; // Brief for the AI
  content: string; // HTML or Markdown content
  status: 'pending' | 'generating' | 'completed' | 'error';
  pageStart?: number;
}

export interface BookMetadata {
  title: string;
  author: string;
  genre?: string;
  summary: string;
  language?: string; // 'ar' or 'en'
}

export interface Book {
  metadata: BookMetadata;
  chapters: Chapter[];
  coverUrl?: string;
  rawText?: string; // Original extracted text
}

export interface ProcessingStep {
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}