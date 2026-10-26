import {pageMetadata,publicPages} from '../../lib/seo';
import PageSchema from '../PageSchema';
export const metadata=pageMetadata(publicPages.second);
import PresidentialHome from '../PresidentialHome';
import {homeData} from '../../lib/home-data';
import RoundProvider from '../RoundProvider';
export const dynamic='force-dynamic';
export default async function SecondHome(){return <RoundProvider><PageSchema page={publicPages.second}/><PresidentialHome initialData={await homeData()}/></RoundProvider>;}
