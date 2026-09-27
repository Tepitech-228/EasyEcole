import subprocess, sys
result = subprocess.run([sys.executable, "-m", "pytest", "--collect-only", "tests/"], 
                       capture_output=True, text=True, cwd=r"D:\EasyEcole\selenium-tests")
lines = result.stdout.split('\n')
func_count = sum(1 for line in lines if '<Function' in line)
print(f"TOTAL TESTS COLLECTED: {func_count}")

# Show breakdown by file
import re
current_file = ""
file_counts = {}
for line in lines:
    if '<Module' in line:
        m = re.search(r'<Module (.*?)>', line)
        if m:
            current_file = m.group(1).split('/')[-1]
            file_counts[current_file] = 0
    elif '<Function' in line and current_file:
        file_counts[current_file] += 1

print("\nBREAKDOWN BY FILE:")
for f, n in sorted(file_counts.items()):
    print(f"  {f}: {n} tests")
