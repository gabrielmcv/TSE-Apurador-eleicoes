export type EvidenceStatus='positiva'|'suspeita'|'critica'|'neutra';
export const evidenceLabels:Record<EvidenceStatus,string>={positiva:'Positiva · consistência verificada',suspeita:'Suspeita · requer investigação',critica:'Crítica · ponto relevante pendente',neutra:'Contexto · sem classificação'};
// Explicit presentation classification of the published review; never infer status
// from an assessment type or automatically carry it into a revised analysis.
const classifiedReview='7bc8404b9146253dcbdbf0ed3e36b68548995cd08ab443851e48af0508e7eb08';
const classifications:Record<string,EvidenceStatus>={
 'Transparência integral: conclusão ainda não demonstrada':'suspeita',
 'O ganho de 10,38 milhões de Lula: questão central ainda por explicar':'suspeita',
 'Cenário político explícito: a diferença de 2.658.667 votos':'suspeita',
 'Perdas municipais: assimetria real, causa ainda não demonstrada':'suspeita',
 'Abstenção: objeto de verificação, não justificativa automática':'suspeita',
 'Prorrogação: diferença de condições documentada e impacto pendente':'critica',
 'Cronologia: resultados disponíveis antes das 19h':'suspeita',
 'Referência histórica e magnitude da participação':'neutra',
 'Coerência dos votos e balanço entre turnos':'positiva',
 'Cobertura e teste do peso dos dados fora do recorte':'positiva',
 'Integridade documental e alcance desta revisão':'critica',
};
export function evidenceStatus(section:{title:string;status?:EvidenceStatus},analysisHash:string):EvidenceStatus{
 return section.status??(analysisHash===classifiedReview?classifications[section.title]??'neutra':'neutra');
}
