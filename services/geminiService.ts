
import { GoogleGenAI } from "@google/genai";
import { AuditAnalysis, Company, License } from "../types";

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const defaultAnalysis = (message: string): AuditAnalysis => ({
  executiveSummary: message,
  immediateRisks: [],
  bottlenecks: [],
  recommendedActions: [],
  confidence: 'low'
});

const safeParseAnalysis = (value: string): AuditAnalysis | null => {
  const trimmed = value.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(withoutFence);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      executiveSummary: typeof parsed.executiveSummary === 'string' ? parsed.executiveSummary : '',
      immediateRisks: Array.isArray(parsed.immediateRisks)
        ? parsed.immediateRisks.filter((item: unknown): item is string => typeof item === 'string')
        : [],
      bottlenecks: Array.isArray(parsed.bottlenecks)
        ? parsed.bottlenecks.filter((item: unknown): item is string => typeof item === 'string')
        : [],
      recommendedActions: Array.isArray(parsed.recommendedActions)
        ? parsed.recommendedActions
            .filter((item: unknown) => item && typeof item === 'object')
            .map((item: any) => ({
              title: typeof item.title === 'string' ? item.title : 'Ação sugerida',
              detail: typeof item.detail === 'string' ? item.detail : ''
            }))
        : [],
      confidence: parsed.confidence === 'high' || parsed.confidence === 'medium' || parsed.confidence === 'low'
        ? parsed.confidence
        : 'low'
    };
  } catch {
    return null;
  }
};

export const analyzeLicensesStatus = async (licenses: License[], companies: Company[]): Promise<AuditAnalysis> => {
  if (licenses.length === 0) return defaultAnalysis("Nenhuma licença cadastrada para análise de compliance.");

  const dataToAnalyze = licenses.map(l => {
    const company = companies.find(c => c.id === l.companyId);
    const daysRemaining = Math.ceil((new Date(l.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return {
      empresa: company?.fantasyName || 'Desconhecida',
      cnpj: company?.cnpj || 'N/A',
      documento: l.name,
      tipo: l.type,
      vencimento: l.expirationDate,
      dias_restantes: daysRemaining,
      em_renovacao: Boolean(l.isRenewing)
    };
  });

  const prompt = `
    Como um Auditor de Compliance Sênior, analise estas licenças de múltiplas empresas:
    ${JSON.stringify(dataToAnalyze)}
    
    Retorne SOMENTE um JSON válido, sem markdown, com esta estrutura exata:
    {
      "executiveSummary": "Resumo executivo curto em português, com tom corporativo.",
      "immediateRisks": ["lista curta de riscos imediatos"],
      "bottlenecks": ["lista curta de gargalos de renovação"],
      "recommendedActions": [
        { "title": "Título da ação", "detail": "Descrição curta e objetiva da ação" }
      ],
      "confidence": "high | medium | low"
    }

    Regras:
    - Priorize licenças vencidas ou com até 30 dias para vencer.
    - Seja objetivo, prático e orientado à ação.
    - Mantenha no máximo 3 itens por lista.
  `;

  try {
    if (!ai) return defaultAnalysis("Chave de API da IA não configurada para análise.");

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.2,
        systemInstruction: "Você é um assistente virtual especializado em auditoria jurídica e compliance empresarial.",
      }
    });

    const parsed = response.text ? safeParseAnalysis(response.text) : null;
    if (parsed) return parsed;

    return defaultAnalysis(response.text || "Dados insuficientes para gerar insights.");
  } catch (error) {
    console.error("Gemini Error:", error);
    return defaultAnalysis("O assistente de IA está temporariamente indisponível para análise.");
  }
};
