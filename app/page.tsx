import PresidentialHome from './PresidentialHome';
import {homeData} from '../lib/home-data';
export const dynamic='force-dynamic';
export default async function Home(){return <PresidentialHome initialData={await homeData()}/>;}
