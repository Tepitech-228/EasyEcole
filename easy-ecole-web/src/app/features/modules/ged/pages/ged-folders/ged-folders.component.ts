import { Component, OnInit } from '@angular/core';
import { GedService } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-folders',
  templateUrl: './ged-folders.component.html',
  styleUrls: ['./ged-folders.component.scss']
})
export class GedFoldersComponent implements OnInit {
  folders: any[] = [];
  newName: string = '';

  constructor(private gedService: GedService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.gedService.getFolders().subscribe({ next: f => this.folders = f });
  }

  create() {
    if (!this.newName) return;
    this.gedService.createFolder({ nom: this.newName }).subscribe({ next: () => { this.newName=''; this.load(); }, error: e => alert('Erreur: ' + (e.error?.message || e.statusText)) });
  }

  remove(id: number) {
    if (!confirm('Supprimer ce dossier ?')) return;
    this.gedService.deleteFolder(String(id)).subscribe({ next: () => this.load(), error: e => alert('Erreur: ' + (e.error?.message || e.statusText)) });
  }
}

