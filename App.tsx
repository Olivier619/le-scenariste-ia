
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { Character, Story, StoryData } from './types';
import ComicPromptForm from './components/ComicPromptForm';
import PromptOutput from './components/PromptOutput';
import StoryManager from './components/StoryManager';
import { generateComicPrompts } from './services/aiService';
import LoadingSpinner from './components/LoadingSpinner';

const LOCAL_STORAGE_KEY = 'le-scenariste-ia-stories-v1';

const makeInitialCharacters = (): Character[] => [{ id: Date.now(), description: '', imageUrl: '' }];

const makeInitialStoryData = (): StoryData => ({
  globalScenario: '',
  scenario: '',
  numImages: 3,
  characters: makeInitialCharacters(),
  settings: '',
  settingsImageUrl: '',
  styleReferences: '',
  styleReferencesImageUrl: '',
  generatedPages: [],
});

const WelcomePrompt = () => (
  <div className="bg-slate-800/50 border border-sky-900 rounded-lg p-6 mb-12 shadow-inner">
    <h2 className="text-2xl font-bold text-sky-400 mb-3">Bienvenue sur Le Scénariste IA !</h2>
    <p className="text-slate-300 mb-4">
      Cet outil est conçu pour vous aider à générer des prompts de bande dessinée structurés et détaillés pour les IA de génération d'images.
    </p>
    <h3 className="text-lg font-semibold text-white mb-2">Fonctionnalités principales :</h3>
    <ul className="list-none space-y-2 text-slate-300 mb-4 pl-2">
      <li className="flex items-start"><i className="fas fa-check-circle text-sky-400 mt-1 mr-3"></i><span>Saisissez le <strong>scénario d'ensemble</strong> pour donner un contexte global à votre histoire.</span></li>
      <li className="flex items-start"><i className="fas fa-check-circle text-sky-400 mt-1 mr-3"></i><span>Définissez le <strong>scénario spécifique</strong> de la planche que vous souhaitez créer.</span></li>
      <li className="flex items-start"><i className="fas fa-check-circle text-sky-400 mt-1 mr-3"></i><span>Paramétrez le <strong>nombre de cases</strong> (1 à 10) pour adapter la mise en page.</span></li>
      <li className="flex items-start"><i className="fas fa-check-circle text-sky-400 mt-1 mr-3"></i><span>Décrivez vos <strong>personnages</strong> et <strong>décors</strong>, en ajoutant des URLs d'images de référence pour une meilleure cohérence visuelle.</span></li>
      <li className="flex items-start"><i className="fas fa-check-circle text-sky-400 mt-1 mr-3"></i><span>Ajoutez des <strong>références de style</strong> textuelles et visuelles pour définir l'ambiance.</span></li>
      <li className="flex items-start"><i className="fas fa-check-circle text-sky-400 mt-1 mr-3"></i><span>Obtenez des <strong>prompts détaillés en anglais et français</strong> pour chaque case, prêts à être utilisés.</span></li>
    </ul>
    <p className="text-slate-300 mb-4">
      Chaque prompt généré est structuré pour inclure : <strong>personnage et action</strong>, <strong>progression narrative</strong>, <strong>plan et cadre</strong>, ainsi que <strong>style et ambiance</strong>.
    </p>
    <p className="font-semibold text-sky-300">
      Commencez dès maintenant en remplissant les champs ci-dessous pour donner vie à votre première planche !
    </p>
  </div>
);


const App: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewStory = useCallback(() => {
    setStories(prev => {
      const newStory: Story = {
        id: `story-${Date.now()}`,
        name: `Nouvelle Histoire ${prev.length + 1}`,
        lastModified: Date.now(),
        data: makeInitialStoryData(),
      };
      setActiveStoryId(newStory.id);
      return [...prev, newStory];
    });
  }, []);

  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState.stories && savedState.stories.length > 0 && savedState.activeStoryId) {
          setStories(savedState.stories);
          setActiveStoryId(savedState.activeStoryId);
        } else {
          handleNewStory();
        }
      } else {
        handleNewStory();
      }
    } catch (err) {
      console.error("Failed to load state from localStorage:", err);
      handleNewStory();
    }
    setIsInitialLoad(false);
  }, [handleNewStory]);

  useEffect(() => {
    if (isInitialLoad) return;
    const stateToSave = { stories, activeStoryId };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [stories, activeStoryId, isInitialLoad]);

  const activeStory = useMemo(() => stories.find(s => s.id === activeStoryId), [stories, activeStoryId]);

  const updateActiveStoryData = useCallback((updates: Partial<StoryData>) => {
    if (!activeStoryId) return;
    setStories(prevStories => prevStories.map(story =>
      story.id === activeStoryId
        ? { ...story, data: { ...story.data, ...updates }, lastModified: Date.now() }
        : story
    ));
  }, [activeStoryId]);

  const handleLoadStory = (id: string) => {
    setActiveStoryId(id);
  };

  const handleDeleteStory = (id: string) => {
    const storyToDeleteIndex = stories.findIndex(s => s.id === id);
    if (storyToDeleteIndex === -1) return;

    const newStories = stories.filter(s => s.id !== id);
    setStories(newStories);

    if (activeStoryId === id) {
      if (newStories.length > 0) {
        const newActiveIndex = Math.max(0, storyToDeleteIndex - 1);
        setActiveStoryId(newStories[newActiveIndex].id);
      } else {
        handleNewStory();
      }
    }
  };

  const handleRenameStory = (id: string, newName: string) => {
    setStories(prev => prev.map(s => s.id === id ? { ...s, name: newName, lastModified: Date.now() } : s));
  };


  const handleGenerate = useCallback(async () => {
    if (!activeStory) return;

    setIsLoading(true);
    setError(null);

    if (!activeStory.data.scenario.trim()) {
      setError("Le champ 'Scénario de la Planche' est obligatoire.");
      setIsLoading(false);
      return;
    }

    const filledCharacters = activeStory.data.characters.filter(c => c.description.trim() !== '' || c.imageUrl?.trim() !== '');

    try {
      const result = await generateComicPrompts({
        ...activeStory.data,
        characters: filledCharacters,
        previousPages: activeStory.data.generatedPages,
      });
      updateActiveStoryData({
        generatedPages: [...activeStory.data.generatedPages, result],
        scenario: '' // Clear scenario for the next page
      });
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(`Une erreur est survenue: ${e.message}`);
      } else {
        setError("Une erreur inconnue est survenue.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeStory, updateActiveStoryData]);


  if (isInitialLoad || !activeStory) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8 relative">
          <h1 className="text-4xl sm:text-5xl font-bold text-sky-400">Le Scénariste <span className="text-white">IA</span></h1>
          <p className="text-slate-400 mt-2 text-lg">Générez des prompts de bande dessinée structurés pour l'IA</p>
          <div className="absolute top-0 right-0 mt-2">
            <StoryManager
              stories={stories}
              activeStoryId={activeStoryId}
              activeStoryName={activeStory.name}
              onNewStory={handleNewStory}
              onLoadStory={handleLoadStory}
              onDeleteStory={handleDeleteStory}
              onRenameStory={handleRenameStory}
            />
          </div>
        </header>

        <main className="space-y-12">
          <WelcomePrompt />
          <ComicPromptForm
            globalScenario={activeStory.data.globalScenario}
            setGlobalScenario={value => updateActiveStoryData({ globalScenario: value })}
            scenario={activeStory.data.scenario}
            setScenario={value => updateActiveStoryData({ scenario: value })}
            numImages={activeStory.data.numImages}
            setNumImages={value => updateActiveStoryData({ numImages: value })}
            characters={activeStory.data.characters}
            setCharacters={value => updateActiveStoryData({ characters: value })}
            settings={activeStory.data.settings}
            setSettings={value => updateActiveStoryData({ settings: value })}
            settingsImageUrl={activeStory.data.settingsImageUrl}
            setSettingsImageUrl={value => updateActiveStoryData({ settingsImageUrl: value })}
            styleReferences={activeStory.data.styleReferences}
            setStyleReferences={value => updateActiveStoryData({ styleReferences: value })}
            styleReferencesImageUrl={activeStory.data.styleReferencesImageUrl}
            setStyleReferencesImageUrl={value => updateActiveStoryData({ styleReferencesImageUrl: value })}
            onGenerate={handleGenerate}
            isLoading={isLoading}
          />
          <PromptOutput
            pages={activeStory.data.generatedPages}
            isLoading={isLoading}
            error={error}
          />
        </main>

        <footer className="text-center mt-12 text-slate-500 text-sm">
          <p>Powered by Perplexity AI. Version 1.4</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
