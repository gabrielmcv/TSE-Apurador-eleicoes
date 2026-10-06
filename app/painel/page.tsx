import {panelMetadata} from '../../lib/seo';
import Panel from './Panel';
import {panelView} from '../../lib/panel-view';
export default async function PanelPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <Panel initial={panelView(await searchParams)}/>;}

export async function generateMetadata({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return panelMetadata(await searchParams,1);}
