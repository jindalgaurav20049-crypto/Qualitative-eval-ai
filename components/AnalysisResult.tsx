import React, { useState } from 'react';
import { AnalysisResultData, AnalysisSource, Sentiment } from '../types';
import { CheckCircleIcon, XCircleIcon, DownloadIcon, MinusCircleIcon } from './icons';

// Declare libraries loaded from CDN in index.html
declare const jspdf: any;
declare const html2canvas: any;

interface AnalysisResultProps {
  result: AnalysisResultData;
  onReset: () => void;
}

const verdictStyles = {
  green: 'bg-green-100 text-green-800 border-green-400',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-400',
  red: 'bg-red-100 text-red-800 border-red-400',
};

const sentimentStyles: Record<Sentiment, { icon: React.ReactNode, textClass: string }> = {
    Positive: { icon: <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />, textClass: 'text-green-700'},
    Negative: { icon: <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />, textClass: 'text-red-700'},
    Neutral: { icon: <MinusCircleIcon className="h-5 w-5 text-gray-500 mr-2" />, textClass: 'text-gray-700'},
};

const SentimentIndicator: React.FC<{ sentiment: Sentiment | undefined }> = ({ sentiment }) => {
    if (!sentiment || !sentimentStyles[sentiment]) {
        return null;
    }
    const { icon, textClass } = sentimentStyles[sentiment];
    return (
        <div className={`flex items-center text-sm font-semibold px-3 py-1 rounded-full bg-gray-100 ${textClass}`}>
            {icon}
            <span>{sentiment} Sentiment</span>
        </div>
    );
};

const parseAndLinkCitations = (text: string | undefined, sources: AnalysisSource[]) => {
    if (!text) return text;
    // Split by the citation pattern, keeping the delimiter
    const parts = text.split(/(\[\d+\])/g);
    
    return parts.map((part, index) => {
        const match = part.match(/\[(\d+)\]/);
        if (match) {
            const sourceNumber = parseInt(match[1], 10);
            if (sourceNumber > 0 && sourceNumber <= sources.length) {
                return (
                    <a 
                        key={index} 
                        href={`#source-${sourceNumber}`}
                        className="text-blue-600 font-bold hover:underline transition-all super text-xs mx-0.5 align-top"
                        title={`Go to source ${sourceNumber}: ${sources[sourceNumber-1].title}`}
                    >
                        [{sourceNumber}]
                    </a>
                );
            }
        }
        // Return plain text part, preserving whitespace
        return <React.Fragment key={index}>{part}</React.Fragment>;
    });
};

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string, titleAddon?: React.ReactNode }> = ({ title, children, className = '', titleAddon }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 break-inside-avoid ${className}`}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-brand-primary">{title}</h3>
            {titleAddon}
        </div>
        <div className="text-gray-700 space-y-3">{children}</div>
    </div>
);

const ManagementScorecard: React.FC<{ scorecard: AnalysisResultData['report']['managementEvaluation']['scorecard'], sources: AnalysisSource[] }> = ({ scorecard, sources }) => {
    if (!Array.isArray(scorecard) || scorecard.length === 0) {
        return <p className="text-gray-500">No scorecard data available.</p>;
    }
    const totalScore = scorecard.reduce((acc, item) => acc + (item.score * item.weight / 100), 0);
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-3 font-semibold text-sm text-gray-600">Criteria</th>
                        <th className="p-3 font-semibold text-sm text-gray-600 text-center">Score (/10)</th>
                        <th className="p-3 font-semibold text-sm text-gray-600 text-center">Weight</th>
                        <th className="p-3 font-semibold text-sm text-gray-600">Justification</th>
                    </tr>
                </thead>
                <tbody>
                    {scorecard.map((item) => (
                        <tr key={item.criteria} className="border-t border-gray-200">
                            <td className="p-3 font-medium text-gray-800">{item.criteria}</td>
                            <td className="p-3 text-center text-gray-600">{item.score}</td>
                            <td className="p-3 text-center text-gray-600">{item.weight}%</td>
                            <td className="p-3 text-sm text-gray-600 leading-relaxed">{parseAndLinkCitations(item.justification, sources)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-100 font-bold">
                    <tr>
                         <td colSpan={4} className="p-3 text-right text-brand-primary">
                            Weighted Score: {totalScore.toFixed(2)} / 10
                         </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    )
};

const PeerComparison: React.FC<{ peers: AnalysisResultData['report']['managementEvaluation']['peerComparison'], sources: AnalysisSource[] }> = ({ peers, sources }) => {
    if (!Array.isArray(peers) || peers.length === 0) {
        return <p className="text-gray-500">No peer comparison data available.</p>;
    }
    return (
    <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
                <tr>
                    <th className="p-3 font-semibold text-sm text-gray-600">Peer Company</th>
                    <th className="p-3 font-semibold text-sm text-gray-600 text-center">Mgmt. Score (/10)</th>
                    <th className="p-3 font-semibold text-sm text-gray-600">Notes</th>
                </tr>
            </thead>
            <tbody>
                {peers.map((peer) => (
                    <tr key={peer.peerName} className="border-t border-gray-200">
                        <td className="p-3 font-medium text-gray-800">{peer.peerName}</td>
                        <td className="p-3 text-center text-gray-600">{peer.managementScore}</td>
                        <td className="p-3 text-sm text-gray-600 leading-relaxed">{parseAndLinkCitations(peer.notes, sources)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)};


const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onReset }) => {
  const { report, sources } = result;
  const [isDownloading, setIsDownloading] = useState(false);
  
  if (!report) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600">Analysis Failed</h2>
        <p className="mt-4 text-gray-600">The AI response could not be parsed into a report. Please try again.</p>
        <button onClick={onReset} className="mt-6 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg shadow-sm">
            Start Over
        </button>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    const reportElement = document.getElementById('report-content');

    if (!reportElement) {
        console.error("Report element not found for PDF generation.");
        setIsDownloading(false);
        return;
    }

    try {
        const canvas = await html2canvas(reportElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            width: reportElement.scrollWidth,
            height: reportElement.scrollHeight,
            windowWidth: document.documentElement.scrollWidth,
            windowHeight: document.documentElement.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = jspdf;
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / pdfWidth;
        const imgHeight = canvasHeight / ratio;
        const pdfHeight = pdf.internal.pageSize.getHeight();

        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`${report.companyName.replace(/\s+/g, '-')}-Qualitative-Report.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-8 animate-fade-in">
      <div id="action-buttons" className="flex justify-between items-center">
         <h2 className="text-3xl font-bold text-brand-text">{report.companyName || 'Unnamed Company'}</h2>
         <div className="flex space-x-3">
            <button 
                onClick={handleDownloadPdf} 
                disabled={isDownloading}
                className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-sm transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
            >
                {isDownloading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <DownloadIcon className="h-5 w-5 mr-2" />
                )}
                {isDownloading ? 'Downloading...' : 'Download Report'}
            </button>
            <button onClick={onReset} className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-transform transform hover:scale-105">
                Analyze Another
            </button>
         </div>
      </div>

      <div id="report-content" className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl report-container" style={{ scrollBehavior: 'smooth' }}>
        <div className="text-center border-b pb-6 mb-6">
            <p className="text-lg text-gray-500">Qualitative Investment Report</p>
        </div>
        
        <div className={`border-l-4 p-4 rounded-md mb-8 ${verdictStyles[report.verdictColor || 'yellow']}`}>
            <p className="font-bold text-lg">{parseAndLinkCitations(report.overallVerdict, sources) || 'No verdict provided.'}</p>
        </div>

        <div className="space-y-8">
            <Card title="Executive Summary">
                <p className="text-base leading-relaxed">{parseAndLinkCitations(report.summary, sources) || 'No summary available.'}</p>
            </Card>

            <div className="page-break" />

            <Card 
                title="Management Evaluation"
                titleAddon={<SentimentIndicator sentiment={report.managementEvaluation?.sentiment} />}
            >
                {report.managementEvaluation ? (
                    <>
                        <p className="text-base leading-relaxed mb-6">{parseAndLinkCitations(report.managementEvaluation.narrative, sources)}</p>
                        <h4 className="text-lg font-semibold text-brand-secondary mb-3">Evaluation Scorecard</h4>
                        <ManagementScorecard scorecard={report.managementEvaluation.scorecard} sources={sources} />
                        <h4 className="text-lg font-semibold text-brand-secondary mt-8 mb-3">Peer Comparison</h4>
                        <PeerComparison peers={report.managementEvaluation.peerComparison} sources={sources} />
                    </>
                ) : (
                    <p className="text-gray-500">Management evaluation data is not available.</p>
                )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card title="Business Model">
                    <p className="text-base leading-relaxed">{parseAndLinkCitations(report.businessModel, sources) || 'No data available.'}</p>
                </Card>
                <Card title="Competitive Advantage (Moat)">
                     <div className="space-y-2">
                        <p><strong className="font-semibold text-gray-800">Source:</strong> {report.moatAnalysis?.source || 'N/A'}</p>
                        <p><strong className="font-semibold text-gray-800">Durability:</strong> {report.moatAnalysis?.durability || 'N/A'}</p>
                        <p className="text-base leading-relaxed pt-2">{parseAndLinkCitations(report.moatAnalysis?.description, sources) || 'No description available.'}</p>
                     </div>
                </Card>
            </div>

            <Card title="ESG Analysis">
                <div className="space-y-2">
                    <p><strong className="font-semibold text-gray-800">Environmental:</strong> {parseAndLinkCitations(report.esgAnalysis?.environmental, sources) || 'N/A'}</p>
                    <p><strong className="font-semibold text-gray-800">Social:</strong> {parseAndLinkCitations(report.esgAnalysis?.social, sources) || 'N/A'}</p>
                    <p><strong className="font-semibold text-gray-800">Governance:</strong> {parseAndLinkCitations(report.esgAnalysis?.governance, sources) || 'N/A'}</p>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card 
                    title="Corporate Culture"
                    titleAddon={<SentimentIndicator sentiment={report.corporateCulture?.sentiment} />}
                >
                    <p className="text-base leading-relaxed">{parseAndLinkCitations(report.corporateCulture?.description, sources) || 'No data available.'}</p>
                </Card>
                <Card title="Growth Strategy">
                    <p className="text-base leading-relaxed">{parseAndLinkCitations(report.growthStrategy, sources) || 'No data available.'}</p>
                </Card>
            </div>

            <Card title="Risk & Resilience">
                {report.riskAndResilience ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-lg text-red-600 mb-3">Key Risks</h4>
                             <ul className="space-y-2">
                                {(report.riskAndResilience.keyRisks || []).map((item, index) => (
                                    <li key={index} className="flex items-start">
                                        <XCircleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"/>
                                        <span className="leading-relaxed">{parseAndLinkCitations(item, sources)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg text-green-600 mb-3">Resilience Factors</h4>
                            <ul className="space-y-2">
                                {(report.riskAndResilience.resilienceFactors || []).map((item, index) => (
                                    <li key={index} className="flex items-start">
                                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"/>
                                        <span className="leading-relaxed">{parseAndLinkCitations(item, sources)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500">Risk and resilience data is not available.</p>
                )}
            </Card>

            {sources?.length > 0 && (
                <Card title="Sources">
                    <ol className="list-decimal list-inside space-y-2">
                        {sources.map((source, index) => {
                             const sourceNumber = index + 1;
                             return(
                                <li key={index} id={`source-${sourceNumber}`} className="text-sm scroll-mt-20">
                                    {source.uri.startsWith('http') ? (
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {source.title}
                                        </a>
                                    ) : (
                                        <span className="text-gray-800">{source.title}</span>
                                    )}
                                </li>
                            )
                        })}
                    </ol>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;