import { GoogleGenAI, Type } from "@google/genai";
import { Book, Chapter, BookMetadata } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Analyzes the full manuscript and creates a comprehensive structure (TOC).
 * This ensures deduplication and logical flow before writing content.
 */
export const generateBookStructure = async (rawText: string, fileName: string): Promise<Partial<Book>> => {
  const ai = getAI();
  
  // We do NOT truncate significantly anymore. Gemini 1.5/3 Pro handles large context.
  // Passing full context to ensure global understanding for deduplication.
  
  const prompt = `
    You are a world-class Senior Book Editor and Publisher.
    I have a raw manuscript (approx ${rawText.length} chars) from a file named "${fileName}".
    
    CRITICAL ISSUES WITH MANUSCRIPT:
    1. It contains duplicate sections and repetitive text.
    2. It is disorganized and lacks professional structure.
    3. It needs to be a COMPREHENSIVE book (aiming for high page count quality), not a summary.

    YOUR MISSION:
    1. Detect the language of the text (e.g., Arabic or English).
    2. Analyze the ENTIRE text. Identify the logical flow.
    3. Plan a complete book structure. 
       - Remove all duplicates.
       - Group related ideas into Chapters.
       - Ensure the Table of Contents covers 100% of the unique valuable content.
       - Create a logical progression: Introduction -> Core Concepts -> Advanced Topics -> Conclusion.
    
    Output a JSON containing the Book Metadata and a list of Chapters (titles and brief descriptions of what goes in them).
    DO NOT generate the chapter content yet, just the structure.
    
    Raw Text (First 1M chars):
    ${rawText.substring(0, 1000000)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          metadata: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              summary: { type: Type.STRING },
              genre: { type: Type.STRING },
              language: { type: Type.STRING, description: "Two letter code e.g. 'en' or 'ar'" }
            },
            required: ["title", "author", "summary", "language"]
          },
          chapters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING, description: "Detailed instruction on what original content belongs in this chapter." },
              },
              required: ["id", "title", "description"]
            }
          }
        },
        required: ["metadata", "chapters"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};

/**
 * Step 2: Generates the full content for a single chapter.
 * Uses the full manuscript as context to ensure detailed, non-summarized output.
 */
export const generateChapterContent = async (
  chapterTitle: string, 
  chapterDescription: string, 
  fullManuscript: string,
  bookMetadata: BookMetadata
): Promise<string> => {
  const ai = getAI();
  
  const isArabic = bookMetadata.language === 'ar';
  
  const prompt = `
    Role: Professional Book Author/Ghostwriter.
    Task: Write the FULL content for the chapter: "${chapterTitle}".
    Book Title: "${bookMetadata.title}".
    Language: ${isArabic ? 'Arabic (Modern Standard / Professional)' : 'English'}.
    
    Chapter Guidelines:
    - This is part of a comprehensive book. DO NOT SUMMARIZE. 
    - Write in a detailed, expanded, professional book format.
    - Use the provided Manuscript Context to source the information.
    - Refine the text: Fix grammar, improve flow, remove redundancy, but keep the depth.
    - Formatting: Use Markdown. Use ### for subheadings. Use > for important quotes.
    - Style: Elegant, professional, engaging.
    - ${chapterDescription}
    
    Manuscript Context (Source Material):
    ${fullManuscript.substring(0, 1000000)}
  `;

  // Using a model with high output capability
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
        // High token limit to allow long chapters
        maxOutputTokens: 8192, 
    }
  });

  return response.text || "";
};

/**
 * Generates a book cover image.
 */
export const generateBookCover = async (metadata: BookMetadata): Promise<string> => {
  const ai = getAI();
  
  const prompt = `A professional, best-selling book cover for a book titled "${metadata.title}" by ${metadata.author}. 
  Genre: ${metadata.genre || 'General Non-Fiction'}.
  Summary context: ${metadata.summary}.
  Style: Minimalist, elegant, high-end typography, cinematic lighting.
  No text on the image, just the background art.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
        parts: [{ text: prompt }]
    },
    config: {
        imageConfig: {
            aspectRatio: "3:4", 
            imageSize: "1K"
        }
    }
  });

  // Extract image
  let base64Image = "";
  if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
              base64Image = part.inlineData.data;
              break;
          }
      }
  }

  if (!base64Image) {
      throw new Error("Failed to generate image");
  }

  return `data:image/png;base64,${base64Image}`;
};

export const suggestIllustration = async (chapterContent: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Read this chapter and describe a scene that would make a perfect illustration for it. Keep it concise (1-2 sentences). Chapter excerpt: ${chapterContent.substring(0, 2000)}`,
    });
    return response.text || "A mysterious scene relevant to the chapter.";
}