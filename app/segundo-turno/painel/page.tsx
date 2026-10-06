import {panelMetadata} from '../../../lib/seo';
import Panel from '../../painel/Panel';
import RoundProvider from '../../RoundProvider';
import {panelView} from '../../../lib/panel-view';
export default async function SecondPanel({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <RoundProvider><Panel initial={panelView(await searchParams)}/></RoundProvider>;}

export async function generateMetadata({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return panelMetadata(await searchParams,2);}
