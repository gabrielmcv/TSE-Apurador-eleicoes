export const isSecondPage=()=>typeof window!=='undefined'&&window.location.pathname.startsWith('/segundo-turno');
export function roundFetch(input:RequestInfo|URL,init?:RequestInit){if(typeof input==='string'&&input.startsWith('/api/')&&isSecondPage()){const u=new URL(input,window.location.origin);u.searchParams.set('eleicao','2026-2');input=u.pathname+u.search;}return fetch(input,init);}
