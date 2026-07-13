import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';

@Component({
  selector: 'app-confirm-email-page',
  templateUrl: './confirm-email-page.component.html',
  styleUrls: ['./confirm-email-page.component.scss']
})
export class ConfirmEmailPageComponent implements OnInit {
  loading: boolean = true
  success: boolean = false
  error: boolean = false

  constructor(private route: ActivatedRoute, private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token']
      if (token) {
        this.authService.confirmEmail(token).subscribe({
          next: () => {
            this.loading = false
            this.success = true
            setTimeout(() => this.router.navigate(['/auth/connexion']), 3000)
          },
          error: () => {
            this.loading = false
            this.error = true
          }
        })
      } else {
        this.loading = false
        this.error = true
      }
    })
  }
}
