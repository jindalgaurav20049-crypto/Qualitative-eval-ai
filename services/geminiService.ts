import { GoogleGenAI } from "@google/genai";
import { QualitativeReport, AnalysisResultData, AnalysisSource } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * A robust helper function to extract and parse a JSON object from a string.
 * It handles markdown code blocks, raw JSON, and attempts to clean common syntax errors.
 * @param text The string potentially containing JSON data.
 * @returns The parsed JSON object.
 * @throws An error if no valid JSON can be extracted.
 */
const extractJsonFromReport = (text: string): any => {
    // A simple regex to remove trailing commas from objects and arrays, a common LLM error.
    const cleanJsonString = (str: string) => str.replace(/,\s*([}\]])/g, '$1');

    // 1. Try to find the JSON within a markdown block (flexible regex)
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        try {
            console.log("Attempting to parse from markdown block...");
            return JSON.parse(cleanJsonString(markdownMatch[1]));
        } catch (e) {
            console.warn("Could not parse JSON from markdown block, trying subsequent methods.", e);
        }
    }

    // 2. If markdown fails, find the largest JSON object in the text
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        const potentialJson = text.substring(firstBrace, lastBrace + 1);
        try {
            console.log("Attempting to parse from substring '{...}'...");
            return JSON.parse(cleanJsonString(potentialJson));
        } catch (e) {
            console.warn("Could not parse extracted JSON substring.", e);
        }
    }

    // 3. As a last resort, try to parse the entire trimmed and cleaned text
    try {
        console.log("Attempting to parse the entire response text...");
        return JSON.parse(cleanJsonString(text.trim()));
    } catch (e) {
        console.error("All JSON extraction methods failed.", { error: e, responseText: text });
        throw new Error("The AI returned a response that could not be understood. The format was invalid. Please try again.");
    }
};


export const analyzeDocuments = async (
    files: Array<{ name: string; content: string; category: string; }>,
    companyName: string
): Promise<AnalysisResultData> => {
  const hasDocuments = files.length > 0;

  const documentSources: AnalysisSource[] = files.map((file, index) => ({
    title: `Document: ${file.name} (${file.category})`,
    uri: `#source-${index + 1}` // Internal link
  }));

  const concatenatedDocs = hasDocuments
    ? files
        .map((file, index) => `--- DOCUMENT ${index + 1}: ${file.category} (${file.name}) ---\n\n${file.content}`)
        .join("\n\n")
    : "";
    
  const documentsSection = hasDocuments
    ? `Here are the documents provided for analysis. They are indexed as the first sources for citation:\n${concatenatedDocs}`
    : `No documents were provided. Your analysis for ${companyName} must be based solely on real-time, public information gathered via Google Search.`;


  const prompt = `You are a world-class qualitative investment analyst AI. Your primary function is to generate a comprehensive, cited qualitative investment report on **${companyName}** for informational purposes. You are not providing financial advice.

${documentsSection}

**WEB SEARCH MANDATE:** Your analysis **MUST** be primarily driven by the most current public information available via Google Search. The provided documents should be treated as secondary sources, offering historical context or internal details not available publicly. For **every section** of the report, you are required to find and synthesize recent news, financial statements, and market data from the web. If there is a conflict between a provided document and recent public information, you **MUST** favor the public information and explicitly note the discrepancy in your analysis. An analysis that merely summarizes the provided documents without extensive, verifiable web-based synthesis for every point will be considered a failed task.

**CRITICAL CITATION AND SOURCING RULES:**
1.  **Mandatory Citation:** Every claim, data point, and piece of analysis **MUST** be followed by a citation in the format \`[n]\`. There are no exceptions.
2.  **Web-First Citation Policy:** Given that your analysis must be primarily driven by current public information (as per the WEB SEARCH MANDATE), you **MUST prioritize citing the web search results** over the provided documents whenever possible. Use document citations primarily for historical data or information not available publicly.
3.  **Accurate Source Indexing:** The source number \`n\` must accurately correspond to the list of sources provided to you. The first ${documentSources.length} sources are the uploaded documents. All subsequent numbers refer to the web search results.
4.  **Frequent and Granular Citations:** Do not just cite at the end of a paragraph. Cite specific facts and figures as they appear in the text.
5.  **Comprehensive Sourcing:** Your analysis is only as credible as your sources. Ensure every web page you draw information from is used as a source for citation.

Please structure your entire output as a single JSON object that follows the schema detailed below.

**JSON Schema and Analysis Sections (All sections must adhere to the WEB SEARCH MANDATE and be cited):**
1.  **companyName**: The company's name: "${companyName}".
2.  **overallVerdict**: A concise, expert verdict on the investment quality, based on a synthesis of all findings.
3.  **verdictColor**: 'green' for positive, 'yellow' for cautious, 'red' for significant concerns.
4.  **summary**: A one-paragraph executive summary synthesizing findings from all sources, prioritizing recent web data.
5.  **managementEvaluation**: An object containing:
    *   **scorecard**: An array of objects. Each object must have "criteria", "score" (1-10), "weight" (%), and "justification". The criteria are: "Competency", "Track Record", "Integrity & Transparency", "Shareholder Alignment", "Capital Allocation". **The combined weight for Competency and Track Record MUST be at least 50%**. Justifications must be based on the most current information available.
    *   **peerComparison**: An array of objects for 2-3 key competitors of **${companyName}**. Each object must have "peerName", "managementScore" (1-10), and "notes". This section is entirely driven by web search.
    *   **narrative**: A summary of management quality. **Crucially, you MUST use public data from web searches to assess if the management team has a history of fulfilling its past promises and achieving its stated goals within their defined timelines.** This is a critical part of the evaluation.
    *   **sentiment**: A string ('Positive', 'Negative', 'Neutral') reflecting the overall sentiment of management's communication based on the tone, confidence, and language used in documents and web search results.
6.  **businessModel**: A string explaining how the company makes money, verified with the latest information.
7.  **moatAnalysis**: An object with "source" (e.g., Network Effects), "durability" (High, Medium, or Low), and "description", considering recent competitive developments found via web search.
8.  **esgAnalysis**: An object with "environmental", "social", and "governance" string fields, based on the latest ESG reports and news.
9.  **corporateCulture**: An object with:
    *   **description**: A string describing the company culture, using both document tone and recent public information (e.g., employee reviews, news articles).
    *   **sentiment**: A string ('Positive', 'Negative', 'Neutral') reflecting the overall public and internal sentiment about the corporate culture.
10. **riskAndResilience**: An object with "keyRisks" (array of strings) and "resilienceFactors" (array of strings), updated with any recent market or company-specific news from web searches.
11. **growthStrategy**: A string outlining the company's future growth strategy, validated against recent public announcements and analyst expectations from web searches.

**CRITICAL OUTPUT INSTRUCTIONS:**
- Your entire response **MUST** be ONLY a single, valid JSON object.
- **DO NOT** provide any warnings, disclaimers, or conversational text. The JSON object is the only thing you should output.
- The JSON object **MUST** be enclosed in a JSON markdown block that starts with \`\`\`json and ends with \`\`\`.
- **DO NOT** include any text, conversation, or explanations before or after the JSON markdown block.
- You **MUST** use the Google Search tool for real-time information to fulfill the requirements above.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        temperature: 0.1,
      },
    });

    const reportJson = extractJsonFromReport(response.text) as QualitativeReport;
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources: AnalysisSource[] = groundingChunks.map((chunk: any) => ({
        title: chunk.web?.title || 'Untitled Web Page',
        uri: chunk.web?.uri || '#',
    })).filter(source => source.uri !== '#');

    // Deduplicate web sources based on URI
    const uniqueWebSources = Array.from(new Map(webSources.map(item => [item.uri, item])).values());
    
    const allSources = [...documentSources, ...uniqueWebSources];

    return { report: reportJson, sources: allSources };

  } catch (error) {
    console.error("Error analyzing documents:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get analysis from AI: ${error.message}`);
    }
    throw new Error("An unknown error occurred during analysis.");
  }
};