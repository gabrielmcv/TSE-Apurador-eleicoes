import {CheckCircle2,Users,MinusCircle} from 'lucide-react';
import type {Candidate} from '../lib/tse';
import {candidateStatus} from '../lib/candidate-status';
export default function CandidateStatus({candidate}:{candidate:Candidate}){
 const badge=candidateStatus(candidate);if(!badge)return null;
 const Icon=badge.kind==='elected'?CheckCircle2:badge.kind==='alternate'?Users:MinusCircle;
 return <span className={`candidate-status-badge candidate-status-${badge.kind}`} title={candidate.status||'Eleito conforme indicação do TSE'}><Icon size={14} aria-hidden="true"/>{badge.label}</span>;
}
