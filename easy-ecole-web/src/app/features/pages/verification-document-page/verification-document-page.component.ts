import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-verification-document-page',
  templateUrl: './verification-document-page.component.html',
  styleUrls: ['./verification-document-page.component.scss']
})
export class VerificationDocumentPageComponent implements OnInit {
  form: FormGroup = new FormGroup({
    matricule: new FormControl('', [Validators.required]),
    reference: new FormControl('', [Validators.required]),
  });

  result: any = null;
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    const matricule = this.route.snapshot.paramMap.get('matricule');
    const reference = this.route.snapshot.paramMap.get('reference');
    if (matricule && reference) {
      this.form.patchValue({ matricule, reference });
      this.verifier();
    }
  }

  get matricule() { return this.form.get('matricule'); }
  get reference() { return this.form.get('reference'); }

  verifier(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    this.result = null;

    const { matricule, reference } = this.form.value;
    const url = `${environment.API_URL}/verification/document/${encodeURIComponent(matricule)}/${encodeURIComponent(reference)}`;

    this.http.get(url).subscribe({
      next: (res: any) => {
        this.result = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Document introuvable ou invalide';
        this.loading = false;
      }
    });
  }
}
