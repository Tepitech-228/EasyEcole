"""
measure_resources.py - Collecte CPU/RAM + métriques de charge par paliers EasyEcole V4

Usage:
  python measure_resources.py                          # paliers 10/50/100 users, 30s chacun
  python measure_resources.py --users 10,50,100,200 --run-time 30s --spawn-rate 10
  python measure_resources.py --quick                  # 10 users 30s seul

Génère :
  - performance/metrics_*.json par palier
  - performance/measure_summary.json (agrégé)
  - Console : tableau CPU/RAM par pallier + RPS/p95

Collecte ressources :
  - Système (psutil cpu_percent, virtual_memory)
  - Process node (backend Express, PID détecté via port 3000 ou nom "node")
  - Process MySQL (mysqld)
  - Temps de réponse moyen (depuis locustfile.py Metrics)

Peut tourner en mode simulation si backend indisponible (--simulate).
"""
import os
import sys
import json
import time
import platform
import argparse
import subprocess
from pathlib import Path
from datetime import datetime

# Ajoute le dossier performance au path pour importer locustfile
PERF_DIR = Path(__file__).parent
sys.path.insert(0, str(PERF_DIR))

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

import importlib.util
spec = importlib.util.spec_from_file_location("locustfile", PERF_DIR / "locustfile.py")
loc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(loc)

DEFAULT_HOST = os.environ.get("API_BASE", "http://localhost:3000/api/v1")

def env_info():
    info = {
        "date": datetime.now().isoformat(),
        "branch": "V4",
        "platform": platform.platform(),
        "windows_version": platform.version(),
        "python": platform.python_version(),
        "node": None,
        "npm": None,
        "host": DEFAULT_HOST,
        "frontend": os.environ.get("FRONTEND_URL", "http://localhost:4200"),
        "mysql_host": os.environ.get("DB_HOST", "localhost") + ":" + os.environ.get("DB_PORT", "3307"),
    }
    try:
        r = subprocess.run(["node","-v"], capture_output=True, text=True, timeout=5)
        info["node"] = r.stdout.strip()
    except: pass
    try:
        r = subprocess.run(["npm","-v"], capture_output=True, text=True, timeout=5)
        info["npm"] = r.stdout.strip()
    except: pass
    if HAS_PSUTIL:
        info["cpu_count"] = psutil.cpu_count(logical=True)
        info["cpu_phys"] = psutil.cpu_count(logical=False)
        vm = psutil.virtual_memory()
        info["ram_total_mb"] = vm.total // (1024*1024)
        info["ram_available_mb"] = vm.available // (1024*1024)
    return info

def run_one_pallier(users, run_time, spawn_rate, host, simulate=False):
    print("\n" + "#"*78)
    print(f"# PALIER {users} users - {run_time} (spawn {spawn_rate}/s) - {'SIMULATION' if simulate else 'REEL'}")
    print("#"*78)
    out_json = PERF_DIR / f"metrics_{users}u_{run_time}.json"
    # Appelle locustfile.main via subprocess pour isolation, ou direct
    # On appelle direct pour réutiliser metrics
    import argparse as ap
    # Simule args
    orig_argv = sys.argv[:]
    try:
        sys.argv = ["locustfile.py", "--host", host, "--users", str(users), "--spawn-rate", str(spawn_rate), "--run-time", run_time, "--output-json", str(out_json)]
        if simulate:
            sys.argv.append("--simulate")
        report = loc.main()
    finally:
        sys.argv = orig_argv
    return report

def main():
    parser = argparse.ArgumentParser(description="Measure resources par paliers EasyEcole V4")
    parser.add_argument("--users", default="10,50,100", help="Liste paliers (ex: 10,50,100,200)")
    parser.add_argument("--run-time", default="30s", help="Durée par palier (ex: 30s, 2m)")
    parser.add_argument("--spawn-rate", type=int, default=10, help="Spawn rate")
    parser.add_argument("--host", default=DEFAULT_HOST, help="API host")
    parser.add_argument("--simulate", action="store_true", help="Force simulation")
    parser.add_argument("--quick", action="store_true", help="Raccourci: 10 users 30s seul")
    args = parser.parse_args()

    if args.quick:
        args.users = "10"
        args.run_time = "30s"

    users_list = [int(x.strip()) for x in args.users.split(",") if x.strip()]
    host = args.host.rstrip("/")

    print(f"[MEASURE] EasyEcole V4 - {datetime.now().isoformat()}")
    print(f"[MEASURE] Host={host} | Paliers={users_list} | Durée={args.run_time} | Spawn={args.spawn_rate}/s | Simulate={args.simulate}")
    env = env_info()
    print(f"[ENV] {env['platform']} | Node {env['node']} | Python {env['python']} | CPU {env.get('cpu_count')} | RAM {env.get('ram_total_mb')} MB")
    print(f"[ENV] MySQL {env['mysql_host']}")

    # Autodétecte simulation si backend KO
    simulate_auto = args.simulate
    if not simulate_auto:
        import requests
        try:
            r = requests.get(f"{host}/health", timeout=5)
            if r.status_code not in (200,304):
                r2 = requests.get(f"{host}/", timeout=5)
                if r2.status_code not in (200,304):
                    print("[WARN] Backend non joignable, bascule simulation", file=sys.stderr)
                    simulate_auto = True
        except Exception as e:
            print(f"[WARN] Backend injoignable ({e}) -> simulation", file=sys.stderr)
            simulate_auto = True
        else:
            print(f"[OK] Backend joignable, mode réel activé")

    reports = {}
    for u in users_list:
        rep = run_one_pallier(u, args.run_time, args.spawn_rate, host, simulate=simulate_auto)
        reports[str(u)] = rep
        # Courte pause entre paliers pour laisser retomber CPU
        if u != users_list[-1]:
            print("[PAUSE] 5s avant prochain palier...")
            time.sleep(5)

    # Agrégat
    summary = {
        "meta": {
            "date": datetime.now().isoformat(),
            "branch": "V4",
            "host": host,
            "palliers": users_list,
            "run_time": args.run_time,
            "spawn_rate": args.spawn_rate,
            "is_simulation": simulate_auto,
            "env": env,
        },
        "paliers": reports,
    }
    out_summary = PERF_DIR / "measure_summary.json"
    out_summary.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n[OUT] Agrégat -> {out_summary}")

    # Tableau récap console
    print("\n" + "="*92)
    print(" RÉCAPITULATIF PAR PALIER (CPU/RAM + perf)")
    print("="*92)
    print(f"{'Users':>6} | {'RPS':>7} | {'Err%':>5} | {'p50':>6} | {'p95':>6} | {'p99':>6} | {'Node CPU%':>9} | {'Node RAM':>8} | {'MySQL RAM':>9} | {'Sys CPU%':>8}")
    print("-"*92)
    for u in users_list:
        rep = reports[str(u)]
        g = rep["global"]
        r = rep["resources"]
        print(f"{u:>6} | {g['rps']:>7.1f} | {g['error_rate']:>4.1f}% | {g['p50']:>6.1f} | {g['p95']:>6.1f} | {g['p99']:>6.1f} | {r.get('node_cpu_avg',0):>8.1f}% | {r.get('node_ram_mb_avg',0):>7.0f}MB | {r.get('mysql_ram_mb_avg',0):>8.0f}MB | {r.get('sys_cpu_avg',0):>7.1f}%")
    print("-"*92)

    # Graphique textuel RPS vs users
    max_rps = max(reports[str(u)]["global"]["rps"] for u in users_list) if reports else 1
    print("\n Graphique RPS (échelle 40 chars = max RPS)")
    for u in users_list:
        rps = reports[str(u)]["global"]["rps"]
        bar = "#" * int(rps / max_rps * 40) if max_rps else ""
        print(f"  {u:>3} users | {rps:>6.1f} RPS | {bar}")

    max_cpu = max((reports[str(u)]["resources"].get("node_cpu_avg",0) for u in users_list), default=1)
    print("\n Graphique Node CPU% (40 chars = max)")
    for u in users_list:
        cpu = reports[str(u)]["resources"].get("node_cpu_avg",0)
        bar = "*" * int(cpu / max_cpu * 40) if max_cpu else ""
        print(f"  {u:>3} users | {cpu:>5.1f}% | {bar}")

    # Sauvegarde aussi un CSV simple
    csv_path = PERF_DIR / "measure_summary.csv"
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write("users,rps,error_rate,p50,p95,p99,node_cpu_avg,node_ram_mb_avg,mysql_ram_mb_avg,sys_cpu_avg\n")
        for u in users_list:
            g = reports[str(u)]["global"]
            r = reports[str(u)]["resources"]
            f.write(f"{u},{g['rps']:.2f},{g['error_rate']:.2f},{g['p50']:.1f},{g['p95']:.1f},{g['p99']:.1f},{r.get('node_cpu_avg',0):.1f},{r.get('node_ram_mb_avg',0):.0f},{r.get('mysql_ram_mb_avg',0):.0f},{r.get('sys_cpu_avg',0):.1f}\n")
    print(f"[OUT] CSV -> {csv_path}")

    return summary

if __name__ == "__main__":
    main()
