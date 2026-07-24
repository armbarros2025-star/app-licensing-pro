import { AuditAnalysis, Company, License } from "../types";
import { apiFetch } from "../utils/api";

const defaultAnalysis = (message: string): AuditAnalysis => ({
  executiveSummary: message,
  immediateRisks: [],
  bottlenecks: [],
  recommendedActions: [],
  confidence: 'low'
});

export const analyzeLicensesStatus = async (
  licenses: License[],
  companies: Company[],
  authToken: string
): Promise<AuditAnalysis> => {
  if (licenses.length === 0) {
    return defaultAnalysis("Nenhuma licença cadastrada para análise de compliance.");
  }

  if (!authToken) {
    return defaultAnalysis("Sessão não encontrada para executar a auditoria.");
  }

  try {
    const response = await apiFetch('/api/ai/license-audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ licenses, companies })
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      return defaultAnalysis(result?.error || "Não foi possível executar a auditoria de IA.");
    }

    return await response.json();
  } catch (error) {
    console.error("[ai/license-audit] Error:", error);
    return defaultAnalysis("O assistente de IA está temporariamente indisponível para análise.");
  }
};
