
import React from 'react';
import type { Character } from '../types';

interface CharacterInputProps {
  character: Character;
  onUpdate: (id: number, newValues: Partial<Omit<Character, 'id'>>) => void;
  onRemove: (id: number) => void;
  canRemove: boolean;
  index: number;
}

const CharacterInput: React.FC<CharacterInputProps> = ({ character, onUpdate, onRemove, canRemove, index }) => {
  return (
    <div className="flex items-start space-x-2">
      <div className="flex-grow space-y-2">
        <textarea
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            rows={3}
            placeholder={`Description du Personnage ${index + 1}... (apparence, vêtements, etc.)`}
            value={character.description}
            onChange={(e) => onUpdate(character.id, { description: e.target.value })}
        />
        <input
            type="url"
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            placeholder={`URL d'image pour Personnage ${index + 1} (optionnel)`}
            value={character.imageUrl || ''}
            onChange={(e) => onUpdate(character.id, { imageUrl: e.target.value })}
        />
      </div>
      {canRemove && (
        <button
          onClick={() => onRemove(character.id)}
          className="bg-red-800 hover:bg-red-700 text-white font-bold p-2 rounded-md h-10 w-10 flex-shrink-0 flex items-center justify-center transition"
          aria-label="Remove character"
        >
          <i className="fas fa-trash"></i>
        </button>
      )}
    </div>
  );
};

export default CharacterInput;
