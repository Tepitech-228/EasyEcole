from pages.bulletins_page import BulletinsPage
from pages.dashboard_page import DashboardPage
print("BulletinsPage import OK")
methods = [m for m in dir(BulletinsPage) if not m.startswith('_')]
print(f"BulletinsPage methods: {len(methods)}")
print(f"DashboardPage has go_to_bulletins: {'go_to_bulletins' in dir(DashboardPage)}")
