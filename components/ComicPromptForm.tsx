
import React from 'react';
import type { Character } from '../types';
import CharacterInput from './CharacterInput';

interface ComicPromptFormProps {
  globalScenario: string;
  setGlobalScenario: (value: string) => void;
  scenario: string;
  setScenario: (value: string) => void;
  numImages: number;
  setNumImages: (value: number) => void;
  characters: Character[];
  setCharacters: (characters: Character[]) => void;
  settings: string;
  setSettings: (value: string) => void;
  settingsImageUrl: string;
  setSettingsImageUrl: (value: string) => void;
  styleReferences: string;
  setStyleReferences: (value: string) => void;
  styleReferencesImageUrl: string;
  setStyleReferencesImageUrl: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const ComicPromptForm: React.FC<ComicPromptFormProps> = ({
  globalScenario,
  setGlobalScenario,
  scenario,
  setScenario,
  numImages,
  setNumImages,
  characters,
  setCharacters,
  settings,
  setSettings,
  settingsImageUrl,
  setSettingsImageUrl,
  styleReferences,
  setStyleReferences,
  styleReferencesImageUrl,
  setStyleReferencesImageUrl,
  onGenerate,
  isLoading,
}) => {
  const addCharacter = () => {
    setCharacters([...characters, { id: Date.now(), description: '', imageUrl: '' }]);
  };

  const removeCharacter = (id: number) => {
    if (characters.length > 1) {
      setCharacters(characters.filter((char) => char.id !== id));
    }
  };

  const updateCharacter = (id: number, newValues: Partial<Omit<Character, 'id'>>) => {
    setCharacters(
      characters.map((char) => (char.id === id ? { ...char, ...newValues } : char))
    );
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
      <div className="space-y-6">
        <div>
          <label htmlFor="globalScenario" className="block text-sm font-medium text-sky-300 mb-1">
            Scénario d'Ensemble (Contexte général)
          </label>
          <textarea
            id="globalScenario"
            rows={4}
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            placeholder="Décrivez l'histoire complète, les personnages principaux et l'arc narratif global. Ce texte servira de contexte pour assurer la cohérence entre les différentes planches."
            value={globalScenario}
            onChange={(e) => setGlobalScenario(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="scenario" className="block text-sm font-medium text-sky-300 mb-1">
            Scénario de la Planche (Action spécifique)
          </label>
          <textarea
            id="scenario"
            rows={5}
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            placeholder="Décrivez précisément l'action, les dialogues et les événements de CETTE planche. Soyez spécifique..."
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="numImages" className="block text-sm font-medium text-sky-300 mb-1">
            Nombre d'images / cases (1-10)
          </label>
          <input
            type="number"
            id="numImages"
            min="1"
            max="10"
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            value={numImages}
            onChange={(e) => setNumImages(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
          />
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-sky-300 mb-2">
            Personnages Principaux
          </h3>
          <div className="space-y-4">
            {characters.map((char, index) => (
              <CharacterInput
                key={char.id}
                character={char}
                onUpdate={updateCharacter}
                onRemove={removeCharacter}
                canRemove={characters.length > 1}
                index={index}
              />
            ))}
          </div>
          <button
            onClick={addCharacter}
            className="mt-4 text-sm bg-slate-700 hover:bg-slate-600 text-sky-300 font-semibold py-2 px-4 rounded-md transition duration-200 flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> Ajouter un personnage
          </button>
        </div>

        <div>
          <label htmlFor="settings" className="block text-sm font-medium text-sky-300 mb-1">
            Décors Récurrents
          </label>
          <textarea
            id="settings"
            rows={3}
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            placeholder="Ex: Une ruelle sombre et pluvieuse à néons, un laboratoire futuriste aseptisé..."
            value={settings}
            onChange={(e) => setSettings(e.target.value)}
          />
          <input
            type="url"
            id="settingsUrl"
            className="mt-2 w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            placeholder="URL d'image de référence pour le décor (optionnel)"
            value={settingsImageUrl}
            onChange={(e) => setSettingsImageUrl(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="style" className="block text-sm font-medium text-sky-300 mb-1">
            Références de Style (Textuelles)
          </label>
          <textarea
            id="style"
            rows={3}
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            placeholder="Ex: Style manga avec des lignes d'action dynamiques, couleurs pastel délavées, encrage épais de style comics américain..."
            value={styleReferences}
            onChange={(e) => setStyleReferences(e.target.value)}
          />
          <input
            type="url"
            id="styleUrl"
            className="mt-2 w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            placeholder="URL d'image de référence pour le style (optionnel)"
            value={styleReferencesImageUrl}
            onChange={(e) => setStyleReferencesImageUrl(e.target.value)}
          />
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center text-lg"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Génération en cours...
            </>
          ) : (
            'Générer les Prompts'
          )}
        </button>
      </div>
    </div>
  );
};

export default ComicPromptForm;
