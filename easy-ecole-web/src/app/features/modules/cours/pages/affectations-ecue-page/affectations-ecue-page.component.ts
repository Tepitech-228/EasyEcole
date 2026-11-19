import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { EcueAffectation, EcueService } from 'src/app/data/modules/inscription/services/ecue.service';
import { Enseignant } from 'src/app/data/modules/auth/models/Enseignant.model';
import { EnseignantService } from 'src/app/data/modules/auth/services/enseignant.service';

interface GroupeUe {
  coursId: string
  code: string
  intitule: string
  parcours: string
  niveau: string
  classe: string
  credits: number
  ecues: EcueAffectation[]
}

@Component({
  selector: 'app-affectations-ecue-page',
  templateUrl: './affectations-ecue-page.component.html',
  styleUrls: ['./affectations-ecue-page.component.scss']
})
export class AffectationsEcuePageComponent extends BaseComponentClass implements OnInit, OnDestroy {
  ecues: EcueAffectation[] = [];
  enseignants: Enseignant[] = [];
  chargement = true;
  erreur = '';
  messageSucces = '';
  recherche = '';
  parcoursSelectionne = '';
  niveauSelectionne = '';
  classeSelectionnee = '';
  readonly affectationsEnCours = new Set<string>();
  readonly uesEnCours = new Set<string>();
  private succesTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private ecueService: EcueService,
    private enseignantService: EnseignantService
  ) {
    super();
  }

  ngOnInit(): void {
    this.charger();
  }

  ngOnDestroy(): void {
    if (this.succesTimer) clearTimeout(this.succesTimer);
  }

  get peutAffecter(): boolean {
    return this.rolesValue.isInstitution || this.rolesValue.isAdmin || this.rolesValue.isSuperviseurGeneral;
  }

  charger(): void {
    this.chargement = true;
    this.erreur = '';
    forkJoin({
      ecues: this.ecueService.getForTeacherAssignments(),
      enseignants: this.enseignantService.getAll()
    }).subscribe({
      next: result => {
        this.ecues = result.ecues || [];
        this.enseignants = result.enseignants || [];
        this.chargement = false;
      },
      error: err => {
        this.erreur = err?.error?.message || 'Impossible de charger les UE, ECUE et les enseignants.';
        this.chargement = false;
      }
    });
  }

  get enseignantsTries(): Enseignant[] {
    return [...this.enseignants].sort((a, b) => this.nomEnseignant(a).localeCompare(this.nomEnseignant(b), 'fr'));
  }

  get parcoursDisponibles(): Array<{ id: string; label: string }> {
    const parcours = new Map<string, string>();
    this.ecues.forEach(ecue => {
      const item = ecue.cours?.parcours;
      if (item?.id) parcours.set(String(item.id), `${item.type || 'Parcours'} — ${item.titre || ''}`.trim());
    });
    return Array.from(parcours, ([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }

  get niveauxDisponibles(): Array<{ id: string; label: string }> {
    const niveaux = new Map<string, string>();
    this.ecues
      .filter(ecue => !this.parcoursSelectionne || String(ecue.cours?.parcours?.id) === this.parcoursSelectionne)
      .forEach(ecue => {
        const niveau = ecue.cours?.parcours?.niveauEtude;
        if (niveau?.id) niveaux.set(String(niveau.id), niveau.libelle || '');
      });
    return Array.from(niveaux, ([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }

  get classesDisponibles(): Array<{ id: string; label: string }> {
    const classes = new Map<string, string>();
    this.ecues
      .filter(ecue => !this.parcoursSelectionne || String(ecue.cours?.parcours?.id) === this.parcoursSelectionne)
      .filter(ecue => !this.niveauSelectionne || String(ecue.cours?.parcours?.niveauEtudeId) === this.niveauSelectionne)
      .forEach(ecue => {
        const groupe = ecue.cours?.classe;
        if (groupe?.id) classes.set(String(groupe.id), groupe.libelle || '');
      });
    return Array.from(classes, ([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }

  get ecuesFiltres(): EcueAffectation[] {
    const terme = this.recherche.trim().toLocaleLowerCase('fr');
    return this.ecues.filter(ecue => {
      const cours = ecue.cours;
      if (this.parcoursSelectionne && String(cours?.parcours?.id) !== this.parcoursSelectionne) return false;
      if (this.niveauSelectionne && String(cours?.parcours?.niveauEtudeId) !== this.niveauSelectionne) return false;
      if (this.classeSelectionnee && String(cours?.classe?.id) !== this.classeSelectionnee) return false;
      if (!terme) return true;
      const contenu = [
        cours?.code,
        cours?.intitule,
        cours?.classe?.libelle,
        cours?.parcours?.titre,
        cours?.parcours?.type,
        cours?.parcours?.niveauEtude?.libelle,
        ecue.code,
        ecue.libelle,
        ecue.enseignant?.utilisateur?.nom,
        ecue.enseignant?.utilisateur?.prenoms
      ].join(' ').toLocaleLowerCase('fr');
      return contenu.includes(terme);
    });
  }

  get groupesUe(): GroupeUe[] {
    const groupes = new Map<string, GroupeUe>();
    this.ecuesFiltres.forEach(ecue => {
      const cours = ecue.cours;
      const cle = String(cours?.id || ecue.coursId || 'sans-ue');
      let groupe = groupes.get(cle);
      if (!groupe) {
        groupe = {
          coursId: cle,
          code: cours?.code || 'UE',
          intitule: cours?.intitule || 'Unité d’enseignement',
          parcours: cours?.parcours?.titre || '',
          niveau: cours?.parcours?.niveauEtude?.libelle || '',
          classe: cours?.classe?.libelle || '',
          credits: Number(cours?.creditEcts ?? cours?.credit ?? 0),
          ecues: []
        };
        groupes.set(cle, groupe);
      }
      groupe.ecues.push(ecue);
    });

    return Array.from(groupes.values()).sort((a, b) => a.code.localeCompare(b.code, 'fr'));
  }

  get nombreUe(): number {
    return new Set(this.ecues.map(ecue => String(ecue.cours?.id || ecue.coursId || ''))).size;
  }

  get nombreEcue(): number {
    return this.ecues.length;
  }

  get nombreAffectes(): number {
    return this.ecues.filter(ecue => !!ecue.enseignantId).length;
  }

  get nombreNonAffectes(): number {
    return this.nombreEcue - this.nombreAffectes;
  }

  get tauxAffectation(): number {
    if (this.nombreEcue === 0) return 0;
    return Math.round((this.nombreAffectes / this.nombreEcue) * 100);
  }

  get filtresActifs(): boolean {
    return !!(this.recherche.trim() || this.parcoursSelectionne || this.niveauSelectionne || this.classeSelectionnee);
  }

  changerParcours(): void {
    this.niveauSelectionne = '';
    this.classeSelectionnee = '';
  }

  changerNiveau(): void {
    this.classeSelectionnee = '';
  }

  reinitialiserFiltres(): void {
    this.recherche = '';
    this.parcoursSelectionne = '';
    this.niveauSelectionne = '';
    this.classeSelectionnee = '';
  }

  nomEnseignant(enseignant?: { utilisateur?: { nom?: string; prenoms?: string } } | null): string {
    const utilisateur = enseignant?.utilisateur;
    return `${utilisateur?.prenoms || ''} ${utilisateur?.nom || ''}`.trim() || 'Enseignant';
  }

  initialesEnseignant(enseignant?: { utilisateur?: { nom?: string; prenoms?: string } } | null): string {
    const utilisateur = enseignant?.utilisateur;
    const initiales = `${utilisateur?.prenoms?.charAt(0) || ''}${utilisateur?.nom?.charAt(0) || ''}`.toUpperCase();
    return initiales || '?';
  }

  libelleEnseignantEcue(ecue: EcueAffectation): string {
    if (!ecue.enseignantId) return 'Non affecté';
    return ecue.enseignant ? this.nomEnseignant(ecue.enseignant) : 'Enseignant affecté';
  }

  volumeHoraire(ecue: EcueAffectation): number {
    return (Number(ecue.cmHoraire) || 0) + (Number(ecue.tdTpHoraire) || 0) + (Number(ecue.tpeHoraire) || 0);
  }

  enseignantCommunId(groupe: GroupeUe): string {
    const ids = new Set(groupe.ecues.map(ecue => String(ecue.enseignantId || '')));
    if (ids.size === 1) {
      const [id] = Array.from(ids);
      return id || '';
    }
    return '';
  }

  affecterEnseignant(ecue: EcueAffectation, enseignantId: string): void {
    if (!this.peutAffecter || !ecue.id || this.affectationsEnCours.has(ecue.id)) return;
    const nouvelEnseignantId = enseignantId || null;
    if (String(ecue.enseignantId || '') === String(nouvelEnseignantId || '')) return;

    this.messageSucces = '';
    this.erreur = '';
    this.affectationsEnCours.add(ecue.id);
    this.ecueService.assignerEnseignant(ecue.id, nouvelEnseignantId).subscribe({
      next: response => {
        ecue.enseignantId = response?.enseignantId ?? nouvelEnseignantId;
        ecue.enseignant = response?.enseignant
          || this.enseignants.find(enseignant => String(enseignant.id) === String(nouvelEnseignantId))
          || undefined;
        this.affectationsEnCours.delete(ecue.id!);
        this.afficherSucces(`${ecue.code || ecue.libelle || 'ECUE'} : ${nouvelEnseignantId ? 'affectation enregistrée' : 'enseignant retiré'}.`);
      },
      error: err => {
        this.affectationsEnCours.delete(ecue.id!);
        this.rechargerApresEchec(err?.error?.message || 'L’affectation du professeur a échoué.');
      }
    });
  }

  affecterUe(groupe: GroupeUe, enseignantId: string): void {
    if (!this.peutAffecter || this.uesEnCours.has(groupe.coursId)) return;
    const nouvelEnseignantId = enseignantId || null;
    const aModifier = groupe.ecues.filter(ecue => ecue.id && String(ecue.enseignantId || '') !== String(nouvelEnseignantId || ''));
    if (aModifier.length === 0) return;

    this.messageSucces = '';
    this.erreur = '';
    this.uesEnCours.add(groupe.coursId);
    aModifier.forEach(ecue => this.affectationsEnCours.add(ecue.id!));

    forkJoin(aModifier.map(ecue => this.ecueService.assignerEnseignant(ecue.id!, nouvelEnseignantId))).subscribe({
      next: () => {
        aModifier.forEach(ecue => {
          ecue.enseignantId = nouvelEnseignantId;
          ecue.enseignant = this.enseignants.find(enseignant => String(enseignant.id) === String(nouvelEnseignantId)) || undefined;
          this.affectationsEnCours.delete(ecue.id!);
        });
        this.uesEnCours.delete(groupe.coursId);
        this.afficherSucces(`${groupe.code} : ${aModifier.length} ECUE ${nouvelEnseignantId ? 'affecté(s)' : 'désaffecté(s)'}.`);
      },
      error: err => {
        aModifier.forEach(ecue => this.affectationsEnCours.delete(ecue.id!));
        this.uesEnCours.delete(groupe.coursId);
        this.rechargerApresEchec(err?.error?.message || 'L’affectation de l’UE a échoué.');
      }
    });
  }

  trackByUe(_: number, groupe: GroupeUe): string {
    return groupe.coursId;
  }

  trackByEcue(_: number, ecue: EcueAffectation): string {
    return String(ecue.id || ecue.code || '');
  }

  private afficherSucces(message: string): void {
    this.messageSucces = message;
    if (this.succesTimer) clearTimeout(this.succesTimer);
    this.succesTimer = setTimeout(() => { this.messageSucces = ''; }, 5000);
  }

  private rechargerApresEchec(message: string): void {
    this.ecueService.getForTeacherAssignments().subscribe({
      next: ecues => {
        this.ecues = ecues || [];
        this.erreur = message;
      },
      error: () => { this.erreur = message; }
    });
  }
}
