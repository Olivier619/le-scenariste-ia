
import React, { useState, useRef, useEffect } from 'react';
import type { Story } from '../types';

interface StoryManagerProps {
  stories: Story[];
  activeStoryId: string | null;
  activeStoryName: string;
  onNewStory: () => void;
  onLoadStory: (id: string) => void;
  onDeleteStory: (id: string) => void;
  onRenameStory: (id: string, newName: string) => void;
}

const StoryManager: React.FC<StoryManagerProps> = ({
  stories,
  activeStoryId,
  activeStoryName,
  onNewStory,
  onLoadStory,
  onDeleteStory,
  onRenameStory
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingName, setEditingName] = useState(activeStoryName);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditingName(activeStoryName);
  }, [activeStoryName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRename = () => {
    if (activeStoryId && editingName.trim()) {
      onRenameStory(activeStoryId, editingName.trim());
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleRename();
          e.currentTarget.blur();
      }
  };


  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-700 hover:bg-slate-600 text-sky-300 font-semibold py-2 px-4 rounded-md transition duration-200 text-sm flex items-center gap-2"
        title="Gérer les histoires"
      >
        <i className="fas fa-book"></i>
        <span>Mes Histoires</span>
        <i className={`fas fa-chevron-down transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 p-2">
          <div className="space-y-2">
            <div>
              <label htmlFor="storyName" className="block text-xs font-medium text-sky-300 mb-1">
                Histoire Actuelle
              </label>
              <input
                id="storyName"
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <hr className="border-slate-600" />
            
            <div className="max-h-48 overflow-y-auto pr-1">
                {stories.filter(s => s.id !== activeStoryId).sort((a,b) => b.lastModified - a.lastModified).map(story => (
                    <div key={story.id} className="group flex items-center justify-between text-sm p-2 rounded-md hover:bg-slate-700">
                        <button onClick={() => { onLoadStory(story.id); setIsOpen(false); }} className="flex-grow text-left truncate">
                            {story.name}
                        </button>
                        <button 
                            onClick={() => {
                                if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${story.name}" ?`)) {
                                    onDeleteStory(story.id)
                                }
                            }} 
                            className="ml-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Supprimer l'histoire"
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                ))}
            </div>

             {stories.length > 1 && <hr className="border-slate-600" />}

            <button
              onClick={() => { onNewStory(); setIsOpen(false); }}
              className="w-full text-sm bg-slate-700 hover:bg-slate-600 text-sky-300 font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2"
            >
              <i className="fas fa-plus"></i>
              Nouvelle Histoire
            </button>

            {stories.length > 1 && activeStoryId && (
                 <button 
                    onClick={() => {
                        if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${activeStoryName}" ? Cette action est irréversible.`)) {
                            onDeleteStory(activeStoryId);
                            setIsOpen(false);
                        }
                    }} 
                    className="w-full text-sm bg-red-900/50 hover:bg-red-900 text-red-300 font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 mt-1"
                >
                    <i className="fas fa-trash-alt"></i>
                    Supprimer l'Histoire Actuelle
                </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryManager;
