#!/usr/bin/env python3
"""Dependency-free XLSX reader for The Plug supplier workbook format.
Uses only Python standard library (zipfile + ElementTree).
"""
import sys, zipfile, xml.etree.ElementTree as ET, json, re, os
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
RID='{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'

def col_index(ref):
    m=re.match(r'([A-Z]+)',ref or 'A')
    s=m.group(1) if m else 'A'; n=0
    for ch in s: n=n*26+ord(ch)-64
    return n-1

def parse(path):
    out=[]
    with zipfile.ZipFile(path) as z:
        shared=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            root=ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in root:
                shared.append(''.join((t.text or '') for t in si.iter('{%s}t'%NS['m'])))
        wb=ET.fromstring(z.read('xl/workbook.xml'))
        rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        relmap={r.attrib['Id']:r.attrib['Target'] for r in rels}
        for s in wb.find('m:sheets',NS):
            name=s.attrib['name']; target=relmap[s.attrib[RID]]
            xml='xl/'+target if not target.startswith('xl/') else target
            root=ET.fromstring(z.read(xml)); sd=root.find('m:sheetData',NS)
            rows=[]
            for row in sd or []:
                vals={}
                for c in row:
                    idx=col_index(c.attrib.get('r'))
                    t=c.attrib.get('t'); v=c.find('m:v',NS)
                    if t=='inlineStr':
                        val=''.join((x.text or '') for x in c.iter('{%s}t'%NS['m']))
                    elif v is None: val=''
                    else:
                        val=v.text or ''
                        if t=='s':
                            try: val=shared[int(val)]
                            except: pass
                    vals[idx]=val
                if vals:
                    maxidx=max(vals); rows.append([vals.get(i,'') for i in range(maxidx+1)])
            if not rows: continue
            headers=[str(x).strip() for x in rows[0]]
            for ri,r in enumerate(rows[1:], start=2):
                obj={'__sheet':name,'__row':ri}
                for i,h in enumerate(headers):
                    if h: obj[h]=r[i] if i<len(r) else ''
                if any(str(v).strip() for k,v in obj.items() if not k.startswith('__')): out.append(obj)
    return out

if __name__=='__main__':
    data=parse(sys.argv[1])
    if len(sys.argv)>2 and sys.argv[2]=='summary':
        from collections import Counter
        print(json.dumps({'rows':len(data),'sheets':dict(Counter(x['__sheet'] for x in data)),'headers':list(data[0].keys()) if data else []},ensure_ascii=False))
    else:
        print(json.dumps(data,ensure_ascii=False))
