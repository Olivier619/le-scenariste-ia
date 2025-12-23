
export interface Character {
  id: number;
  description: string;
  imageUrl?: string;
}

export interface GeminiRequestPayload {
    globalScenario: string;
    scenario: string;
    numImages: number;
    characters: Character[];
    settings: string;
    settingsImageUrl?: string;
    styleReferences: string;
    styleReferencesImageUrl?: string;
    previousPages?: string[];
}

export interface StoryData {
  globalScenario: string;
  scenario: string;
  numImages: number;
  characters: Character[];
  settings: string;
  settingsImageUrl: string;
  styleReferences: string;
  styleReferencesImageUrl: string;
  generatedPages: string[];
}

export interface Story {
  id: string;
  name: string;
  lastModified: number;
  data: StoryData;
}
