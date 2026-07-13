import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';

@Component({
  selector: 'app-forgot-password-page',
  templateUrl: './forgot-password-page.component.html',
  styleUrls: ['./forgot-password-page.component.scss']
})
export class ForgotPasswordPageComponent {
  sending: boolean = false
  success: boolean = false
  error: boolean = false

  form: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  })

  constructor(private authService: AuthService) { }

  sendResetLink(): void {
    this.sending = true
    this.error = false
    this.authService.sendPasswordResetLink(this.form.get('email')?.value).subscribe({
      next: () => {
        this.sending = false
        this.success = true
      },
      error: () => {
        this.sending = false
        this.error = true
      }
    })
  }
}
