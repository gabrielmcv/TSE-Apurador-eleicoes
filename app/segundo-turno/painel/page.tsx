import PageSchema from '../../PageSchema';
import {panelMetadata,panelSEO} from '../../../lib/seo';
import Panel from '../../painel/Panel';
import RoundProvider from '../../RoundProvider';
import {panelView} from '../../../lib/panel-view';
export default async function SecondPanel({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const params=await searchParams;return <RoundProvider><PageSchema page={panelSEO(params,2)}/><Panel initial={panelView(params)}/></RoundProvider>;}

export async function generateMetadata({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return panelMetadata(await searchParams,2);}
