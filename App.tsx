
import React, { useState, useEffect, useCallback } from 'react';
import { ScreenAnalysis, AnalysisStatus } from './types';
import ScreenInputForm from './components/ScreenInputForm';
import ScreenAnalysisCard from './components/ScreenAnalysisCard';
import { analyzeScreenWithGemini } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';

const App: React.FC = () => {
  const [analyses, setAnalyses] = useState<ScreenAnalysis[]>([]);
  const [apiKeyStatus, setApiKeyStatus] = useState<{configured: boolean, message: string}>({configured: false, message: 'Checking API Key...'});

  useEffect(() => {
    // API Key check using Vite's import.meta.env
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      setApiKeyStatus({configured: true, message: 'API Key is configured.'});
    } else {
      setApiKeyStatus({configured: false, message: 'Error: Gemini API Key (VITE_GEMINI_API_KEY) is not configured in your .env file. Analysis will not work.'});
      console.error("CRITICAL: VITE_GEMINI_API_KEY is not set. Please configure it in your .env file (e.g., VITE_GEMINI_API_KEY=YOUR_KEY_HERE) and restart the dev server.");
    }

    // Load analyses from local storage
    const storedAnalyses = localStorage.getItem('screenAnalyses');
    if (storedAnalyses) {
      try {
        const parsedAnalyses: ScreenAnalysis[] = JSON.parse(storedAnalyses);
        setAnalyses(parsedAnalyses);
      } catch (error) {
        console.error("Failed to load analyses from local storage:", error);
        localStorage.removeItem('screenAnalyses'); // Clear corrupted data
      }
    }
  }, []);

  useEffect(() => {
    if (analyses.length > 0) {
        localStorage.setItem('screenAnalyses', JSON.stringify(analyses));
    } else {
        localStorage.removeItem('screenAnalyses');
    }
  }, [analyses]);

  const addScreenAnalysis = useCallback(async (data: Omit<ScreenAnalysis, 'id' | 'analysisReport' | 'status' | 'timestamp'> & { screenshotFile?: File }) => {
    let screenshotPreviewUrl: string | undefined = undefined;
    if (data.screenshotFile) {
      try {
        screenshotPreviewUrl = await fileToBase64(data.screenshotFile);
      } catch (error) {
        console.error("Error creating screenshot preview:", error);
      }
    }

    const newAnalysis: ScreenAnalysis = {
      ...data,
      id: Date.now().toString(),
      screenshotPreviewUrl,
      status: AnalysisStatus.PENDING,
      timestamp: Date.now(),
    };
    setAnalyses(prevAnalyses => [newAnalysis, ...prevAnalyses].sort((a, b) => b.timestamp - a.timestamp));
  }, []);

  const handleAnalyze = useCallback(async (analysisId: string) => {
    if (!apiKeyStatus.configured) {
      alert("Gemini API Key (VITE_GEMINI_API_KEY) is not configured. Cannot perform analysis.");
      return;
    }

    const analysisIndex = analyses.findIndex(a => a.id === analysisId);
    if (analysisIndex === -1) return;

    const analysisToUpdate = analyses[analysisIndex];

    setAnalyses(prev => prev.map(a => a.id === analysisId ? { ...a, status: AnalysisStatus.ANALYZING, error: undefined } : a));

    try {
      let screenshotBase64Data: string | undefined = undefined;
      if (analysisToUpdate.screenshotFile) {
        const fullBase64Url = await fileToBase64(analysisToUpdate.screenshotFile);
        screenshotBase64Data = fullBase64Url.split(',')[1]; 
      } else if (analysisToUpdate.screenshotPreviewUrl) {
         const parts = analysisToUpdate.screenshotPreviewUrl.split(',');
         if (parts.length === 2 && parts[0].includes('base64')) {
            screenshotBase64Data = parts[1];
         } else {
            console.warn("Screenshot preview URL for analysis was not a valid base64 data URL:", analysisToUpdate.screenshotPreviewUrl);
            // Attempt to re-use file if available and preview is bad - though ideally screenshotFile should be primary
         }
      }

      if (!screenshotBase64Data) {
        throw new Error("Screenshot data is missing or invalid. Please ensure a valid screenshot was uploaded.");
      }
      
      const report = await analyzeScreenWithGemini(
        screenshotBase64Data,
        analysisToUpdate.screenshotFile?.type || 'image/png', // Mime type
        analysisToUpdate.codeSnippet,
        analysisToUpdate.codeLanguage,
        analysisToUpdate.screenName,
        analysisToUpdate.url
      );
      setAnalyses(prev => prev.map(a => a.id === analysisId ? { ...a, status: AnalysisStatus.COMPLETED, analysisReport: report } : a));
    } catch (error: any) {
      console.error("Error during analysis:", error);
      setAnalyses(prev => prev.map(a => a.id === analysisId ? { ...a, status: AnalysisStatus.ERROR, error: error.message || 'Unknown error occurred' } : a));
    }
  }, [analyses, apiKeyStatus.configured]);

  const handleDeleteAnalysis = useCallback((analysisId: string) => {
    setAnalyses(prevAnalyses => prevAnalyses.filter(a => a.id !== analysisId));
  }, []);
  
  const handleClearAllAnalyses = useCallback(() => {
    if (window.confirm("Are you sure you want to delete all analyses? This action cannot be undone.")) {
        setAnalyses([]);
        localStorage.removeItem('screenAnalyses');
    }
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-slate-100 p-4 md:p-8 selection:bg-sky-500 selection:text-white">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-sky-400">UI Refinement Assistant</h1>
        <p className="mt-2 text-slate-400 text-lg">Leverage Gemini API to analyze and improve your web UIs.</p>
        <div className={`mt-4 p-3 rounded-md text-sm ${apiKeyStatus.configured ? 'bg-green-700/50 text-green-300' : 'bg-red-700/50 text-red-300'}`}>
          {apiKeyStatus.message}
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <section id="add-analysis" className="mb-12 bg-slate-800 shadow-2xl rounded-lg p-6 md:p-8 ring-1 ring-slate-700">
          <h2 className="text-2xl font-semibold mb-6 text-sky-400 border-b border-slate-700 pb-3">Add New Screen for Analysis</h2>
          <ScreenInputForm onSubmit={addScreenAnalysis} disabled={!apiKeyStatus.configured} />
        </section>

        <section id="analysis-results">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-3">
            <h2 className="text-2xl font-semibold text-sky-400">Analysis History</h2>
            {analyses.length > 0 && (
                <button
                onClick={handleClearAllAnalyses}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                Clear All
                </button>
            )}
          </div>
          {analyses.length === 0 ? (
            <p className="text-center text-slate-500 py-10 text-lg">No analyses yet. Add a screen above to get started.</p>
          ) : (
            <div className="space-y-6">
              {analyses.map(analysis => (
                <ScreenAnalysisCard 
                  key={analysis.id} 
                  analysis={analysis} 
                  onAnalyze={handleAnalyze} 
                  onDelete={handleDeleteAnalysis}
                  isApiKeyConfigured={apiKeyStatus.configured}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="text-center mt-12 py-6 border-t border-slate-700">
        <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} UI Refinement Assistant. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
