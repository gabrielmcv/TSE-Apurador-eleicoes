import {electionContext} from './election-context';
import {UFS,endpoint} from './tse';
export function resultScopes(){const c=electionContext();const scopes=c.round===2?[{uf:'BR',cargo:'1'},{uf:'ZZ',cargo:'1'},...UFS.map(uf=>({uf,cargo:'1'})),...c.governors.map(uf=>({uf,cargo:'3'}))]:[{uf:'BR',cargo:'1'},{uf:'ZZ',cargo:'1'},...UFS.flatMap(uf=>['1','3','5','6',uf==='DF'?'8':'7'].map(cargo=>({uf,cargo})))];return scopes.map(scope=>({...scope,source:endpoint(scope.uf,scope.cargo,c)}));}
