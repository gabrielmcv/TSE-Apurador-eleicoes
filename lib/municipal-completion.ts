export function municipalCompletion(rows:{sections:number|null;totalSections:number|null;progress?:number;validVotes?:number}[],expected:number){
 const known=rows.filter(r=>r.totalSections!=null&&r.totalSections>0&&r.sections!=null);
 const sections=known.reduce((n,r)=>n+Math.max(0,r.sections!),0),totalSections=known.reduce((n,r)=>n+r.totalSections!,0);
 const complete=known.filter(r=>r.sections!>=r.totalSections!).length;
 const partial=known.filter(r=>r.sections!>0&&r.sections!<r.totalSections!).length;
 return {captured:rows.length,expected,complete,partial,withoutTotalization:Math.max(0,rows.length-complete-partial),missing:Math.max(0,expected-rows.length),knownDenominators:known.length,sections,totalSections,sectionPercent:totalSections?sections/totalSections*100:null,municipalityPercent:expected?complete/expected*100:0};
}
