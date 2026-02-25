
import { GoogleGenAI } from "@google/genai";
import { License, Company } from "../types";

// A instância será criada sob demanda para evitar crash do React no carregamento se a API Key não existir
const getAI = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("API Key não configurada. Defina VITE_GEMINI_API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
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
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.4,
        systemInstruction: "Você é um assistente virtual especializado em auditoria jurídica e compliance empresarial.",
      }
    });

    return response.text || "Dados insuficientes para gerar insights.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message.includes("API Key")) {
      return "Configure uma VITE_GEMINI_API_KEY no arquivo .env para habilitar a auditoria."
    }
    return "O assistente de IA está temporariamente indisponível para análise.";
  }
};
