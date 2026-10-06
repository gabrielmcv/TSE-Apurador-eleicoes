import {electionContext,collectionClosed,electionInfo} from '../../../../lib/election-context';
import {discoverSecond,finishSecondDiscovery} from '../../../../lib/second-round-config';
import {pumpResults} from '../../../../lib/result-queue';
import {pumpMunicipal} from '../../../../lib/municipal-archive';
export const dynamic='force-dynamic';
export async function POST(){if(electionContext().round!==2)return Response.json({error:'Selecione o segundo turno.'},{status:400});if(collectionClosed())return Response.json({scheduled:true,election:electionInfo(),nextPoll:60000});try{await discoverSecond();if(!electionContext().configured)return Response.json({waitingForTSE:true,nextPoll:60000});const values=await Promise.all([pumpResults(),pumpMunicipal()]);await finishSecondDiscovery();return Response.json({results:values,nextPoll:Math.max(...values.map(v=>v.nextPoll??3000))});}catch{return Response.json({error:'Coletores temporariamente indisponíveis.'},{status:503});}}
