import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, Terminal } from 'lucide-react';
import { askZenith } from '../services/geminiService';

export const CommandCenter: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);
    try {
      const result = await askZenith(query);
      setResponse(result);
    } catch (err) {
      setResponse("An error occurred in the void.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-resize or focus logic could go here
  useEffect(() => {
    if (response && inputRef.current) {
        // Keep focus on input after submission if desired, or blur
    }
  }, [response]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 relative z-10">
      <div
        className={`
          relative transition-all duration-300 ease-out p-[1px] rounded-xl bg-gradient-to-r
          ${isFocused ? 'from-white/20 via-white/10 to-white/20' : 'from-white/10 via-white/5 to-white/10'}
        `}
      >
        <form
          onSubmit={handleSubmit}
          className="relative bg-surface rounded-xl overflow-hidden flex items-center p-2 shadow-2xl ring-1 ring-white/5"
        >
          <div className="pl-4 text-secondary">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Terminal size={20} />}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask Zenith to think..."
            className="w-full bg-transparent border-none focus:ring-0 text-primary placeholder-neutral-600 px-4 py-3 text-lg font-light outline-none"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={!query.trim() || loading}
            className={`
              p-2 rounded-lg transition-all duration-200 flex items-center justify-center
              ${query.trim() && !loading ? 'bg-white text-black hover:bg-neutral-200' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}
            `}
          >
            <ArrowRight size={18} />
          </button>
        </form>
      </div>

      {/* Response Area */}
      {response && (
        <div className="mt-6 animate-slide-up">
           <div className="bg-surface/50 border border-white/5 rounded-lg p-6 backdrop-blur-sm">
             <div className="flex items-start gap-3">
               <Sparkles className="text-yellow-500 mt-1 shrink-0" size={16} />
               <div>
                 <p className="text-neutral-300 leading-relaxed font-light text-lg">
                   {response}
                 </p>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};
