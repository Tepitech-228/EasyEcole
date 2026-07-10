import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cours-player-page',
  templateUrl: './cours-player-page.component.html',
  styleUrls: ['./cours-player-page.component.scss']
})
export class CoursPlayerPageComponent implements OnInit {
  cours: any = null;
  loading = false;
  moduleActif: any = null;
  supportActif: any = null;
  sidebarOuverte = true;
  afficherQuiz = false;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loading = true;
      this.http.get(`${environment.API_URL}/elearning/cours/${id}/player`).subscribe({
        next: (data: any) => {
          this.cours = data;
          this.loading = false;
          this.ouvrirPremierSupport();
        },
        error: () => this.loading = false
      });
    }
  }

  get modulesOrdonnes(): any[] {
    if (!this.cours?.modules) return [];
    return [...this.cours.modules].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  }

  get supportsActifs(): any[] {
    if (!this.moduleActif?.supports) return [];
    return this.moduleActif.supports;
  }

  estDisponible(module: any): boolean {
    if (!module.dateDisponible) return true;
    return new Date(module.dateDisponible) <= new Date();
  }

  progressionModule(module: any): number {
    if (!module?.supports?.length || !this.cours?.progressionApprenant) return 0;
    const termines = module.supports.filter((s: any) => this.cours.progressionApprenant[s.id]?.termine).length;
    return Math.round((termines / module.supports.length) * 100);
  }

  supportTermine(supportId: number): boolean {
    return !!this.cours?.progressionApprenant?.[supportId]?.termine;
  }

  ouvrirPremierSupport(): void {
    const premierModule = this.modulesOrdonnes.find(m => this.estDisponible(m) && m.supports?.length);
    if (premierModule) {
      this.ouvrirModule(premierModule);
      this.ouvrirSupport(premierModule.supports[0]);
    }
  }

  ouvrirModule(module: any): void {
    this.moduleActif = module;
    this.supportActif = null;
  }

  ouvrirSupport(support: any): void {
    this.supportActif = support;
    this.afficherQuiz = false;
    if (this.cours?.progressionApprenant) {
      const prog = this.cours.progressionApprenant[support.id];
      if (!prog?.termine) {
        this.marquerAcces(support.id);
      }
    }
  }

  marquerAcces(supportId: number): void {
    this.http.post(`${environment.API_URL}/elearning/progression-apprenant/marquer-termine`, {
      supportId,
      tempsPasse: 0
    }).subscribe();
  }

  marquerTermine(support: any): void {
    this.http.post(`${environment.API_URL}/elearning/progression-apprenant/marquer-termine`, {
      supportId: support.id,
      tempsPasse: 30
    }).subscribe({
      next: () => {
        if (this.cours) {
          if (!this.cours.progressionApprenant) this.cours.progressionApprenant = {};
          this.cours.progressionApprenant[support.id] = { termine: true, tempsPasse: 30, dernierAcces: new Date() };
          this.recalculerTaux();
        }
      }
    });
  }

  recalculerTaux(): void {
    if (!this.cours?.modules) return;
    const supportIds: number[] = [];
    for (const m of this.cours.modules) {
      for (const s of m.supports || []) {
        supportIds.push(s.id);
      }
    }
    const termines = supportIds.filter(id => this.cours.progressionApprenant[id]?.termine).length;
    this.cours.progressionTaux = supportIds.length > 0 ? Math.round((termines / supportIds.length) * 100) : 0;
  }

  supportSuivant(): void {
    const supports = this.supportsActifs;
    const idx = supports.findIndex(s => s.id === this.supportActif?.id);
    if (idx < supports.length - 1) {
      this.ouvrirSupport(supports[idx + 1]);
    } else {
      const modules = this.modulesOrdonnes.filter(m => this.estDisponible(m));
      const modIdx = modules.findIndex(m => m.id === this.moduleActif?.id);
      if (modIdx < modules.length - 1) {
        const prochainModule = modules[modIdx + 1];
        this.ouvrirModule(prochainModule);
        if (prochainModule.supports?.length) {
          this.ouvrirSupport(prochainModule.supports[0]);
        }
      }
    }
  }

  supportPrecedent(): void {
    const supports = this.supportsActifs;
    const idx = supports.findIndex(s => s.id === this.supportActif?.id);
    if (idx > 0) {
      this.ouvrirSupport(supports[idx - 1]);
    }
  }

  lancerQuiz(quiz: any): void {
    this.router.navigate(['/elearning/quiz', quiz.id]);
  }

  typeMedia(support: any): string {
    if (support.type === 'video') return 'video';
    if (support.type === 'pdf' || support.fichierOriginal?.endsWith('.pdf')) return 'pdf';
    return 'document';
  }

  get pdfUrl(): SafeResourceUrl | null {
    if (!this.supportActif) return null;
    const path = `/elearning/videos/${this.supportActif.fichierOriginal}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(path);
  }
}
