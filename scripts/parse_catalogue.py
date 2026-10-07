import openpyxl, json, re

wb = openpyxl.load_workbook('C:/Users/User/Downloads/Catalogue_Formations_LMD (1).xlsx', data_only=True)

data = []
for code in ['INF','GCI','GEE','GES','CPT','ECO','DRO','MKT','COM','EDU']:
    ws = wb[code]
    cycle = None
    sem = 0
    ues = []
    for row in ws.iter_rows(values_only=True):
        vals = [str(c).strip() if c is not None else '' for c in row]
        c0 = vals[0].replace(' ','')
        if 'LICENCE' in c0 and 'MASTER' not in c0 and 'CYCLE' in c0:
            cycle = 'LICENCE'
            continue
        elif 'MASTER' in c0 and 'CYCLE' in c0:
            cycle = 'MASTER'
            continue
        if cycle and 'Semestre' in vals[0]:
            m = re.search(r'Semestre\s*(\d)', vals[0])
            if m: sem = int(m.group(1))
            continue
        if vals[0] and vals[1]:
            c0_clean = vals[0].replace(' ','')
            if c0_clean in ['CodeUE',''] or c0_clean.startswith('TOTAL'):
                continue
            try:
                vol = int(float(vals[2])) if vals[2].replace('.','',1).isdigit() else 0
                cr = int(float(vals[3])) if vals[3].replace('.','',1).isdigit() else 0
                co = int(float(vals[4])) if vals[4].replace('.','',1).isdigit() else 0
                ues.append({
                    'code': vals[0], 'intitule': vals[1],
                    'volume': vol, 'credits': cr, 'coef': co,
                    'semestre': sem, 'cycle': cycle
                })
            except:
                pass
    data.append({'code': code, 'ues': ues})

with open('D:/EasyEcole/catalogue.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

total = sum(len(d['ues']) for d in data)
print(f"{len(data)} filieres, {total} UEs")
for d in data:
    print(f"  {d['code']}: {len(d['ues'])} UEs")
