import Comparison from './Comparison';
import RoundProvider from '../RoundProvider';
import PageSchema from '../PageSchema';
import {pageMetadata,publicPages} from '../../lib/seo';
import {readOpinion} from '../../lib/ai-opinion';
import type {OpinionState} from './AIOpinion';
export const metadata=pageMetadata(publicPages.comparison);
export const dynamic='force-dynamic';
export default async function Page(){
 let initialOpinion:OpinionState|undefined;
 try{initialOpinion=await readOpinion() as OpinionState;}catch{/* The client retains its normal retry path. */}
 return <RoundProvider><PageSchema page={publicPages.comparison}/><Comparison initialOpinion={initialOpinion}/></RoundProvider>;
}
