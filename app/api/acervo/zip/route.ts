import {exportStatus,downloadExport} from '../../../../lib/archive-export';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{return new URL(request.url).searchParams.get('download')==='1'?await downloadExport():Response.json(await exportStatus(),{headers:{'Cache-Control':'no-store'}});}catch(error){console.error(error);return Response.json({error:'Não foi possível consultar o pacote do acervo.'},{status:503});}}
