import type {Candidate} from './tse';
export function candidateStatus(candidate:Pick<Candidate,'status'|'elected'>){
 const status=candidate.status.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 // Explicit textual classifications take precedence over the boolean flag.
 if(/^nao eleit[oa]\b/.test(status))return {kind:'not-elected',label:'Não eleito'};
 if(/^suplente\b/.test(status))return {kind:'alternate',label:'Suplente'};
 if(/^eleit[oa]\b/.test(status)||candidate.elected)return {kind:'elected',label:'Eleito'};
 return null;
}
