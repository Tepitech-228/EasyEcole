import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

interface OnboardingStep {
  numero: number;
  label: string;
  description: string;
  etat: 'en_attente' | 'encours' | 'fait' | 'bloque';
  route: string | null;
}

@Component({
  selector: 'app-onboarding-page',
  templateUrl: './onboarding-page.component.html',
  styleUrls: ['./onboarding-page.component.scss']
})
export class OnboardingPageComponent extends BaseComponentClass implements OnInit {
  readonly API_URL = environment.API_URL;
  loading = true;
  utilisateur: any = null;
  apprenant: any = null;
  demande: any = null;
  message: string | null = null;
  messageType: 'success' | 'info' | 'warning' | 'error' = 'info';

  steps: OnboardingStep[] = [
    { numero: 1, label: 'Compte créé', description: 'Votre compte a été créé avec succès', etat: 'fait', route: null },
    { numero: 2, label: 'Informations personnelles', description: 'Complétez votre profil étudiant', etat: 'en_attente', route: '/parametres/profil' },
    { numero: 3, label: 'Demande d\'inscription', description: 'Créez votre demande d\'inscription', etat: 'en_attente', route: null },
    { numero: 4, label: 'Choix du parcours', description: 'Sélectionnez votre filière', etat: 'en_attente', route: null },
    { numero: 5, label: 'Documents', description: 'Fournissez les pièces requises', etat: 'en_attente', route: null },
    { numero: 6, label: 'Préinscription', description: 'Validation par le comité d\'orientation', etat: 'en_attente', route: null },
    { numero: 7, label: 'Choix des cours', description: 'Inscrivez-vous aux cours', etat: 'en_attente', route: null },
    { numero: 8, label: 'Paiements', description: 'Réglez les frais d\'inscription', etat: 'en_attente', route: null },
    { numero: 9, label: 'Validation finale', description: 'Inscription validée par l\'administration', etat: 'en_attente', route: null },
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
  ) { super(); }

  ngOnInit(): void {
    this.chargerEtat();
  }

  private chargerEtat(): void {
    this.loading = true;
    this.http.get(`${this.API_URL}/auth/utilisateurs/moi`).subscribe({
      next: (u: any) => {
        this.utilisateur = u;
        this.apprenant = u.apprenant || null;
        this.verifierProfil();
      },
      error: () => {
        this.loading = false;
        this.setMessage('Erreur lors du chargement de votre profil', 'error');
      }
    });
  }

  private verifierProfil(): void {
    if (this.apprenant) {
      this.steps[1].etat = 'fait';
      this.chargerDemande();
    } else {
      this.steps[1].etat = 'encours';
      this.steps[1].route = '/parametres/profil?onboarding=true';
      this.loading = false;
    }
  }

  private chargerDemande(): void {
    this.http.get(`${this.API_URL}/inscription/demandesInscription?limit=1&page=1`).subscribe({
      next: (res: any) => {
        const demandes: any[] = res?.data || [];
        if (demandes.length > 0) {
          this.demande = demandes[0];
          this.verifierEtatDemande();
        } else {
          this.steps[2].etat = 'encours';
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private verifierEtatDemande(): void {
    if (!this.demande) return;

    this.steps[2].etat = 'fait';
    this.steps[2].route = null;

    const d = this.demande;

    // Parcours
    if (d.parcoursChoisis && d.parcoursChoisis.length > 0) {
      this.steps[3].etat = 'fait';
      this.marquerEtapesSuivantes(3);
    } else {
      this.steps[3].etat = 'encours';
      this.steps[3].route = `/inscription/demandes/${d.id}`;
      this.finaliser();
      return;
    }

    // Documents
    const dossiersRequis = d.session?.dossiersInscription || [];
    const dossiersUploades = d.dossiersDemande || [];
    if (dossiersRequis.length === 0 || dossiersUploades.length > 0) {
      this.steps[4].etat = 'fait';
      this.marquerEtapesSuivantes(4);
    } else {
      this.steps[4].etat = 'encours';
      this.steps[4].route = `/inscription/demandes/${d.id}`;
      this.finaliser();
      return;
    }

    // Préinscription
    if (d.preInscription) {
      if (d.preInscription.statut === 'valide') {
        this.steps[5].etat = 'fait';
        this.marquerEtapesSuivantes(5);
      } else if (d.preInscription.statut === 'rejete') {
        this.steps[5].etat = 'bloque';
        this.steps[5].description = 'Pré-inscription rejetée — contactez l\'administration';
        this.finaliser();
        return;
      } else {
        this.steps[5].etat = 'encours';
        this.finaliser();
        return;
      }
    } else {
      this.steps[5].etat = 'encours';
      this.steps[5].route = `/inscription/demandes/${d.id}`;
      this.finaliser();
      return;
    }

    // Cours
    if (d.coursChoisis && d.coursChoisis.length > 0) {
      this.steps[6].etat = 'fait';
      this.marquerEtapesSuivantes(6);
    } else {
      this.steps[6].etat = 'encours';
      this.steps[6].route = `/inscription/demandes/${d.id}/choix-cours`;
      this.finaliser();
      return;
    }

    // Paiements
    const fraisPayes = d.paiementsInscription?.reduce((acc: number, p: any) => acc + (p.montant || 0), 0) || 0;
    let fraisTotal = 0;
    d.session?.fraisInscription?.forEach((f: any) => {
      if (f.fraisDesCours && d.cours) {
        fraisTotal += d.cours.reduce((acc: number, c: any) => acc + f.montant * (c.credit || 0), 0);
      } else {
        fraisTotal += f.montant;
      }
    });

    if (fraisPayes >= fraisTotal) {
      this.steps[7].etat = 'fait';
      this.marquerEtapesSuivantes(7);
    } else {
      this.steps[7].etat = 'encours';
      this.steps[7].route = `/inscription/demandes/${d.id}`;
      this.finaliser();
      return;
    }

    // Validation
    if (d.dateValidation) {
      this.steps[8].etat = 'fait';
    } else {
      this.steps[8].etat = 'encours';
      this.steps[8].route = `/inscription/demandes/${d.id}`;
    }

    this.finaliser();
  }

  private marquerEtapesSuivantes(jusqua: number): void {
    for (let i = 2; i <= jusqua; i++) {
      if (this.steps[i].etat === 'en_attente') {
        this.steps[i].etat = 'fait';
      }
    }
  }

  private finaliser(): void {
    this.loading = false;
  }

  creerDemande(): void {
    this.loading = true;
    this.http.get(`${this.API_URL}/inscription/sessions`).subscribe({
      next: (res: any) => {
        const sessions = (Array.isArray(res) ? res : []).filter((s: any) => {
          const now = new Date();
          const debut = new Date(s.dateDebut);
          const fin = new Date(s.dateFin);
          return now >= debut && now <= fin;
        });

        if (sessions.length === 0) {
          this.setMessage('Aucune session d\'inscription ouverte pour le moment', 'warning');
          this.loading = false;
          return;
        }

        const body = { dateDemande: new Date(), sessionId: sessions[0].id };
        this.http.post(`${this.API_URL}/inscription/demandesInscription`, body).subscribe({
          next: (res2: any) => {
            this.setMessage('Demande créée avec succès !', 'success');
            setTimeout(() => {
              this.router.navigate(['/inscription/demandes', res2.id]);
            }, 1000);
          },
          error: (err: HttpErrorResponse) => {
            if (err.error?.alreadySignUp) {
              this.setMessage('Vous avez déjà une demande d\'inscription en cours', 'info');
              this.chargerDemande();
            } else {
              this.setMessage('Erreur lors de la création de la demande', 'error');
              this.loading = false;
            }
          }
        });
      },
      error: () => {
        this.setMessage('Erreur lors du chargement des sessions', 'error');
        this.loading = false;
      }
    });
  }

  continuer(step: OnboardingStep): void {
    if (step.route) {
      this.router.navigateByUrl(step.route);
    }
  }

  allerAuTableauDeBord(): void {
    this.router.navigate(['/']);
  }

  private setMessage(text: string, type: 'success' | 'info' | 'warning' | 'error'): void {
    this.message = text;
    this.messageType = type;
  }

  get progression(): number {
    const faits = this.steps.filter(s => s.etat === 'fait' || s.etat === 'bloque').length;
    return Math.round((faits / this.steps.length) * 100);
  }

  get etapeCourante(): OnboardingStep | null {
    return this.steps.find(s => s.etat === 'encours') || null;
  }

  get estTermine(): boolean {
    return this.steps.every(s => s.etat === 'fait');
  }
}
