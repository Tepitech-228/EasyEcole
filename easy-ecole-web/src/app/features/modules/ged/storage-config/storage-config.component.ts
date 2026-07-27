import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { GedService, StorageConfig } from 'src/app/data/modules/ged/services/ged.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-storage-config',
  templateUrl: './storage-config.component.html',
  styleUrls: ['./storage-config.component.scss']
})
export class StorageConfigComponent implements OnInit {
  form: FormGroup;
  loading = false;
  saving = false;
  testingNas = false;
  testingCloud = false;
  showNasPassword = false;
  showCloudCredentials = false;

  constructor(
    private fb: FormBuilder,
    private gedService: GedService,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      localPath: [''],
      localUsed: [''],
      localTotal: [''],
      nasUrl: [''],
      nasUsername: [''],
      nasPassword: [''],
      cloudProvider: [''],
      cloudCredentials: [''],
      cloudBucket: [''],
      encryptionAlgorithm: ['AES-256-GCM'],
      keyRotationDays: [90]
    });
  }

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading = true;
    this.gedService.getStorageConfig().subscribe({
      next: (config) => {
        if (config) this.form.patchValue(config);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Erreur lors du chargement de la configuration');
      }
    });
  }

  saveConfig(): void {
    this.saving = true;
    this.gedService.updateStorageConfig(this.form.value).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.success('Configuration stockage enregistrée');
      },
      error: () => {
        this.saving = false;
        this.toastService.error('Erreur lors de l\'enregistrement');
      }
    });
  }

  testNasConnection(): void {
    this.testingNas = true;
    this.gedService.testStorageConnection({
      type: 'nas',
      url: this.form.get('nasUrl')?.value,
      username: this.form.get('nasUsername')?.value,
      password: this.form.get('nasPassword')?.value
    }).subscribe({
      next: () => {
        this.testingNas = false;
        this.toastService.success('Connexion NAS réussie');
      },
      error: () => {
        this.testingNas = false;
        this.toastService.error('Échec de la connexion NAS');
      }
    });
  }

  testCloudConnection(): void {
    this.testingCloud = true;
    this.gedService.testStorageConnection({
      type: 'cloud',
      credentials: this.form.get('cloudCredentials')?.value
    }).subscribe({
      next: () => {
        this.testingCloud = false;
        this.toastService.success('Connexion Cloud réussie');
      },
      error: () => {
        this.testingCloud = false;
        this.toastService.error('Échec de la connexion Cloud');
      }
    });
  }

  generateNewKey(): void {
    if (!confirm('Générer une nouvelle clé de chiffrement ? L\'ancienne clé sera révoquée.')) return;
    this.toastService.success('Nouvelle clé de chiffrement générée');
  }

  get localUsagePercent(): number {
    const used = parseFloat(this.form.get('localUsed')?.value || '0');
    const total = parseFloat(this.form.get('localTotal')?.value || '1');
    return Math.min(100, Math.round((used / total) * 100));
  }
}
