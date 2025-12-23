
import { GoogleGenAI, Part } from "@google/genai";
import type { GeminiRequestPayload } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Fetches an image from a URL and converts it into a GoogleGenAI.Part object.
 * @param url The URL of the image to fetch.
 * @returns A promise that resolves to a Part object or null if fetching fails.
 */
async function urlToGenerativePart(url: string): Promise<Part | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Failed to fetch image from ${url}: ${response.statusText}`);
            return null;
        }
        const blob = await response.blob();
        const mimeType = blob.type;
        if (!mimeType.startsWith('image/')) {
             console.warn(`URL ${url} is not an image (MIME type: ${mimeType})`);
             return null;
        }
        
        const base64data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        return {
            inlineData: {
                data: base64data,
                mimeType,
            },
        };
    } catch (error) {
        console.error(`Error fetching or converting image from ${url}:`, error);
        return null;
    }
}


function buildPrompt(payload: GeminiRequestPayload): string {
    const { globalScenario, scenario, numImages, characters, settings, settingsImageUrl, styleReferences, previousPages } = payload;

    // We include the URL in the text description so the LLM knows which URL belongs to which character for the --oref tag
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
    // 1. Build the text part of the prompt
    const textPrompt = buildPrompt(payload);
    const promptParts: Part[] = [{ text: textPrompt }];

    // 2. Collect all image URLs, filtering out any empty or null values
    const imageUrls = [
        ...payload.characters.map(c => c.imageUrl).filter(Boolean),
        payload.settingsImageUrl,
        payload.styleReferencesImageUrl
    ].filter(Boolean) as string[];

    // 3. Fetch and convert all images to GenerativeParts in parallel
    const imagePartsPromises = imageUrls.map(url => urlToGenerativePart(url));
    const resolvedImageParts = await Promise.all(imagePartsPromises);
    
    // 4. Add successfully fetched images to the prompt parts
    resolvedImageParts.forEach(part => {
        if (part) {
            promptParts.push(part);
        }
    });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: promptParts }, // Send multimodal content
            config: {
                temperature: 0.7, // Lower temperature for more structured adherence
                topP: 0.95,
            }
        });
        
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate prompts from Gemini API.");
    }
};
