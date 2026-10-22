from pathlib import Path
import pypdfium2 as pdfium
base=Path('source/downloads/policy')
for path in base.glob('*.pdf'):
 d=pdfium.PdfDocument(str(path))
 for n in ([0,3,4] if 'order-36' in path.name else [0]):
  p=d[n]; p.render(scale=1.8).to_pil().save('source/img/policy/'+path.stem+'-p'+str(n+1)+'.webp',quality=88)
 print(path.name,len(d),'pages')
