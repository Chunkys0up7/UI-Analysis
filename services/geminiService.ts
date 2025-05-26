
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";

// IMPORTANT: This service relies on import.meta.env.VITE_GEMINI_API_KEY being set in the .env file.
// It will throw an error if the key is not available.

const getGenAI = () => {
  // Access the API key using Vite's import.meta.env
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini API Key (VITE_GEMINI_API_KEY) is not configured in your .env file.");
    throw new Error("Gemini API Key is not configured. Please set the VITE_GEMINI_API_KEY environment variable in your .env file (e.g., VITE_GEMINI_API_KEY=YOUR_KEY_HERE) and restart the dev server.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeScreenWithGemini = async (
  screenshotBase64: string,
  screenshotMimeType: string,
  codeSnippet?: string,
  codeLanguage?: string,
  screenName?: string,
  url?: string
): Promise<string> => {
  const ai = getGenAI(); // This will now use import.meta.env internally
  
  const imagePart: Part = {
    inlineData: {
      mimeType: screenshotMimeType,
      data: screenshotBase64,
    },
  };

  let promptText = `You are an expert UI/UX designer and frontend developer.
Analyze the provided UI screenshot${codeSnippet ? " AND the accompanying code snippet" : ""}.
Screen Name: "${screenName || 'N/A'}"
Intended URL: "${url || 'N/A'}"

Please provide a comprehensive review in Markdown format. If code is provided, assume it's ${codeLanguage || 'related to the UI'}.

Your analysis should cover the following aspects:

1.  **Overall UI/UX Impression**:
    *   First glance thoughts.
    *   Clarity of purpose and primary actions.
    *   Visual appeal and coherence.

2.  **Layout and Composition**:
    *   Balance and alignment of elements.
    *   Visual hierarchy (are important elements prominent?).
    *   Use of whitespace and spacing.
    *   Responsiveness considerations (potential issues on different screen sizes based on the visual).

3.  **Visual Design**:
    *   Color palette (effectiveness, contrast, accessibility).
    *   Typography (readability, hierarchy, consistency).
    *   Iconography and imagery (clarity, relevance).

4.  **Usability and Interaction**:
    *   Intuitiveness of navigation and controls.
    *   Clarity of calls to action.
    *   Feedback mechanisms (if discernible).
    *   Potential friction points for users.

5.  **Accessibility (Visual)**:
    *   Sufficient color contrast for text and interactive elements.
    *   Legibility of font sizes.
    *   Adequate touch target sizes for interactive elements (if applicable).

${codeSnippet ? `
6.  **Code Review (${codeLanguage || 'N/A'})**:
    *   Code Structure and Readability: Is it well-organized, easy to understand?
    *   React/Tailwind Best Practices (if TSX/JSX with Tailwind): Component design, props, state, utility class usage.
    *   Efficiency and Potential Issues: Any obvious performance concerns or anti-patterns?
    *   Semantic HTML (if applicable).
    *   How well does the code seem to implement the visual design?

7.  **Actionable Improvement Suggestions**:
    *   Provide specific, concrete recommendations for UI/UX enhancements.
    *   Suggest Tailwind CSS classes or structural changes if applicable.
    *   If code was provided, offer refactoring ideas or specific code improvements.
    *   Prioritize suggestions by impact.
` : `
6.  **Actionable Improvement Suggestions**:
    *   Provide specific, concrete recommendations for UI/UX enhancements.
    *   Suggest Tailwind CSS classes or structural changes if applicable for layout, spacing, typography, colors.
    *   Prioritize suggestions by impact.
`}

Format your response clearly using Markdown headings, bullet points, and code blocks (for Tailwind class suggestions or code examples, use \`\`\`css or \`\`\`tsx). Be constructive and detailed.
`;
  
  const parts: Part[] = [
    { text: promptText },
    imagePart,
  ];

  if (codeSnippet) {
    parts.push({ text: `\n\nCode Snippet (${codeLanguage || 'N/A'}):\n\`\`\`${codeLanguage || 'plaintext'}\n${codeSnippet}\n\`\`\`` });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17',
        contents: { parts: parts },
    });
    
    const analysisText = response.text;
    if (!analysisText) {
      throw new Error("Received an empty response from Gemini API.");
    }
    return analysisText;

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    // Check for specific error messages from the API or network
    if (error.message && error.message.toLowerCase().includes("api key not valid") || error.message.toLowerCase().includes("api_key_invalid")) {
        throw new Error("Gemini API Key is invalid. Please check your VITE_GEMINI_API_KEY in the .env file and restart the development server.");
    }
    if (error.message && error.message.includes("fetch")) { 
        throw new Error(`Network error while contacting Gemini API. Please check your internet connection and API endpoint. Details: ${error.message}`);
    }
    if (error.message && error.message.includes("model") && error.message.includes("not found")) {
        throw new Error(`The Gemini model specified is not found or not available. Details: ${error.message}`);
    }
    throw new Error(`Failed to get analysis from Gemini: ${error.message || 'Unknown API error'}`);
  }
};
