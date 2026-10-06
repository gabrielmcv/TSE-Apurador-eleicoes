import {UFS, type Result} from './tse';
export const UF_NAMES:Record<string,string>={AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',MT:'Mato Grosso',MS:'Mato Grosso do Sul',MG:'Minas Gerais',PA:'Pará',PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',RJ:'Rio de Janeiro',RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondônia',RR:'Roraima',SC:'Santa Catarina',SP:'São Paulo',SE:'Sergipe',TO:'Tocantins'};
export const coverageQuery=`SELECT uf, normalized, received FROM (SELECT uf, normalized, received, ROW_NUMBER() OVER (PARTITION BY uf ORDER BY generation_ms DESC, id DESC) AS rn FROM snapshots WHERE cargo='1' AND uf NOT IN ('BR','ZZ')) WHERE rn=1`;
export function urnCoverage(rows:{uf:string;normalized:string;received:string}[]){
 const byUf=new Map(rows.map(row=>[row.uf,row]));
 return UFS.map(uf=>{const row=byUf.get(uf),result:Result|null=row?JSON.parse(row.normalized):null;return {uf,name:UF_NAMES[uf],progress:result?.progress??null,sections:result?.sections??null,totalSections:result?.totalSections??null,generated:result?.generated??null,received:row?.received??null};});
}
export type UrnState=ReturnType<typeof urnCoverage>[number];
