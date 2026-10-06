type CandidateColorInput={id:string;name:string;party:string};

const CAMPAIGN_COLORS:Record<string,string>={
 'FLAVIO BOLSONARO':'#005CA9','LULA':'#CC092F','ESCRITOR AUGUSTO CURY':'#1559A2','RENAN SANTOS':'#F4C300','RONALDO CAIADO':'#243E78','ZEMA':'#EC671C','SAMARA':'#7A278B','HERTZ DIAS':'#E1251B','CLARIANA BARAO':'#008F5A','EDMILSON COSTA':'#B5121B','VETERINARIO WILSON GRASSI':'#00856A','RUI COSTA PIMENTA':'#D71920'
};
const PARTY_COLORS:Record<string,string>={PL:'#005CA9',PT:'#CC092F',AVANTE:'#1559A2',MISSAO:'#F4C300',PSD:'#243E78',NOVO:'#EC671C',UP:'#7A278B',PSTU:'#E1251B',DC:'#008F5A',PCB:'#B5121B',DEMOCRATA:'#00856A',PCO:'#D71920'};
const FALLBACK_COLORS=['#16756A','#7B4FA3','#B06B15','#3479A8','#A53A68','#66752B'];
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();

export function candidateColor(candidate:CandidateColorInput){
 const name=normalize(candidate.name),party=normalize(candidate.party);
 if(CAMPAIGN_COLORS[name])return CAMPAIGN_COLORS[name];
 if(PARTY_COLORS[party])return PARTY_COLORS[party];
 let hash=0;for(const char of candidate.id)hash=(hash*31+char.charCodeAt(0))>>>0;
 return FALLBACK_COLORS[hash%FALLBACK_COLORS.length];
}
