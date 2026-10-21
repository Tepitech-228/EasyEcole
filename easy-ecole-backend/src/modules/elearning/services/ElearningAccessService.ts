import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { CoursEnLigne } from "../models/CoursEnLigne";
import { ModuleElearning } from "../models/ModuleElearning";
import { SelectionCours } from "../models/SelectionCours";

export default class ElearningAccessService {
  static async canGradeCourse(utilisateurId: number, role: string, coursId: number): Promise<boolean> {
    if (role === RolesUtilisateur.ADMIN || role === RolesUtilisateur.INSTITUTION) return true;
    if (role !== RolesUtilisateur.ENSEIGNANT) return false;
    const course = await CoursEnLigne.findByPk(coursId, {
      attributes: ["id", "enseignantId", "professeurId"],
    });
    return Boolean(course && (
      Number(course.professeurId) === utilisateurId || Number(course.enseignantId) === utilisateurId
    ));
  }

  static async canManageCourse(utilisateurId: number, role: string, coursId: number): Promise<boolean> {
    if (role === RolesUtilisateur.ADMIN || role === RolesUtilisateur.INSTITUTION) return true;
    const course = await CoursEnLigne.findByPk(coursId, {
      attributes: ["id", "enseignantId", "professeurId", "chargeSupportId"],
    });
    if (!course) return false;
    return (Number(course.professeurId) === utilisateurId || Number(course.enseignantId) === utilisateurId)
      || Number(course.chargeSupportId) === utilisateurId;
  }

  static async canAccessCourse(utilisateurId: number, role: string, coursId: number): Promise<boolean> {
    if (await this.canManageCourse(utilisateurId, role, coursId)) return true;
    if (role !== RolesUtilisateur.APPRENANT) return false;
    return (await SelectionCours.count({
      where: { utilisateurId, coursId, statut: "acces_ouvert" },
    })) > 0;
  }

  static async canAccessModule(utilisateurId: number, role: string, moduleId: number): Promise<boolean> {
    const module = await ModuleElearning.findByPk(moduleId, { attributes: ["id", "coursId"] });
    return Boolean(module && await this.canAccessCourse(utilisateurId, role, Number(module.coursId)));
  }
}
