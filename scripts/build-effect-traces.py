from pathlib import Path
import re,json
root=Path('assets/figma')
seq=0
def image(name,x,y,w=None,h=None,fx=False,fy=False):
 global seq
 seq+=1;s=(root/('effect-'+name+'.svg')).read_text();vb=re.search('viewBox="([^"]+)"',s)[1];a=list(map(float,vb.split()));w=w or a[2];h=h or a[3];inner=re.sub(r'^.*?<svg[^>]*>','',s,flags=re.S);inner=inner.rsplit('</svg>',1)[0]
 for id in re.findall(r'id="([^"]+)"',inner):inner=inner.replace('id="'+id+'"','id="effect-'+str(seq)+'-'+id+'"').replace('#'+id+'"','#effect-'+str(seq)+'-'+id+'"').replace('#'+id+')','#effect-'+str(seq)+'-'+id+')')
 transform=f'translate({x+w if fx else x} {y+h if fy else y}) scale({-1 if fx else 1} {-1 if fy else 1})'
 return f'<g transform="{transform}"><svg x="0" y="0" width="{w}" height="{h}" viewBox="{vb}" preserveAspectRatio="none" fill="none">{inner}</svg></g>'
charts={}
for key,W in [('participation',902.754),('monitoring',1308.658)]:
 q=W/4;pieces=[]
 for i in range(4):pieces.append(image(key+('-imgVector1155' if i%2==0 else '-imgVector1156'),i*q,79-78.2798,q,78.2798,fx=i%2==1,fy=True))
 # Stroke leaf offsets match the exported Figma inset within its 79px plot.
 for i in range(4):pieces.append(image(key+('-imgVector1157' if i%2==0 else '-imgVector1158'),i*q-.0022*q,.149,q*1.0022,70.3734,fx=i%2==1,fy=True))
 charts[key]={'width':W,'height':80,'groups':[''.join(pieces)],'gaps':[[380.557/W,475.585/W]] if key=='participation' else [[542.584/W,642.584/W]]}
# Figma repeated curve motifs, keeping the designed gaps between the two teaching blocks.
for key,w,H in [('actions',144.4204,172.172),('expressions',134,123)]:
 isaction=key=='actions'; W=782.4568 if isaction else 726
 # y-origin is the top gridline: 29.328px / 48px in the source frame.
 cfg=[('1247','1246',27.672 if isaction else 19,114.572 if isaction else 81.5,49.203 if isaction else 35,3.59 if isaction else 3.64,7.34 if isaction else 7.06,8.93 if isaction else 8.77),
 ('1248' if isaction else '1249','1249' if isaction else '1250',47.352 if isaction else 33,114.572 if isaction else 81.5,49.203 if isaction else 35,3.59 if isaction else 3.64,7.34 if isaction else 7.06,8.93 if isaction else 8.77),
 ('1250' if isaction else '1251','1251' if isaction else '1252',116.232 if isaction else 82,56.935 if isaction else 40.5,24.45 if isaction else 17.393,2.96 if isaction else 2.85,3.77,5.41)]
 if isaction:cfg.append(('1252','1253',162.629,10.543,4.528,.96,-8.81,-7.89))
 groups=[]
 for j,(fill,line,y,fh,lh,ft,lt,lb) in enumerate(cfg):
  out=[]
  # First three motifs fill the first run, two motifs fill the second run.
  for i,x in enumerate([0,w,2*w,W-2*w,W-w]):
   fx=(i>0) if j!=1 else (i==4)
   out.append(image(key+'-imgVector'+fill,x,y+fh*ft/100,w,fh*(1-ft/100),fx=fx))
   offset=.7 if isaction and j<2 else .5 if not isaction and j<2 else .25
   out.append(image(key+'-imgVector'+line,x-.0031*w,y+offset+lh*lt/100,w*1.0031,lh*(1-(lt+lb)/100),fx=fx))
  groups.append(''.join(out))
 charts[key]={'width':W,'height':H,'groups':groups,'gaps':[[3*w/W,(W-2*w)/W]]}
 if not isaction:charts[key]['gaps'].append([286/W,386/W])
Path('effect-chart-assets.js').write_text('// Exact SVG paths exported from Figma node 225:45354, composed using source transforms.\nexport const effectTraces = '+json.dumps(charts,ensure_ascii=False)+';\n')
print('Composed',len(charts),'charts')
