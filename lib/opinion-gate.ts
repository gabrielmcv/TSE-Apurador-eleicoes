export function opinionGate(complete:number,expected=5571){
 const count=Math.max(0,Math.min(expected,Math.trunc(complete)));
 return {basis:'Municípios do segundo turno com todas as seções totalizadas e resultado arquivado',complete:count,expected,percent:expected>0?count/expected*100:0,stage:expected>0&&count>=expected?100:expected>0&&count*10>=expected*9?90:0};
}
