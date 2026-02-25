
import { GoogleGenAI } from "@google/genai";
import { License, Company } from "../types";

let cachedAi: GoogleGenAI | null = null;
const getAI = () => {
  if (cachedAi) return cachedAi;
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will not work.");
  }
  cachedAi = new GoogleGenAI({ apiKey });
  return cachedAi;
};
export const analyzeLicensesStatus = async (licenses: License[], companies: Company[]): Promise<string> => {
  if (licenses.length === 0) return "Nenhuma licença cadastrada para análise de compliance.";

  const dataToAnalyze = licenses.map(l => {
    const company = companies.find(c => c.id === l.companyId);
    return {
      empresa: company?.fantasyName || 'Desconhecida',
      cnpj: company?.cnpj || 'N/A',
      documento: l.name,
      tipo: l.type,
      vencimento: l.expirationDate
    };
  });

  const prompt = `
    Como um Auditor de Compliance Sênior, analise estas licenças de múltiplas empresas:
    ${JSON.stringify(dataToAnalyze)}
    
    Forneça um resumo executivo profissional:
    1. Liste os riscos imediatos por empresa.
    2. Identifique gargalos de renovação.
    3. Dê uma recomendação estratégica curta em português (máx 150 palavras).
    Mantenha um tom corporativo e sério.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.4,
        systemInstruction: "Você é um assistente virtual especializado em auditoria jurídica e compliance empresarial.",
      }
    });

    return response.text || "Dados insuficientes para gerar insights.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "O assistente de IA está temporariamente indisponível para análise.";
  }
};
