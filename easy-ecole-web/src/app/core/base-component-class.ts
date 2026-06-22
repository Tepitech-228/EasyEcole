import { RolesUtilisateur } from "../data/enums/RolesUtilisateur"
import { Utilisateur } from "../data/modules/auth/models/Utilisateur.model"
import { RolesValueType } from "../data/types/RolesValueType"
import { JwtTokenService } from "./services/jwt-token.service"
import { LocalStorageService } from "./services/local-storage.service"

export class BaseComponentClass {
    private jwtTokenService: JwtTokenService = new JwtTokenService()
    static utilisateur: Utilisateur = new Utilisateur()
    rolesValue: RolesValueType = { isApprenant: false, isInstitution: false, isEnseignant: false, isCaissierBanque: false, isRessourcesHumaines: false, isCabinetComptable: false, isAdmin: false }

    constructor() {
        if(BaseComponentClass.utilisateur.role == undefined) {
            const token = localStorage.getItem(LocalStorageService.AUTH_TOKEN)
            if (token) {
                this.jwtTokenService.setToken(token)
                this.jwtTokenService.decodeToken()
                if (!this.jwtTokenService.isTokenExpired()) {
                    BaseComponentClass.utilisateur = this.jwtTokenService.getDecodeToken() as Utilisateur
                    this.getRoles()
                }
            }
        }
        else {
            this.getRoles()
        }
    }

    private getRoles(): void {
        const role: RolesUtilisateur | undefined = BaseComponentClass.utilisateur.role
        this.rolesValue = { isApprenant: false, isInstitution: false, isEnseignant: false, isCaissierBanque: false, isRessourcesHumaines: false, isCabinetComptable: false, isAdmin: false }

        switch (role) {
            case RolesUtilisateur.APPRENANT:
                this.rolesValue.isApprenant = true
                break;

            case RolesUtilisateur.INSTITUTION:
                this.rolesValue.isInstitution = true
                break;

            case RolesUtilisateur.ENSEIGNANT:
                this.rolesValue.isEnseignant = true
                break;

            case RolesUtilisateur.CAISSIER_BANQUE:
                this.rolesValue.isCaissierBanque = true
                break;

            case RolesUtilisateur.RESSOURCES_HUMAINES:
                this.rolesValue.isRessourcesHumaines = true
                break;

            case RolesUtilisateur.CABINET_COMPTABLE:
                this.rolesValue.isCabinetComptable = true
                break;

            case RolesUtilisateur.ADMIN:
                this.rolesValue.isAdmin = true
                break;

            default:
                this.rolesValue = { isApprenant: false, isInstitution: false, isEnseignant: false, isCaissierBanque: false, isRessourcesHumaines: false, isCabinetComptable: false, isAdmin: false }
                break;
        }
    }
}