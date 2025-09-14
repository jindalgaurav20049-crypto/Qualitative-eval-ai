import React, { useState, useCallback } from 'react';
import { UploadedFile, AnalysisResultData } from './types';
import { analyzeDocuments } from './services/geminiService';
import AnalysisResult from './components/AnalysisResult';
import Loader from './components/Loader';
import ProgressBar from './components/ProgressBar';
import { UploadCloudIcon, FileTextIcon, TrashIcon } from './components/icons';

// Declare pdfjsLib to be available globally from the script tag in index.html
declare const pdfjsLib: any;

const FILE_CATEGORIES = ['Annual Reports', 'Concall Transcripts', 'Other Documents'];

const initialFilesState: Record<string, UploadedFile[]> = FILE_CATEGORIES.reduce((acc, category) => {
  acc[category] = [];
  return acc;
}, {} as Record<string, UploadedFile[]>);


const App: React.FC = () => {
  const [files, setFiles] = useState<Record<string, UploadedFile[]>>(initialFilesState);
  const [companyName, setCompanyName] = useState<string>('');
  const [result, setResult] = useState<AnalysisResultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, category: string) => {
    if (!event.target.files) return;

    // Required configuration for pdf.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

    const processFile = (file: File): Promise<UploadedFile> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
          if (!e.target?.result) {
            return reject(new Error(`Failed to read file: ${file.name}`));
          }
          
          try {
            if (file.type === 'application/pdf') {
              const arrayBuffer = e.target.result as ArrayBuffer;
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              let fullText = '';
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n\n'; // Add space between pages
              }
              resolve({ name: file.name, content: fullText.trim() });
            } else { // Handle text/plain
              resolve({ name: file.name, content: e.target.result as string });
            }
          } catch (processingError) {
             console.error(`Error processing file ${file.name}:`, processingError);
             reject(new Error(`Could not process file: ${file.name}. It may be corrupted.`));
          }
        };

        reader.onerror = () => reject(reader.error || new Error(`Failed to read file: ${file.name}`));
        
        if (file.type === 'application/pdf') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
      });
    };

    const fileList = Array.from(event.target.files);
    const supportedFiles = fileList.filter(f => f.type === 'text/plain' || f.type === 'application/pdf');

    const unsupportedCount = fileList.length - supportedFiles.length;
    if (unsupportedCount > 0) {
        setError(`${unsupportedCount} file(s) were ignored. Only .txt and .pdf are supported.`);
    } else {
        setError(null);
    }
    
    if(supportedFiles.length === 0) return;

    setIsProcessingFiles(true);
    setUploadProgress(0);

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < supportedFiles.length; i++) {
        const file = supportedFiles[i];
        try {
            const processedFile = await processFile(file);
            newFiles.push(processedFile);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to process ${file.name}`;
            setError(prev => (prev ? `${prev}\n${errorMessage}` : errorMessage));
            console.error(err);
        }
        setUploadProgress(Math.round(((i + 1) / supportedFiles.length) * 100));
    }
      
    setFiles(prev => {
      const existingNames = new Set(prev[category].map(f => f.name));
      const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
      return {
          ...prev,
          [category]: [...prev[category], ...uniqueNewFiles],
      };
    });

    // Clear the input value to allow re-uploading the same file
    event.target.value = '';

    // Hide progress bar after a short delay to show 100% completion
    setTimeout(() => {
        setIsProcessingFiles(false);
    }, 1000);
  };

  const handleRemoveFile = (category: string, fileName: string) => {
    setFiles(prev => ({
        ...prev,
        [category]: prev[category].filter(f => f.name !== fileName)
    }));
  };

  const handleAnalyze = useCallback(async () => {
    if (companyName.trim() === '') {
      setError("Please enter the company name.");
      return;
    }
    
    setError(null);
    setIsLoading(true);
    setResult(null);
    try {
      const categorizedFiles = Object.entries(files).flatMap(([category, fileList]) => 
        fileList.map(file => ({ ...file, category }))
      );
      const analysisResult = await analyzeDocuments(categorizedFiles, companyName);
      setResult(analysisResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during analysis.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [files, companyName]);
  
  const handleReset = () => {
    setFiles(initialFilesState);
    setCompanyName('');
    setResult(null);
    setError(null);
    setIsLoading(false);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return <Loader />;
    }
    if (result) {
      return <AnalysisResult result={result} onReset={handleReset}/>;
    }

    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-center text-brand-text mb-2">Start Your Analysis</h2>
          <p className="text-center text-gray-500 mb-6">Enter a company name to start. You can optionally upload documents for a deeper analysis.</p>

          <div className="mb-6">
              <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
              </label>
              <input
                  type="text"
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Apple Inc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white text-gray-900"
                  required
              />
          </div>

          {isProcessingFiles && (
            <div className="mb-4 animate-fade-in">
                <p className="text-sm font-medium text-gray-600 mb-2">Processing files...</p>
                <ProgressBar progress={uploadProgress} />
            </div>
           )}
          
          <div className="space-y-6">
            {FILE_CATEGORIES.map((category) => (
                <div key={category}>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{category} (Optional)</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                        <UploadCloudIcon className="mx-auto h-10 w-10 text-gray-400" />
                        <label 
                            htmlFor={`file-upload-${category}`} 
                            className="mt-3 inline-block bg-white hover:bg-gray-50 text-brand-secondary font-semibold py-2 px-4 rounded-lg cursor-pointer border border-gray-300 shadow-sm text-sm"
                        >
                            Upload for {category}
                        </label>
                        <input id={`file-upload-${category}`} name={`file-upload-${category}`} type="file" className="sr-only" multiple accept=".txt,.pdf" onChange={(e) => handleFileUpload(e, category)} />
                        <p className="mt-2 text-xs text-gray-500">.txt and .pdf files only</p>
                    </div>
                    {files[category].length > 0 && (
                        <ul className="mt-4 space-y-2">
                        {files[category].map((file, index) => (
                            <li key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg animate-fade-in">
                                <div className="flex items-center min-w-0">
                                <FileTextIcon className="h-6 w-6 text-brand-secondary mr-3 flex-shrink-0"/>
                                <span className="text-sm font-medium text-brand-text truncate" title={file.name}>{file.name}</span>
                                </div>
                                <button onClick={() => handleRemoveFile(category, file.name)} className="text-gray-500 hover:text-red-500 ml-2">
                                <TrashIcon className="h-5 w-5"/>
                                </button>
                            </li>
                        ))}
                        </ul>
                    )}
                </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={handleAnalyze} 
              disabled={isLoading || companyName.trim() === ''} 
              className="w-full sm:w-auto bg-brand-accent hover:opacity-90 text-brand-text font-bold py-3 px-10 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Analyzing...' : 'Qualitative Evaluation'}
            </button>
          </div>

          {error && <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <header className="bg-brand-primary shadow-md">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">Qualitative Investment Analyst AI</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 sm:py-12">
        {renderContent()}
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Powered by Google Gemini. For informational purposes only.</p>
      </footer>
    </div>
  );
};

export default App;