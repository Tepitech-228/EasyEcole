import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-upload-support-page',
  templateUrl: './upload-support-page.component.html',
  styleUrls: ['./upload-support-page.component.scss']
})
export class UploadSupportPageComponent implements OnInit {
  coursId: string | null = null;
  modules: any[] = [];
  selectedModuleId = '';
  supportType = 'document';
  selectedFile: File | null = null;
  uploading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.coursId = this.route.snapshot.paramMap.get('id');
    if (this.coursId) {
      this.http.get(`${environment.API_URL}/elearning/modules?coursId=${this.coursId}`).subscribe({
        next: (data: any) => this.modules = data
      });
    }
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
  }

  upload(): void {
    if (!this.selectedFile || !this.selectedModuleId) return;

    this.uploading = true;
    const formData = new FormData();
    formData.append('fichier', this.selectedFile);
    formData.append('moduleId', this.selectedModuleId);
    formData.append('type', this.supportType);

    this.http.post(`${environment.API_URL}/elearning/supports`, formData).subscribe({
      next: () => {
        this.successMessage = 'Support uploadé avec succès.';
        this.uploading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de l\'upload.';
        this.uploading = false;
      }
    });
  }
}

