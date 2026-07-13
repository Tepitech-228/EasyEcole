import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';

@Component({
  selector: 'app-reset-password-page',
  templateUrl: './reset-password-page.component.html',
  styleUrls: ['./reset-password-page.component.scss']
})
export class ResetPasswordPageComponent implements OnInit {
  token: string = ''
  resetting: boolean = false
  success: boolean = false
  error: boolean = false
  confirmError: boolean = false

  form: FormGroup = new FormGroup({
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required]),
  })

  constructor(private route: ActivatedRoute, private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || ''
    })
  }

  resetPassword(): void {
    if (this.form.get('password')?.value !== this.form.get('confirmPassword')?.value) {
      this.confirmError = true
      setTimeout(() => this.confirmError = false, 3000)
      return
    }

    this.resetting = true
    this.error = false
    this.authService.resetPasswordWithToken(this.token, this.form.get('password')?.value).subscribe({
      next: () => {
        this.resetting = false
        this.success = true
        setTimeout(() => this.router.navigate(['/auth/connexion']), 2000)
      },
      error: () => {
        this.resetting = false
        this.error = true
      }
    })
  }
}
