"""
login_page.py — Page Object pour la page de connexion EasyEcole.

Localise les éléments de la page /auth/connexion :
- Champ email/nom d'utilisateur (formControlName="usernameOrEmail")
- Champ mot de passe (formControlName="password")
- Bouton "Se connecter" (type="submit")

Usage :
    from pages.login_page import LoginPage
    page = LoginPage(driver)
    page.login("tepitechbuild@gmail.com", "Admin@2026!")
"""

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webdriver import WebDriver

# Définition des sélecteurs CSS correspondant à la connexion-page.component.html
SELECTOR_USERNAME = "input[formcontrolname='usernameOrEmail']"
SELECTOR_PASSWORD = "input[formcontrolname='password']"
SELECTOR_LOGIN_BUTTON = "button[type='submit']"
SELECTOR_ERROR_MESSAGE = "app-custom-alert[title='Erreur']"
SELECTOR_EMPTY_ERROR = "app-custom-alert[title='Erreur']"


class LoginPage:
    """Page Object pour la page de connexion."""

    def __init__(self, driver: WebDriver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 20)

    def navigate(self, base_url: str = "http://localhost:4200"):
        """Navigue vers la page de connexion."""
        self.driver.get(f"{base_url}/auth/connexion")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_USERNAME)))
        print("[LOGIN_PAGE] Page de connexion chargée.")

    def enter_username(self, username_or_email: str):
        """Saisit l'identifiant ou l'email dans le champ usernameOrEmail."""
        field = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_USERNAME)))
        field.clear()
        field.send_keys(username_or_email)
        print(f"[LOGIN_PAGE] Identifiant saisi : {username_or_email}")

    def enter_password(self, password: str):
        """Saisit le mot de passe dans le champ password."""
        field = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_PASSWORD)
        field.clear()
        field.send_keys(password)
        print(f"[LOGIN_PAGE] Mot de passe saisi.")

    def click_login(self):
        """Clique sur le bouton 'Se connecter'."""
        button = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, SELECTOR_LOGIN_BUTTON)))
        button.click()
        print("[LOGIN_PAGE] Bouton 'Se connecter' cliqué.")

    def login(self, username_or_email: str, password: str, base_url: str = "http://localhost:4200"):
        """
        Effectue la connexion complète : navigation, saisie, clic.
        Retourne le LoginPage pour chaînage.
        """
        self.navigate(base_url)
        self.enter_username(username_or_email)
        self.enter_password(password)
        self.click_login()
        return self

    def get_error_message(self) -> str:
        """Récupère le message d'erreur affiché (si identifiants incorrects)."""
        try:
            error_el = self.driver.find_element(By.CSS_SELECTOR, SELECTOR_ERROR_MESSAGE)
            return error_el.text
        except Exception:
            return ""

    def is_login_page_displayed(self) -> bool:
        """Vérifie que la page de connexion est bien affichée."""
        try:
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, SELECTOR_USERNAME)))
            return True
        except Exception:
            return False
