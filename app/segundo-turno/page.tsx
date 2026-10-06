import type {Metadata} from 'next';
export const metadata:Metadata={title:'Segundo turno: apuração para presidente e governadores',description:'Apuração do segundo turno das eleições 2026, em 25 de outubro. Histórico, exterior e arquivos de urnas em acervo independente.',alternates:{canonical:'https://eleicoes.3ree.org/segundo-turno'},openGraph:{url:'https://eleicoes.3ree.org/segundo-turno',title:'Segundo turno — Eleições 2026'}};
import Home from '../page';
import RoundProvider from '../RoundProvider';
export default function SecondHome(){return <RoundProvider><Home/></RoundProvider>;}
