import { GoogleGenAI } from "@google/genai";
import { MOCK_TOURISM_DATA } from "../constants";
import { ReportSection } from "../types";

// Lazy initialization to prevent crash if API key is missing
let ai: GoogleGenAI | null = null;

const getAIClient = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      console.warn("Gemini API Key is missing. Please configure it in your environment.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const generateReportStream = async (
  prompt: string, 
  onChunk: (text: string) => void
): Promise<ReportSection[]> => {
  try {
    const client = getAIClient();
    const dataContext = JSON.stringify(MOCK_TOURISM_DATA);
    
    const systemInstruction = `
      你是一名专业的文旅厅高级数据分析师。你的任务是根据用户提供的要求，结合提供的数据库数据，生成一份结构化的分析报告。
      
      数据库数据：${dataContext}
      
      输出要求：
      1. 你必须先在文本回复中简要介绍报告的核心发现。
      2. 然后在回复的末尾，必须返回一个 JSON 数组格式的报告结构，用标记 [REPORT_JSON_START] 和 [REPORT_JSON_END] 包裹。
      3. JSON 数组中每个对象代表一个报告章节。
      4. 章节类型(type)分为 'text' (纯文本分析) 和 'chart' (图表数据)。
      5. 语言风格：公文风格，严谨、专业、清晰。
      6. 图表配置(chartConfig)需包含 type ('bar', 'pie', 'line'), data (对象数组), dataKey (数值字段), xAxisKey (分类字段)。
    `;

    // Upgrade to gemini-3-pro-preview for complex data analysis and report structure generation
    const responseStream = await client.models.generateContentStream({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction,
      }
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      // Ensure text exists before processing
      const chunkText = chunk.text || "";
      fullText += chunkText;
      // Strip the JSON part for the UI display onChunk to provide cleaner feedback
      const displayChunk = chunkText.split('[REPORT_JSON_START]')[0];
      if (displayChunk) onChunk(displayChunk);
    }

    try {
      const jsonMatch = fullText.match(/\[REPORT_JSON_START\]([\s\S]*?)\[REPORT_JSON_END\]/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }
    } catch (error) {
      console.error("Failed to parse report JSON from stream:", error);
    }
    return [];
  } catch (error) {
    console.error("Error generating report:", error);
    onChunk("Error: Failed to generate report. Please check your API Key configuration.");
    return [];
  }
};