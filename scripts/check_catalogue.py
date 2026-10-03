import json
with open('D:/EasyEcole/catalogue.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
for f2 in data:
    print(f"{f2['code']}: {len(f2['ues'])} UEs")
total = sum(len(f2['ues']) for f2 in data)
print(f"\nTOTAL: {total} UEs dans {len(data)} filieres")
