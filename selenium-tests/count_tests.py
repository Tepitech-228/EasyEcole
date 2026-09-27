import glob, re
files = sorted(glob.glob(r'D:\EasyEcole\selenium-tests\tests\*.py'))
total = 0
results = []
for f in files:
    content = open(f, encoding='utf-8', errors='ignore').read()
    n = len(re.findall(r'def test_', content))
    results.append((f.split('\\')[-1], n))
    total += n
    print(f"{f.split('\\')[-1]}: {n} tests")
print(f"TOTAL: {total}")
