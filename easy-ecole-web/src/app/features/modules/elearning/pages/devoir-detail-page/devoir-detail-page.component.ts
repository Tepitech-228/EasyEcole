import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-devoir-detail-page',
  templateUrl: './devoir-detail-page.component.html',
  styleUrls: ['./devoir-detail-page.component.scss']
})
export class DevoirDetailPageComponent extends BaseComponentClass implements OnInit {
  devoir: any = null;
  submissionForm: FormGroup;
  submitted = false;
  submitSuccess = false;
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    super();
    this.submissionForm = this.fb.group({
      contenu: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
  }

  soumettre(): void {
    this.submitted = true;
    if (this.submissionForm.invalid) return;

    this.devoir.statut = 'soumis';
    this.devoir.soumission = this.submissionForm.value.contenu;
    this.submitSuccess = true;
  }

  goBack(): void {
    this.router.navigate(['/elearning/devoirs']);
  }

  canSubmit(): boolean {
    return this.devoir?.statut === 'à rendre';
  }

  isLate(): boolean {
    return this.devoir && new Date(this.devoir.dateLimite) < new Date();
  }
}

