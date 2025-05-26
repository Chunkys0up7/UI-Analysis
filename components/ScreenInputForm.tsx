
import React, { useState, useCallback } from 'react';
import { ScreenAnalysis } from '../types';

interface ScreenInputFormProps {
  onSubmit: (data: Omit<ScreenAnalysis, 'id' | 'analysisReport' | 'status' | 'timestamp'> & { screenshotFile?: File }) => void;
  disabled?: boolean;
}

const CodeUploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
  </svg>
);

const ImageUploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);


const ScreenInputForm: React.FC<ScreenInputFormProps> = ({ onSubmit, disabled }) => {
  const [screenName, setScreenName] = useState('');
  const [url, setUrl] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | undefined>(undefined);
  const [screenshotPreview, setScreenshotPreview] = useState<string | undefined>(undefined);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('tsx');
  const [error, setError] = useState<string | null>(null);

  const handleScreenshotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Screenshot file size should not exceed 5MB.');
        setScreenshotFile(undefined);
        setScreenshotPreview(undefined);
        event.target.value = ""; // Reset file input
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
        setError('Invalid file type. Please upload PNG, JPG, WEBP or GIF.');
        setScreenshotFile(undefined);
        setScreenshotPreview(undefined);
        event.target.value = ""; // Reset file input
        return;
      }
      
      setScreenshotFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        setScreenshotFile(undefined);
        setScreenshotPreview(undefined);
    }
  };

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (!screenName.trim()) {
      setError('Screen Name is required.');
      return;
    }
    if (!screenshotFile) {
      setError('Screenshot is required for analysis.');
      return;
    }
    setError(null);
    onSubmit({ screenName, url, screenshotFile, codeSnippet, codeLanguage });
    // Reset form
    setScreenName('');
    setUrl('');
    setScreenshotFile(undefined);
    setScreenshotPreview(undefined);
    setCodeSnippet('');
    setCodeLanguage('tsx');
    const fileInput = document.getElementById('screenshotFile') as HTMLInputElement;
    if(fileInput) fileInput.value = "";

  }, [screenName, url, screenshotFile, codeSnippet, codeLanguage, onSubmit]);

  const inputBaseClasses = "w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors text-slate-200 placeholder-slate-400";
  const labelBaseClasses = "block text-sm font-medium text-slate-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-3 bg-red-700/30 text-red-300 border border-red-600 rounded-md text-sm">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="screenName" className={labelBaseClasses}>Screen Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            id="screenName"
            value={screenName}
            onChange={(e) => setScreenName(e.target.value)}
            className={inputBaseClasses}
            placeholder="e.g., Login Page, User Dashboard"
            required
            disabled={disabled}
          />
        </div>
        <div>
          <label htmlFor="url" className={labelBaseClasses}>Screen URL (for reference)</label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputBaseClasses}
            placeholder="e.g., http://localhost:3000/login"
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <label htmlFor="screenshotFile" className={labelBaseClasses}>UI Screenshot <span className="text-red-400">*</span></label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md hover:border-sky-500 transition-colors">
          <div className="space-y-1 text-center">
            <ImageUploadIcon className="mx-auto h-12 w-12 text-slate-500" />
            <div className="flex text-sm text-slate-400">
              <label
                htmlFor="screenshotFile"
                className="relative cursor-pointer bg-slate-800 rounded-md font-medium text-sky-400 hover:text-sky-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 focus-within:ring-sky-500"
              >
                <span>Upload a file</span>
                <input id="screenshotFile" name="screenshotFile" type="file" className="sr-only" onChange={handleScreenshotChange} accept="image/png, image/jpeg, image/webp, image/gif" required disabled={disabled} />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-slate-500">PNG, JPG, GIF, WEBP up to 5MB</p>
          </div>
        </div>
        {screenshotPreview && (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-300 mb-1">Preview:</p>
            <img src={screenshotPreview} alt="Screenshot preview" className="max-h-48 rounded-md border border-slate-600" />
          </div>
        )}
      </div>
      
      <div>
        <label htmlFor="codeSnippet" className={labelBaseClasses}>Code Snippet (Optional)</label>
         <div className="flex items-center space-x-2 mb-2">
          <CodeUploadIcon className="h-5 w-5 text-slate-400" />
          <span className="text-sm text-slate-400">Paste relevant TSX, HTML, or JS code.</span>
        </div>
        <textarea
          id="codeSnippet"
          value={codeSnippet}
          onChange={(e) => setCodeSnippet(e.target.value)}
          rows={8}
          className={`${inputBaseClasses} font-mono text-sm`}
          placeholder="Paste your component code here..."
          disabled={disabled}
        />
      </div>
      <div>
        <label htmlFor="codeLanguage" className={labelBaseClasses}>Code Language (if snippet provided)</label>
        <select
          id="codeLanguage"
          value={codeLanguage}
          onChange={(e) => setCodeLanguage(e.target.value)}
          className={inputBaseClasses}
          disabled={disabled || !codeSnippet}
        >
          <option value="tsx">TypeScript (TSX)</option>
          <option value="jsx">JavaScript (JSX)</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
        </select>
      </div>

      <button 
        type="submit"
        disabled={disabled || !screenshotFile}
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
      >
        Add for Analysis
      </button>
    </form>
  );
};

export default ScreenInputForm;
    