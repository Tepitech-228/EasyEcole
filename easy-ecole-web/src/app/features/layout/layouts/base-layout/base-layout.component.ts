import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';
import { PanierParcoursChoisiService } from 'src/app/data/modules/orientation/services/panier-parcours-choisi.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-base-layout',
  templateUrl: './base-layout.component.html',
  styleUrls: ['./base-layout.component.scss']
})
export class BaseLayoutComponent extends BaseComponentClass implements OnInit {

  showMenu: boolean = false
  panierCount: number = 0
  showPanierModal: boolean = false
  showProfileDropdown: boolean = false
  showNotifDropdown: boolean = false

  readonly PROFILES_PATH: string = environment.MEDIAS_PATH.AUTH.PROFILES

  constructor(
    private panierParcoursChoisiService: PanierParcoursChoisiService,
    private authService: AuthService) {
    super()
    if(this.rolesValue.isApprenant) {
      this.getPanierCount()
    }
  }

  ngOnInit(): void {
  }

  private getPanierCount(): void {
    this.panierParcoursChoisiService.getCount()
      .subscribe({
        next: (res) => {
          this.panierCount = res.count
          // console.log(res);
        },
        error: (err) => {
          console.log(err)
        }
      })
  }

  logout(): void {
    this.authService.logout()
  }

  openMenu() {
    this.showMenu = true
    this.showProfileDropdown = false
    this.showNotifDropdown = false
    this.showPanierModal = false
  }

  closeMenu(): void {
    this.showMenu = false
  }

  openModal() {
    this.showMenu = false
    this.showProfileDropdown = false
    this.showNotifDropdown = false
    this.showPanierModal = true
  }

  closeModal(): void {
    this.showPanierModal = false
  }

}
