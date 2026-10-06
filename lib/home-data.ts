import {latest} from './archive';
import {getStorage} from '../db';
import {endpoint} from './tse';
import {withCandidatePhotos} from './photos';
import {electionContext} from './election-context';
import type {PresidentialData} from '../app/usePresidential';
export async function homeData():Promise<PresidentialData|null>{try{const row=await latest('BR','1'),source=endpoint('BR','1',electionContext());const {db}=getStorage();const state=await db.prepare('SELECT checked,http,latency,error FROM source_state WHERE source=?').bind(source).first<any>();return {result:row?withCandidatePhotos(JSON.parse(row.normalized),'1','BR'):null,error:state?.error??null,source,checked:state?.checked??'',nextPoll:2000,http:state?.http,latency:state?.latency,archive:row?{id:row.id,hash:row.hash,received:row.received,saved:row.saved}:null};}catch{return null;}}
