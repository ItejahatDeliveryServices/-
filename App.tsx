import React, { useState, useEffect, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { LoadingScreen } from './components/LoadingScreen';
import { BookPreview } from './components/BookPreview';
import { Book, LoadingState, ProcessingStep, Chapter } from './types';
import { parseDocx } from './services/documentParser';
import { generateBookStructure, generateChapterContent, generateBookCover, suggestIllustration } from './services/geminiService';

const INITIAL_STEPS: ProcessingStep[] = [
    { label: 'Reading manuscript', status: 'pending' },
    { label: 'Analyzing structure & removing duplicates', status: 'pending' },
    { label: 'Planning chapters (Table of Contents)', status: 'pending' },
    { label: 'Writing content chapter by chapter', status: 'pending' },
];

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [book, setBook] = useState<Book | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Ref to stop generation if needed (not implemented in UI but good practice)
  const abortRef = useRef(false);

  const updateStepStatus = (index: number, status: ProcessingStep['status']) => {
    setSteps(prev => prev.map((step, i) => i === index ? { ...step, status } : step));
  };

  const handleFileUpload = async (file: File) => {
    setLoadingState(LoadingState.PARSING);
    setErrorMsg(null);
    setBook(null);
    setSteps(INITIAL_STEPS);
    updateStepStatus(0, 'processing');

    try {
      // Step 1: Extract Text
      const rawText = await parseDocx(file);
      updateStepStatus(0, 'completed');

      // Step 2: AI Structure
      setLoadingState(LoadingState.PLANNING);
      updateStepStatus(1, 'processing');
      updateStepStatus(2, 'processing');
      
      const structure = await generateBookStructure(rawText, file.name);
      
      const chapters: Chapter[] = (structure.chapters || []).map((ch, idx) => ({
        ...ch,
        status: 'pending',
        content: '', // Start empty
        pageStart: idx * 15 + 1 // Estimation
      }));

      const newBook: Book = {
        metadata: structure.metadata || { title: 'Unknown', author: 'Unknown', summary: '', language: 'en' },
        chapters: chapters,
        rawText: rawText,
      };

      setBook(newBook);
      updateStepStatus(1, 'completed');
      updateStepStatus(2, 'completed');
      
      // Step 3: Start Writing Content
      setLoadingState(LoadingState.WRITING);
      updateStepStatus(3, 'processing');
      
      // Trigger background generation
      processChapters(newBook, rawText);

    } catch (err: any) {
      console.error(err);
      setLoadingState(LoadingState.ERROR);
      setErrorMsg(err.message || "An unexpected error occurred processing your book.");
      updateStepStatus(0, 'error');
    }
  };

  // Process chapters one by one to ensure quality and length
  const processChapters = async (currentBook: Book, rawText: string) => {
    const chaptersToProcess = [...currentBook.chapters];
    
    // Auto-select first chapter to show progress
    if (chaptersToProcess.length > 0) {
        setActiveChapterId(chaptersToProcess[0].id);
    }

    // Generate cover in parallel
    generateCover(currentBook);

    for (let i = 0; i < chaptersToProcess.length; i++) {
        const chapter = chaptersToProcess[i];
        
        // Update status to generating
        setBook(prev => {
            if (!prev) return null;
            const updated = [...prev.chapters];
            updated[i] = { ...updated[i], status: 'generating' };
            return { ...prev, chapters: updated };
        });

        try {
            const content = await generateChapterContent(
                chapter.title, 
                chapter.description || "", 
                rawText, 
                currentBook.metadata
            );

            // Update with content
            setBook(prev => {
                if (!prev) return null;
                const updated = [...prev.chapters];
                updated[i] = { ...updated[i], status: 'completed', content: content };
                return { ...prev, chapters: updated };
            });

        } catch (error) {
            console.error(`Failed to generate chapter ${chapter.id}`, error);
            setBook(prev => {
                if (!prev) return null;
                const updated = [...prev.chapters];
                updated[i] = { ...updated[i], status: 'error', content: "Error generating content." };
                return { ...prev, chapters: updated };
            });
        }
    }

    setLoadingState(LoadingState.SUCCESS);
    updateStepStatus(3, 'completed');
  };

  const generateCover = async (bookData: Book) => {
      setIsGeneratingCover(true);
      try {
          const url = await generateBookCover(bookData.metadata);
          setBook(prev => prev ? { ...prev, coverUrl: url } : null);
      } catch(e) {
          console.error("Cover failed", e);
      } finally {
          setIsGeneratingCover(false);
      }
  }

  const handleSuggestIllustration = async () => {
      if (!book || !activeChapterId) return;
      const chapter = book.chapters.find(c => c.id === activeChapterId);
      if(!chapter || !chapter.content) return;

      const illustrationPrompt = await suggestIllustration(chapter.content);
      alert(`AI Suggestion for Illustration:\n\n"${illustrationPrompt}"`);
  };

  // Determine which view to show
  const showLoading = loadingState === LoadingState.PARSING || loadingState === LoadingState.PLANNING;
  const showEditor = loadingState === LoadingState.WRITING || loadingState === LoadingState.SUCCESS;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 text-white p-1.5 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 4.168 6.253v13C4.168 19.624 5.81 20 7.5 20s3.332-.477 4.5-1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 19.624 18.247 20 16.5 20a4.85 4.85 0 01-2-1.253" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Lumina Press <span className="text-slate-500 font-normal">Editor</span></span>
          </div>
          
          {showEditor && (
             <div className="flex items-center gap-3">
                 <div className="hidden md:flex text-xs text-slate-400 mr-4 items-center gap-2">
                    {loadingState === LoadingState.WRITING ? (
                        <>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                            <span>Writing book...</span>
                        </>
                    ) : (
                        <>
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>Ready to publish</span>
                        </>
                    )}
                 </div>
                 <button 
                  onClick={() => alert("This would download a compiled .epub or .pdf file.")}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                   Export PDF
                 </button>
                 <button 
                  onClick={() => alert("Saved to cloud library.")}
                  className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 shadow-sm transition-colors"
                 >
                   Publish
                 </button>
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {loadingState === LoadingState.IDLE && (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#f8fafc]">
            <div className="max-w-xl w-full">
              <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Turn your manuscript into a <span className="text-indigo-600">masterpiece</span>.</h1>
                <p className="text-lg text-slate-600">
                  Upload your raw Word document. Our AI will deduplicate content, structure chapters, design a cover, and format a comprehensive book.
                </p>
              </div>
              <FileUpload onFileSelect={handleFileUpload} />
              
              <div className="mt-12 grid grid-cols-3 gap-6 text-center">
                 <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="text-indigo-600 mb-2 font-bold text-sm uppercase tracking-wide">Structure</div>
                    <p className="text-xs text-slate-500">Intelligent Table of Contents generation</p>
                 </div>
                 <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="text-indigo-600 mb-2 font-bold text-sm uppercase tracking-wide">Design</div>
                    <p className="text-xs text-slate-500">Professional layout & cover art</p>
                 </div>
                 <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="text-indigo-600 mb-2 font-bold text-sm uppercase tracking-wide">Content</div>
                    <p className="text-xs text-slate-500">Deep cleaning & deduplication</p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {showLoading && (
          <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
            <LoadingScreen steps={steps} />
          </div>
        )}
        
        {loadingState === LoadingState.ERROR && (
           <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-md text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold mb-2">Processing Error</h2>
                <p className="text-slate-600 mb-6">{errorMsg}</p>
                <button 
                  onClick={() => setLoadingState(LoadingState.IDLE)}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Try Again
                </button>
              </div>
           </div>
        )}

        {showEditor && book && (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar: Navigation & Structure */}
            <aside className="w-72 lg:w-80 bg-white border-r border-slate-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
               <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 truncate font-serif">{book.metadata.title}</h3>
                  <p className="text-xs text-slate-500 truncate">{book.metadata.author}</p>
               </div>
               
               <div className="flex-1 overflow-y-auto py-2">
                  <div className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Table of Contents</div>
                  <nav className="space-y-0.5 px-2">
                     <button
                        onClick={() => setActiveChapterId(null)}
                        className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all ${activeChapterId === null ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                     >
                       <span className="flex items-center">
                         <svg className="w-4 h-4 mr-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                         Title Page
                       </span>
                     </button>
                     {book.chapters.map((chapter) => (
                       <button
                         key={chapter.id}
                         onClick={() => setActiveChapterId(chapter.id)}
                         className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all group flex items-center justify-between ${activeChapterId === chapter.id ? 'bg-slate-100 text-slate-900 font-medium shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                       >
                         <div className="flex items-center flex-1 min-w-0">
                             <span className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                                 chapter.status === 'completed' ? 'bg-green-400' :
                                 chapter.status === 'generating' ? 'bg-indigo-400 animate-pulse' :
                                 chapter.status === 'error' ? 'bg-red-400' :
                                 'bg-slate-200'
                             }`}></span>
                             <span className="truncate">{chapter.title}</span>
                         </div>
                       </button>
                     ))}
                  </nav>
               </div>

               <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => generateCover(book)}
                      disabled={isGeneratingCover}
                      className="px-3 py-2 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex flex-col items-center justify-center gap-1 shadow-sm"
                    >
                      {isGeneratingCover ? (
                         <span className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-500 border-t-transparent"></span>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      )}
                      {book.coverUrl ? 'Redesign Cover' : 'Create Cover'}
                    </button>
                    
                    <button 
                       onClick={handleSuggestIllustration}
                       disabled={!activeChapterId}
                       className={`px-3 py-2 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex flex-col items-center justify-center gap-1 shadow-sm ${!activeChapterId ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Suggest Art
                    </button>
                  </div>
               </div>
            </aside>

            {/* Main Preview Area */}
            <section className="flex-1 bg-slate-200 p-4 md:p-8 overflow-hidden flex flex-col items-center justify-center">
               <div className="flex-1 w-full max-w-4xl overflow-hidden relative shadow-2xl rounded-sm">
                  <BookPreview 
                    book={book} 
                    activeChapter={book.chapters.find(c => c.id === activeChapterId) || null} 
                  />
               </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;