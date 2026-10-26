import {pageMetadata,publicPages} from '../lib/seo';
import PageSchema from './PageSchema';
export const metadata=pageMetadata(publicPages.first);
import {redirect} from 'next/navigation';
import PresidentialHome from './PresidentialHome';
import {homeData} from '../lib/home-data';
export const dynamic='force-dynamic';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const params=await searchParams;if(params.eleicao!=='2026-1')redirect('/segundo-turno');return <><PageSchema page={publicPages.first}/><PresidentialHome initialData={await homeData()}/></>;}
