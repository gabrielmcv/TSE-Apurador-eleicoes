import {pageStructuredData,type PageSEO} from '../lib/seo';
export default function PageSchema({page}:{page:PageSEO}){return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(pageStructuredData(page)).replace(/</g,'\\u003c')}}/>;}
