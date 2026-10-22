from pathlib import Path
import pypdfium2 as pdfium
p=Path('source/downloads/policy/state-council-gazette-2025-11.pdf')
d=pdfium.PdfDocument(str(p))
for i in range(len(d)):
 t=d[i].get_textpage().get_text_range()
 if '关于健全社会信用体系的意见' in t:
  print(i+1,t[:120])
