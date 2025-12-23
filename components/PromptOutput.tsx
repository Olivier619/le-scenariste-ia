
import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import GeneratedPage from './GeneratedPage';

interface PromptOutputProps {
  pages: string[];
  isLoading: boolean;
  error: string | null;
}

const PromptOutput: React.FC<PromptOutputProps> = ({ pages, isLoading, error }) => {
  const renderContent = () => {
    // Initial loading state
    if (isLoading && pages.length === 0) {
      return <LoadingSpinner />;
    }
    // Any error state
    if (error) {
      return <ErrorMessage message={error} />;
    }
    // Initial empty state
    if (pages.length === 0) {
      return (
        <div className="text-center text-slate-500 p-8 border-2 border-dashed border-slate-700 rounded-lg">
          <p>Les prompts générés pour chaque page apparaîtront ici.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {pages.map((page, index) => (
          <GeneratedPage
            key={index}
            pageNumber={index + 1}
            prompt={page}
            isInitiallyExpanded={index === pages.length - 1} // Expand the last one
          />
        ))}
        {/* Loading state for subsequent pages */}
        {isLoading && pages.length > 0 && (
           <div className="flex items-center justify-center p-4 text-slate-400">
             <svg className="animate-spin h-6 w-6 text-sky-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Génération de la page suivante...</span>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Pages de Prompts Générées</h2>
      <div className="bg-slate-800/50 rounded-lg shadow-inner p-4 min-h-[200px]">
        {renderContent()}
      </div>
    </div>
  );
};

export default PromptOutput;
