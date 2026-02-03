// Interface for the global Mammoth object loaded via CDN
interface Mammoth {
  extractRawText: (options: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages: any[] }>;
}

declare global {
  interface Window {
    mammoth: Mammoth;
  }
}

export const parseDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!window.mammoth) {
          reject(new Error("Mammoth.js library not loaded"));
          return;
        }

        const result = await window.mammoth.extractRawText({ arrayBuffer });
        resolve(result.value);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};