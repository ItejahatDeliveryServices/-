import React from 'react';
import { Book, Chapter } from '../types';

interface BookPreviewProps {
  book: Book;
  activeChapter: Chapter | null;
}

export const BookPreview: React.FC<BookPreviewProps> = ({ book, activeChapter }) => {
  const isArabic = book.metadata.language === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';
  const serifFont = isArabic ? 'font-arabic' : 'font-serif';

  // If no chapter selected, show Title Page
  if (!activeChapter) {
    return (
      <div className="h-full bg-[#fdfbf7] shadow-lg rounded-r-lg border-l border-gray-200 overflow-y-auto p-8 md:p-16 flex flex-col items-center justify-center text-center relative">
        {/* Book Texture Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>
        
        <div className="z-10 max-w-lg w-full flex flex-col items-center">
            {book.coverUrl ? (
            <div className="mb-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] rounded overflow-hidden w-64 md:w-80 transform transition-transform hover:scale-[1.02]">
                <img src={book.coverUrl} alt="Book Cover" className="w-full h-auto object-cover" />
            </div>
            ) : (
            <div className="w-64 h-96 bg-gray-200 flex items-center justify-center mb-12 text-gray-400 rounded border border-gray-300">
                <span className="font-medium">Cover Generating...</span>
            </div>
            )}
            
            <h1 className={`text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight ${serifFont}`} dir={dir}>
                {book.metadata.title}
            </h1>
            
            <div className="flex items-center gap-4 w-full justify-center mb-8">
                <div className="h-px bg-gray-400 flex-1 max-w-[100px]"></div>
                <div className="text-gray-400 text-xl">❦</div>
                <div className="h-px bg-gray-400 flex-1 max-w-[100px]"></div>
            </div>

            <p className={`text-2xl text-gray-700 italic mb-12 ${serifFont}`} dir={dir}>
                {book.metadata.author}
            </p>
            
            <div className="absolute bottom-8 text-xs text-gray-400 uppercase tracking-widest font-sans">
                Lumina Press Edition
            </div>
        </div>
      </div>
    );
  }

  const isGenerating = activeChapter.status === 'generating' || activeChapter.status === 'pending';

  return (
    <div className="h-full bg-[#fdfbf7] shadow-sm rounded-r-lg border-l border-gray-200 overflow-y-auto relative custom-scrollbar">
       {/* Paper Texture */}
       <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>

      <div className={`max-w-3xl mx-auto py-16 px-8 md:px-16 min-h-full ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
        
        {/* Header */}
        <div className={`flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest mb-16 ${serifFont} border-b border-gray-200 pb-4`}>
           <span>{book.metadata.title}</span>
           <span>{activeChapter.title}</span>
        </div>

        {/* Chapter Heading */}
        <div className="mb-12 text-center">
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Chapter {activeChapter.id}</span>
            <h2 className={`text-4xl md:text-5xl font-bold text-gray-900 leading-tight ${serifFont}`}>
            {activeChapter.title}
            </h2>
             <div className="mt-8 text-gray-300">
                <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fillOpacity="0" /><path d="M12 5.5c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5 6.5-2.91 6.5-6.5-2.91-6.5-6.5-6.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="none"/><circle cx="12" cy="12" r="1.5"/></svg>
            </div>
        </div>

        {/* Content */}
        {isGenerating ? (
            <div className="space-y-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                <div className="py-12 text-center text-gray-400 font-serif italic">
                    Writing your chapter...
                </div>
            </div>
        ) : (
            <div className={`prose prose-lg ${isArabic ? 'prose-xl' : ''} prose-slate max-w-none ${serifFont} text-gray-800 leading-loose text-justify`}>
                {/* Simulated Markdown Rendering */}
                {activeChapter.content.split('\n').map((paragraph, idx) => {
                    const p = paragraph.trim();
                    if (!p) return <br key={idx} />;
                    if (p.startsWith('###')) return <h3 key={idx} className="text-2xl font-bold mt-8 mb-4 text-gray-900">{p.replace('###', '')}</h3>;
                    if (p.startsWith('##')) return <h2 key={idx} className="text-3xl font-bold mt-10 mb-6 text-gray-900">{p.replace('##', '')}</h2>;
                    
                    // Drop cap for first paragraph
                    if (idx === 0) {
                        const firstLetter = p.charAt(0);
                        const rest = p.slice(1);
                        return (
                            <p key={idx} className="mb-6">
                                <span className={`float-left text-7xl leading-[0.8] pr-2 font-bold text-gray-900 ${isArabic ? 'ml-2 float-right' : 'mr-2'}`}>{firstLetter}</span>
                                {rest}
                            </p>
                        );
                    }
                    return <p key={idx} className="mb-6 indent-8">{p}</p>
                })}
            </div>
        )}

        {/* Page Footer */}
        <div className="mt-24 pt-8 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 font-serif">
           <span>Lumina Press</span>
           <span>{activeChapter.pageStart}</span>
        </div>
      </div>
    </div>
  );
};