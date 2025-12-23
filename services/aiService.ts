
import type { GeminiRequestPayload } from '../types';

const API_KEY = process.env.PERPLEXITY_API_KEY;
const API_URL = 'https://api.perplexity.ai/chat/completions';
const MODEL = 'sonar-pro'; // Vous pouvez ajuster le modèle ici (ex: sonar, sonar-pro)

function buildPrompt(payload: GeminiRequestPayload): string {
    const { globalScenario, scenario, numImages, characters, settings, settingsImageUrl, styleReferences, previousPages } = payload;

    const characterDescriptions = characters.length > 0
        ? characters.map((c, i) => `Character ${i + 1} (Reference URL: ${c.imageUrl || 'None'}):\n${c.description}`).join('\n\n')
        : "No characters provided. Invent the necessary characters for the scenario.";
    
    const settingsDescription = settings.trim()
        ? `${settings}\n(Reference URL: ${settingsImageUrl || 'None'})`
        : "No setting provided. Invent the necessary setting(s) for the scenario.";
    
    const styleReferencesDescription = styleReferences.trim()
        ? `${styleReferences}`
        : "No style reference provided. Invent a coherent artistic style for the scenario.";

    const globalScenarioContext = globalScenario.trim()
        ? `### Overall Story Scenario (for context and consistency):\n${globalScenario}\n\n`
        : '';
        
    const previousPagesContext = previousPages && previousPages.length > 0
        ? `### PREVIOUSLY GENERATED PAGES (for context and consistency):\n${previousPages.join('\n\n---\n\n')}\n\n`
        : '';

    return `
You are "The Scenarist," an AI expert in visual storytelling for comic books. Your mission is to translate a scenario into a series of image generation prompts.

## NARRATIVE CONTEXT PROVIDED BY THE USER

${globalScenarioContext}${previousPagesContext}### Specific Scenario for this Page:
${scenario}

### Number of images to generate for this sequence:
${numImages}

### Character Descriptions & Reference URLs:
${characterDescriptions}

### Recurring Settings Descriptions & Reference URL:
${settingsDescription}

### Visual and Stylistic References:
${styleReferencesDescription}

## IMPERATIVE INSTRUCTIONS

1.  **Aspect Ratio Rules (--ar)**:
    Use these aspect ratios based on the total number of images:
    - 1 Image: --ar 2:3
    - 2 Images: --ar 4:3
    - 3 Images: --ar 2:1
    - 4 Images: --ar 2:3
    - 5-6 Images: --ar 1:1
    - 7-8 Images: --ar 4:3
    - 9 Images: --ar 2:3
    - 10 Images: --ar 5:3

2.  **English Prompt Construction**: 
    Create a detailed visual description in ENGLISH for each image. 
    - Describe action, character details, camera shot, lighting, and style.

3.  **Strict Output Structure**:
    You must output two distinct sections.

    **SECTION 1: THE PROMPTS LIST**
    List each prompt on a SINGLE LINE formatted EXACTLY like this:
    \`Image [N]: [English Prompt] --ar [Ratio] --oref [URL]\`
    
    *   **--oref [URL]**: MANDATORY IF A URL EXISTS. If the panel depicts a Character or Setting that has a provided "Reference URL" in the context above, you MUST append \`--oref [THE_URL]\` to the end of the line.
    *   If multiple references apply (e.g., character and setting), prioritize the Character's URL.
    *   Do not break lines within a prompt. 

    **SECTION 2: FRENCH METADATA**
    After all prompts are listed, add a separator line \`__METADATA_SECTION__\` and then list the French content for each image.
    
    Format for Section 2:
    Image [N]:
    DIALOGUE: [French dialogue / Text bubbles / Onomatopoeia]
    TRADUCTION: [French translation of the English prompt]

## TASK
Generate the response now adhering strictly to the single-line prompt format followed by the metadata section.
`;
}

export const generateComicPrompts = async (payload: GeminiRequestPayload): Promise<string> => {
    if (!API_KEY) {
        throw new Error("PERPLEXITY_API_KEY environment variable not set");
    }

    const textPrompt = buildPrompt(payload);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional comic book scriptwriter and prompt engineer.'
                    },
                    {
                        role: 'user',
                        content: textPrompt
                    }
                ],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Error calling Perplexity API:", error);
        throw new Error("Failed to generate prompts from Perplexity API.");
    }
};
