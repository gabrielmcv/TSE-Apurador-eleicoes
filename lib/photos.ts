import {electionContext} from './election-context';
import type {Result} from './tse';
import catalog from './candidate-photos.json';
const photos=new Map(catalog.photos.map(photo=>[photo.sqcand,photo.url]));
// Presentation projection only. Stored snapshots and original response bytes remain untouched.
export function withCandidatePhotos(result:Result,cargo:string,uf?:string):Result{
 if(cargo!=='1'){if(!uf||!['3','5','6','7','8'].includes(cargo)||!/^([A-Z]{2})$/.test(uf)||['BR','ZZ'].includes(uf))return result;return {...result,candidates:result.candidates.map(candidate=>({...candidate,photo:/^\d{10,}$/.test(candidate.id)?`https://resultados.tse.jus.br/oficial/ele2026/${electionContext().state}/fotos/${uf.toLowerCase()}/${candidate.id}.jpeg`:undefined}))};}
 return {...result,candidates:result.candidates.map(candidate=>({...candidate,photo:photos.get(candidate.id)??candidate.photo??(/^\d{10,}$/.test(candidate.id)?`https://resultados.tse.jus.br/oficial/ele2026/${electionContext().president}/fotos/br/${candidate.id}.jpeg`:undefined)}))};
}
