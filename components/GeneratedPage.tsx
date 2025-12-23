
import React, { useMemo, useState } from 'react';

interface GeneratedPageProps {
  prompt: string;
  pageNumber: number;
  isInitiallyExpanded: boolean;
}

interface ParsedPromptLine {
  title: string;
  fullLine: string;
}

interface ParsedMetadata {
  [key: string]: {
    dialogue?: string;
    translation?: string;
  };
}

const GeneratedPage: React.FC<GeneratedPageProps> = ({ prompt, pageNumber, isInitiallyExpanded }) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const [copiedPanel, setCopiedPanel] = useState<number | null>(null);

  const parsedContent = useMemo(() => {
    if (!prompt) return null;

    // Split into Prompts section and Metadata section
    // The separator defined in GeminiService is __METADATA_SECTION__
    const [promptsPart, metadataPart] = prompt.split('__METADATA_SECTION__');

    // Parse Prompts
    const promptLines: ParsedPromptLine[] = [];
    const promptRegex = /^(Image \d+):(.*)$/gm;
    let match;

    if (promptsPart) {
        while ((match = promptRegex.exec(promptsPart)) !== null) {
            promptLines.push({
                title: match[1].trim(),
                fullLine: match[0].trim()
            });
        }
    }

    // Parse Metadata (French translations and dialogues)
    const metadata: ParsedMetadata = {};
    if (metadataPart) {
        // Split by "Image X:" blocks in the metadata section
        const imageBlocks = metadataPart.split(/(?=Image \d+:)/g);
        
        imageBlocks.forEach(block => {
            const titleMatch = block.match(/(Image \d+):/);
            if (titleMatch) {
                const title = titleMatch[1].trim();
                
                const dialogueMatch = block.match(/DIALOGUE:([\s\S]*?)(?=TRADUCTION:|$)/);
                const translationMatch = block.match(/TRADUCTION:([\s\S]*?)(?=Image \d+:|$)/);

                metadata[title] = {
                    dialogue: dialogueMatch ? dialogueMatch[1].trim() : undefined,
                    translation: translationMatch ? translationMatch[1].trim() : undefined
                };
            }
        });
    }

    return { promptLines, metadata };
  }, [prompt]);

  const handleCopy = (index: number, text: string) => {
    // Remove the "Image X: " prefix for cleaner copying of just the prompt content
    const cleanText = text.replace(/^Image \d+:\s*/i, '');
    
    navigator.clipboard.writeText(cleanText).then(() => {
        setCopiedPanel(index);
        setTimeout(() => setCopiedPanel(null), 2000);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
    });
  };

  const handleCopyAll = () => {
    if (!parsedContent) return;
    const allPrompts = parsedContent.promptLines
      .map(line => line.fullLine.replace(line.title + ':', '').trim())
      .join('\n');
    
    navigator.clipboard.writeText(allPrompts).then(() => {
        setCopiedPanel(-1); // Use -1 to represent "All"
        setTimeout(() => setCopiedPanel(null), 2000);
    }).catch(err => {
        console.error("Failed to copy all text: ", err);
    });
  };

  if (!parsedContent || parsedContent.promptLines.length === 0) {
    // Fallback if parsing fails totally (e.g. error message or raw text)
    if (prompt && !prompt.includes('Image')) {
        return (
             <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-4">
                 <h3 className="text-xl font-semibold text-sky-400 mb-2">Page {pageNumber} (Raw Output)</h3>
                 <pre className="text-slate-300 whitespace-pre-wrap">{prompt}</pre>
             </div>
        )
    }
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-4 bg-slate-800/50 hover:bg-slate-700/50 transition duration-200"
        aria-expanded={isExpanded}
      >
        <h3 className="text-xl font-semibold text-sky-400">Page {pageNumber}</h3>
        <i className={`fas fa-chevron-down transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-6">
          
          {/* Section 1: Prompts */}
          <div className="space-y-3">
             <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Prompts de Génération (Anglais)</h4>
                <button 
                    onClick={handleCopyAll}
                    className={`text-xs font-semibold py-1.5 px-3 rounded-md transition duration-200 flex items-center gap-2 border ${
                        copiedPanel === -1
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                    <i className={`fas ${copiedPanel === -1 ? 'fa-check' : 'fa-copy'}`}></i>
                    {copiedPanel === -1 ? 'Tout Copié' : 'Tout Copier'}
                </button>
             </div>

             {parsedContent.promptLines.map((line, index) => (
                <div key={index} className="group relative">
                    <div className="bg-black/30 rounded-md border border-slate-700 p-3 pr-24 font-mono text-sm text-green-400 break-all">
                        <span className="text-slate-500 select-none mr-2">{line.title}:</span>
                        {line.fullLine.replace(line.title + ':', '').trim()}
                    </div>
                    <button
                        onClick={() => handleCopy(index, line.fullLine)}
                        className={`absolute top-2 right-2 text-xs font-semibold py-1.5 px-3 rounded-md transition duration-200 flex items-center gap-2 shadow-sm ${
                        copiedPanel === index 
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-sky-300'
                        }`}
                    >
                        <i className={`fas ${copiedPanel === index ? 'fa-check' : 'fa-copy'}`}></i>
                        {copiedPanel === index ? 'Copié' : 'Copier'}
                    </button>
                </div>
             ))}
          </div>

          {/* Section 2: Metadata (Dialogues & Translations) */}
          <div className="space-y-4 pt-4 border-t border-slate-700">
             <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Dialogues & Traductions (Français)</h4>
             {parsedContent.promptLines.map((line, index) => {
                 const meta = parsedContent.metadata[line.title];
                 if (!meta) return null;
                 
                 return (
                    <div key={index} className="bg-slate-900/40 rounded-lg p-4 border border-slate-800">
                        <h5 className="text-sky-300 font-semibold mb-2">{line.title}</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Translation */}
                            <div>
                                <h6 className="text-xs text-purple-400 font-bold mb-1">TRADUCTION</h6>
                                <p className="text-slate-300 text-sm italic leading-relaxed">
                                    {meta.translation || "Aucune traduction disponible."}
                                </p>
                            </div>

                            {/* Dialogue */}
                            <div>
                                <h6 className="text-xs text-teal-400 font-bold mb-1">DIALOGUE</h6>
                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {meta.dialogue || "Pas de dialogue."}
                                </p>
                            </div>
                        </div>
                    </div>
                 );
             })}
          </div>

        </div>
      )}
    </div>
  );
};

export default GeneratedPage;
