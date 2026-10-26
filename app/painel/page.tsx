import PageSchema from '../PageSchema';
import {panelMetadata,panelSEO} from '../../lib/seo';
import Panel from './Panel';
import {panelView} from '../../lib/panel-view';
export default async function PanelPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const params=await searchParams;return <><PageSchema page={panelSEO(params,1)}/><Panel initial={panelView(params)}/></>;}

export async function generateMetadata({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return panelMetadata(await searchParams,1);}
