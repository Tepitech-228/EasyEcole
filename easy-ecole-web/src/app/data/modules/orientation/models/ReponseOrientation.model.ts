import { Institution } from "../../auth/models/Institution.model";
import { DemandeOrientation } from "./DemandeOrientation.model";

export class ReponseOrientation {
  declare id?: string
  declare message?: string
  declare dateReponse?: Date
  declare institutionId?: string
  declare institution?: Institution
  declare demandeOrientationId?: string
  declare demandeOrientation?: DemandeOrientation

  declare readonly createdAt?: Date
  declare readonly updatedAt?: Date
}