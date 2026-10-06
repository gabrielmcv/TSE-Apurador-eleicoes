export function urnRetry(http:number|undefined,attempts:number){
 const blocked=http===403||http===429;
 const delay=blocked?610000:http===404?Math.min(21600000,300000*2**Math.min(7,Math.max(0,attempts-1))):Math.min(1800000,30000*2**Math.min(6,Math.max(0,attempts-1)));
 return {delay,pauseMs:blocked?610000:0};
}
// Due configuration/index refreshes keep discovering new sections. Among
// downloads, fresh jobs precede retries so a missing image cannot monopolize
// the archive queue. No failed job is deleted or marked as successfully saved.
export const urnClaimQuery=`UPDATE urn_jobs SET state='active',lease_until=?,attempts=attempts+1,updated=? WHERE id=(SELECT id FROM urn_jobs WHERE ((state IN ('pending','retry') AND next_ms<=?) OR (state='active' AND lease_until<?)) ORDER BY CASE WHEN kind IN ('config','index') AND attempts>0 THEN 0 ELSE 1 END,attempts,CASE kind WHEN 'file' THEN 0 WHEN 'aux' THEN 1 WHEN 'import' THEN 2 WHEN 'index' THEN 3 ELSE 4 END,id LIMIT 1) RETURNING *`;
export const urnFailuresQuery=`SELECT j.uf,j.kind,j.error,COALESCE(f.type,j.kind) type,count(*) count,min(j.next_ms) next_ms,max(j.updated) updated FROM urn_jobs j LEFT JOIN urn_files f ON j.kind='file' AND f.id=json_extract(j.payload,'$.fileId') WHERE j.state='retry' AND j.error IS NOT NULL GROUP BY j.uf,j.kind,j.error,COALESCE(f.type,j.kind) ORDER BY max(j.updated) DESC LIMIT 10`;

// Reserve one turn per batch for due retries; new files cannot starve older failures.
export const urnRetryClaimQuery=urnClaimQuery.replace("ORDER BY CASE WHEN kind","ORDER BY CASE WHEN state='retry' THEN 0 ELSE 1 END,next_ms,CASE WHEN kind");
