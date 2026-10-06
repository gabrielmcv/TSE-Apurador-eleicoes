import type {Metadata} from 'next';
import {panelView,panelTitles} from './panel-view';
const origin='https://eleicoes.3ree.org';
export function panelMetadata(params:Record<string,string|string[]|undefined>,round:1|2=1):Metadata{const view=panelView(params),tab=view.menu==='painel'?'resultados':view.menu;const title=panelTitles[view.menu].title;const canonical=`${origin}${round===2?'/segundo-turno':''}/painel?aba=${tab}${view.menu==='exterior'?'&uf=ZZ&cargo=1':''}`;return {title:`${title} — ${round}º turno`,description:panelTitles[view.menu].description+' Eleições 2026, com dados arquivados do TSE.',alternates:{canonical},openGraph:{url:canonical,title:`${title} — Eleições 2026 · ${round}º turno`,description:panelTitles[view.menu].description}};}
