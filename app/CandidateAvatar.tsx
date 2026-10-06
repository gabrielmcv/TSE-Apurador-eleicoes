'use client';
import {useState} from 'react';
import type {Candidate} from '../lib/tse';
export default function CandidateAvatar({candidate}:{candidate:Candidate}){
 const [failed,setFailed]=useState<string|null>(null);
 return <div className="candidate-avatar"><svg className="avatar-progress" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="57" className="avatar-track"/><circle cx="60" cy="60" r="57" className="avatar-value" pathLength="100" strokeDasharray={`${Math.min(100,Math.max(0,candidate.percent))} 100`}/></svg><span aria-hidden="true">{candidate.name.split(' ').filter(Boolean).slice(0,2).map(word=>word[0]).join('')}</span>{candidate.photo&&failed!==candidate.photo?<img src={candidate.photo} alt={`Foto oficial de ${candidate.name}`} width={112} height={112} loading="eager" onError={()=>setFailed(candidate.photo!)} />:null}</div>;
}
