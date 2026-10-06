# Reproducible lightweight SVG paths from official IBGE 2025 shapefiles.
import zipfile,struct,json,math,pathlib,hashlib
root=pathlib.Path(__file__).resolve().parent.parent
catalog=json.loads((root/'lib/municipal-catalog.json').read_text());bycode={m['ibge']:m for m in catalog}
def dbf(data):
 count=struct.unpack_from('<I',data,4)[0];head,size=struct.unpack_from('<HH',data,8);fields=[];pos=32
 while data[pos]!=13:
  name=data[pos:pos+11].split(b'\0')[0].decode();length=data[pos+16];fields.append((name,length));pos+=32
 rows=[]
 for i in range(count):
  rec=data[head+i*size:head+(i+1)*size];pos=1;row={}
  for name,length in fields:
   row[name]=rec[pos:pos+length].decode('utf-8',errors='replace').strip();pos+=length
  rows.append(row)
 return rows
def project(p):
 x,y=p;return ((x+74)*27+18,(math.log(math.tan(math.pi/4+math.radians(5.5)/2))-math.log(math.tan(math.pi/4+math.radians(y)/2)))*1547+18)
def simplify(points,tol=.32):
 if len(points)<3:return points
 a,b=points[0],points[-1];dx=b[0]-a[0];dy=b[1]-a[1];den=dx*dx+dy*dy;best=tol*tol;idx=-1
 for i,p in enumerate(points[1:-1],1):
  t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)) if den else 0
  d=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2
  if d>best:best=d;idx=i
 if idx<0:return [a,b]
 return simplify(points[:idx+1],tol)[:-1]+simplify(points[idx:],tol)
def read(path):
 z=zipfile.ZipFile(path);db=z.read(next(n for n in z.namelist() if n.endswith('.dbf')));shp=z.read(next(n for n in z.namelist() if n.endswith('.shp')));rows=dbf(db);pos=100;out=[]
 for row in rows:
  recnum,length=struct.unpack_from('>II',shp,pos);pos+=8;end=pos+length*2;shape=struct.unpack_from('<I',shp,pos)[0]
  if shape!=5:pos=end;continue
  nparts,npoints=struct.unpack_from('<II',shp,pos+36);parts=list(struct.unpack_from('<'+'I'*nparts,shp,pos+44))+[npoints];pointstart=pos+44+4*nparts;paths=[];pointsall=[];centers=[]
  for a,b in zip(parts,parts[1:]):
   points=[project(struct.unpack_from('<dd',shp,pointstart+16*i)) for i in range(a,b)];points=simplify(points);pointsall+=points
   xmin=min(p[0] for p in points);xmax=max(p[0] for p in points);ymin=min(p[1] for p in points);ymax=max(p[1] for p in points);centers.append(((xmax-xmin)*(ymax-ymin),[(xmin+xmax)/2,(ymin+ymax)/2]))
   if len(points)<3:continue
   paths.append('M'+'L'.join(f'{x:.2f},{y:.2f}' for x,y in points)+'Z')
  if pointsall:out.append((row,''.join(paths),max(centers,key=lambda c:c[0])[1]))
  pos=end
 return out
municipal=[]
for props,path,center in read('/tmp/BR_Municipios_2025.zip'):
 code=props['CD_MUN'];m=bycode.get(code)
 if m:municipal.append({**m,'path':path,'center':[round(v,2) for v in center]})
missing=set(bycode)-{m['ibge'] for m in municipal};assert not missing,missing
states=[]
for props,path,center in read('/tmp/BR_UF_2025.zip'):
 states.append({'uf':props.get('SIGLA_UF') or props.get('SIGLA'),'path':path,'center':[round(v,2) for v in center]})
assert len(states)==27
sources=json.loads((root/'public/map-sources/provenance.json').read_text());sources['geometry']={'provider':'IBGE','edition':2025,'simplification':'Ramer–Douglas–Peucker, 0.32 SVG pixel; projection Mercator','source':'https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2025/Brasil/','municipalZipSHA256':hashlib.sha256(pathlib.Path('/tmp/BR_Municipios_2025.zip').read_bytes()).hexdigest(),'stateZipSHA256':hashlib.sha256(pathlib.Path('/tmp/BR_UF_2025.zip').read_bytes()).hexdigest()}
(root/'public/map-sources/provenance.json').write_text(json.dumps(sources,ensure_ascii=False,separators=(',',':')))
output={'viewBox':'0 0 1260 1210','municipalities':municipal,'states':states,'edition':2025}
(root/'public/municipal-map.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')))
print('Geometry:',len(municipal),'municipalities,',len(states),'states;', (root/'public/municipal-map.json').stat().st_size,'bytes')
