
import React, { useState } from 'react';
import { ScreenAnalysis, AnalysisStatus } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ScreenAnalysisCardProps {
  analysis: ScreenAnalysis;
  onAnalyze: (id: string) => void;
  onDelete: (id: string) => void;
  isApiKeyConfigured: boolean;
}

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.24.03 3.22.077m3.22-.077L10.879 3.28a2.25 2.25 0 0 1 2.244-2.077h.093c.956 0 1.853.485 2.345 1.249l.287.47ZM8.625 12.75a.75.75 0 0 0-.75.75v3.375c0 .414.336.75.75.75h6.75a.75.75 0 0 0 .75-.75v-3.375a.75.75 0 0 0-.75-.75H8.625Z" />
  </svg>
);

const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
  </svg>
);


const ScreenAnalysisCard: React.FC<ScreenAnalysisCardProps> = ({ analysis, onAnalyze, onDelete, isApiKeyConfigured }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = () => {
    switch (analysis.status) {
      case AnalysisStatus.PENDING: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case AnalysisStatus.ANALYZING: return 'bg-sky-500/20 text-sky-400 border-sky-500 animate-pulse';
      case AnalysisStatus.COMPLETED: return 'bg-green-500/20 text-green-400 border-green-500';
      case AnalysisStatus.ERROR: return 'bg-red-500/20 text-red-400 border-red-500';
      default: return 'bg-slate-600/20 text-slate-400 border-slate-500';
    }
  };
  
  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click/toggle when deleting
    if (window.confirm(`Are you sure you want to delete the analysis for "${analysis.screenName}"?`)) {
      onDelete(analysis.id);
    }
  };

  return (
    <div className="bg-slate-800 shadow-xl rounded-lg overflow-hidden ring-1 ring-slate-700 transition-all duration-300 hover:ring-sky-500">
      <div 
        className="p-4 md:p-6 cursor-pointer"
        onClick={toggleExpand}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpand(); }}
        aria-expanded={isExpanded}
        aria-controls={`analysis-details-${analysis.id}`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
          <h3 className="text-xl font-semibold text-sky-300 mr-4 truncate" title={analysis.screenName}>
            {analysis.screenName}
          </h3>
          <div className={`text-xs font-medium px-3 py-1 rounded-full border ${getStatusColor()}`}>
            {analysis.status.toUpperCase()}
          </div>
        </div>
        
        <div className="text-sm text-slate-400 mb-1 truncate" title={analysis.url}>
          URL: <span className="text-slate-300">{analysis.url || 'Not specified'}</span>
        </div>
        <div className="text-sm text-slate-400 mb-4">
          Added: <span className="text-slate-300">{new Date(analysis.timestamp).toLocaleString()}</span>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {analysis.screenshotPreviewUrl && (
            <img 
                src={analysis.screenshotPreviewUrl} 
                alt={`${analysis.screenName} preview`} 
                className="h-16 w-auto rounded border border-slate-600 object-cover" 
            />
          )}
          {analysis.status === AnalysisStatus.PENDING && (
            <button
              onClick={(e) => { e.stopPropagation(); onAnalyze(analysis.id); }}
              disabled={!isApiKeyConfigured}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:bg-slate-500 disabled:cursor-not-allowed"
              aria-label={`Analyze ${analysis.screenName}`}
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              Analyze
            </button>
          )}
          {analysis.status === AnalysisStatus.ANALYZING && <LoadingSpinner size="h-6 w-6" color="text-sky-400" />}

          <button 
            onClick={handleDelete}
            className="ml-auto sm:ml-0 px-3 py-2 bg-red-700/50 hover:bg-red-600 text-red-300 hover:text-red-100 text-xs font-medium rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            title="Delete Analysis"
            aria-label={`Delete analysis for ${analysis.screenName}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          <button 
            className="p-2 text-slate-400 hover:text-sky-400 transition-colors"
            title={isExpanded ? "Collapse details" : "Expand details"}
            aria-expanded={isExpanded}
            aria-controls={`analysis-details-${analysis.id}`}
            onClick={(e) => { e.stopPropagation(); toggleExpand();}} // Ensure toggleExpand is also called directly
            >
            {isExpanded ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div 
            id={`analysis-details-${analysis.id}`} 
            className="px-4 md:px-6 pb-6 pt-2 border-t border-slate-700 bg-slate-800/50"
        >
          {analysis.codeSnippet && (
            <div className="mb-4">
              <h4 className="text-md font-semibold text-slate-300 mb-2">Code Snippet ({analysis.codeLanguage || 'N/A'}):</h4>
              <pre className="bg-slate-900 p-3 rounded-md text-sm text-slate-300 max-h-60 overflow-auto custom-scrollbar whitespace-pre-wrap break-all">
                {analysis.codeSnippet}
              </pre>
            </div>
          )}

          {analysis.status === AnalysisStatus.COMPLETED && analysis.analysisReport && (
            <div>
              <h4 className="text-md font-semibold text-slate-300 mb-2">Analysis Report:</h4>
              <pre className="bg-slate-900 p-4 rounded-md text-sm text-slate-200 max-h-[60vh] overflow-auto custom-scrollbar whitespace-pre-wrap break-words">
                {analysis.analysisReport}
              </pre>
            </div>
          )}
          {analysis.status === AnalysisStatus.ERROR && analysis.error && (
            <div>
              <h4 className="text-md font-semibold text-red-400 mb-2">Error Details:</h4>
              <pre className="bg-red-900/30 p-3 rounded-md text-sm text-red-300 whitespace-pre-wrap break-all">
                {analysis.error}
              </pre>
            </div>
          )}
          {analysis.status !== AnalysisStatus.COMPLETED && analysis.status !== AnalysisStatus.ERROR && !analysis.analysisReport && (
             <p className="text-slate-500 text-sm italic">
                {analysis.status === AnalysisStatus.PENDING 
                  ? "Analysis not yet started." 
                  : "Analysis is in progress..."}
             </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ScreenAnalysisCard;
