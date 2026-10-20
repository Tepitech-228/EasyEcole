import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Utilisateur } from "../models/Utilisateur";
import { PersonnelAdministratif } from "../models/PersonnelAdministratif";
import { Enseignant } from "../models/Enseignant";
import { Apprenant } from "../models/Apprenant";
import * as bcrypt from 'bcrypt';
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { QrTokenService } from "../../../core/services/QrTokenService";
import QRCode from "qrcode";
import * as path from "path";
import * as fs from "fs";
import { EnseignantBadgeService } from "../services/EnseignantBadgeService";
import { SiteUtilisateur } from "../models/SiteUtilisateur";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../../core/config/jwt";

export default class UtilisateurController {

    constructor() { }

    private static roleToFonction(role: string): string {
        const map: { [key: string]: string } = {
            [RolesUtilisateur.PERSONNEL_ADMINISTRATIF]: 'Personnel Administratif',
            [RolesUtilisateur.CAISSIER_BANQUE]: 'Caissier Banque',
            [RolesUtilisateur.COMITE_ORIENTATION]: "Comité d'Orientation",
            [RolesUtilisateur.CABINET_COMPTABLE]: 'Audit',
            [RolesUtilisateur.RESSOURCES_HUMAINES]: 'Ressources Humaines',
            [RolesUtilisateur.ESA_COMPTA]: 'Service Recouvrement',
            [RolesUtilisateur.SECRETAIRE]: 'Secrétaire',
            [RolesUtilisateur.SURVEILLANT]: 'Surveillant',
            [RolesUtilisateur.SUPERVISEUR_GENERAL]: 'Superviseur général',
        };
        return map[role] || role;
    }

    static async getSitesMoi(req: Request, res: Response): Promise<Response> {
        try {
            const role = req.utilisateurRole;
            if (role === RolesUtilisateur.ADMIN) {
                const sites = await Etablissement.findAll({ where: { actif: true }, order: [['nom', 'ASC']] });
                return res.status(200).json(sites);
            }
            const affectations = await SiteUtilisateur.findAll({
                where: { utilisateurId: req.utilisateurId! },
                attributes: ['etablissementId']
            });
            const siteIds = [...new Set([
                ...affectations.map(item => Number(item.etablissementId)),
                ...(req.etablissementId ? [Number(req.etablissementId)] : [])
            ])];
            const sites = siteIds.length
                ? await Etablissement.findAll({ where: { id: { [Op.in]: siteIds }, actif: true }, order: [['nom', 'ASC']] })
                : [];
            return res.status(200).json(sites);
        } catch (error) {
            console.error("Erreur récupération des sites affectés:", error);
            return res.status(500).json({ success: false, message: "Les sites affectés n’ont pas pu être chargés" });
        }
    }

    static async definirSiteActif(req: Request, res: Response): Promise<Response> {
        const etablissementId = Number(req.body?.etablissementId);
        if (!Number.isSafeInteger(etablissementId) || etablissementId <= 0) {
            return res.status(400).json({ success: false, message: "Identifiant de site invalide" });
        }
        try {
            const site = await Etablissement.findOne({ where: { id: etablissementId, actif: true } });
            if (!site) return res.status(404).json({ success: false, message: "Site inexistant ou inactif" });
            if (req.utilisateurRole !== RolesUtilisateur.ADMIN) {
                const affectation = await SiteUtilisateur.findOne({
                    where: { utilisateurId: req.utilisateurId!, etablissementId }
                });
                if (!affectation) return res.status(403).json({ success: false, message: "Vous n’êtes pas affecté à ce site" });
            }
            const utilisateur = await Utilisateur.findByPk(req.utilisateurId!);
            if (!utilisateur) return res.status(401).json({ success: false, message: "Utilisateur non trouvé" });

            const accessToken = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60,
                id: utilisateur.id,
                email: utilisateur.email,
                identifiant: utilisateur.identifiant,
                role: utilisateur.role,
                tokenVersion: utilisateur.tokenVersion,
                etablissementId
            }, JWT_SECRET);
            return res.status(200).json({ success: true, etablissementId, accessToken });
        } catch (error) {
            console.error("Erreur changement de site actif:", error);
            return res.status(500).json({ success: false, message: "Le site actif n’a pas pu être modifié" });
        }
    }

    private static async validerSites(ids: unknown): Promise<number[] | null> {
        if (!Array.isArray(ids) || ids.some(id => !Number.isSafeInteger(Number(id)) || Number(id) <= 0)) return null;
        const siteIds = [...new Set(ids.map(Number))];
        if (!siteIds.length) return null;
        const sites = await Etablissement.findAll({
            where: { id: { [Op.in]: siteIds }, actif: true },
            attributes: ['id']
        });
        return sites.length === siteIds.length ? siteIds : null;
    }

    private static async sitesAccessibles(req: Request): Promise<number[]> {
        const affectations = await SiteUtilisateur.findAll({
            where: { utilisateurId: req.utilisateurId! },
            attributes: ['etablissementId']
        });
        const siteIds = [...new Set([
            ...affectations.map(item => Number(item.etablissementId)),
            ...(req.etablissementId ? [Number(req.etablissementId)] : [])
        ])];
        if (!siteIds.length) return [];
        const sites = await Etablissement.findAll({
            where: { id: { [Op.in]: siteIds }, actif: true },
            attributes: ['id']
        });
        return sites.map(site => Number(site.id));
    }

    private static sitesDemandes(req: Request): unknown {
        if (req.body?.siteIds !== undefined) return req.body.siteIds;
        if (req.body?.etablissementIds !== undefined) return req.body.etablissementIds;
        const siteId = req.body?.etablissementId ?? req.etablissementId;
        return siteId ? [siteId] : [];
    }

    private static nombreSitesAutorise(role: RolesUtilisateur, siteIds: number[]): boolean {
        if (role === RolesUtilisateur.APPRENANT) return siteIds.length === 1;
        const rolesCentraux = [
            RolesUtilisateur.ADMIN,
            RolesUtilisateur.INSTITUTION,
            RolesUtilisateur.COMITE_ORIENTATION,
            RolesUtilisateur.SUPERVISEUR_GENERAL,
            RolesUtilisateur.CABINET_COMPTABLE,
        ];
        return rolesCentraux.includes(role) || siteIds.length > 0;
    }

    static async getAllUtilisateurs(req: Request, res: Response): Promise<Response> {
        const rolesAutorises: RolesUtilisateur[] = [
            RolesUtilisateur.ADMIN,
            RolesUtilisateur.INSTITUTION,
            RolesUtilisateur.SECRETAIRE,
        ];
        if (!rolesAutorises.includes((req as any).utilisateurRole)) {
            return res.status(403).json({ success: false })
        }

        let options: FindOptions<InferAttributes<Utilisateur>> = {
            attributes: ['id', 'nom', 'prenoms', 'identifiant', 'email', 'role', 'contact', 'photoDeProfil', 'createdAt']
        }

        try {
            if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
                if (!(req as any).etablissementId) return res.status(200).send([]);
                const affectations = await SiteUtilisateur.findAll({
                    where: { etablissementId: (req as any).etablissementId },
                    attributes: ['utilisateurId'],
                    include: [{
                        association: SiteUtilisateur.associations.etablissement,
                        where: { actif: true },
                        required: true,
                        attributes: []
                    }]
                });
                options.where = { id: { [Op.in]: affectations.map(item => item.utilisateurId) } };
            }
            const utilisateurs = await Utilisateur.findAll(options);
            return res.status(200).send(utilisateurs);
        } catch (error) {
            return res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }

    /**
     * GET /auth/utilisateurs/moi — Retourne l'utilisateur courant (celui dont le token est porteur).
     * Route explicite pour éviter la collision avec GET /:id qui interprèterait "moi" comme un identifiant.
     */
    static async getMoi(req: Request, res: Response): Promise<Response> {
        const utilisateurId = (req as any).utilisateurId;

        try {
            const utilisateur: Utilisateur | null = await Utilisateur.findByPk(utilisateurId, {
                attributes: ['id', 'nom', 'prenoms', 'identifiant', 'email', 'role', 'contact', 'photoDeProfil'],
                include: [Utilisateur.associations.apprenant, Utilisateur.associations.institution, Utilisateur.associations.caissierBanque]
            });

            if (!utilisateur) {
                return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
            }

            return res.status(200).json(utilisateur);
        } catch (error) {
            return res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }

    static async getUtilisateur(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Utilisateur>> = {}
        options = { 
            where: { id: (req as any).utilisateurId },
            attributes: ['nom', 'prenoms', 'identifiant', 'email', 'contact', 'photoDeProfil'],
            include: [Utilisateur.associations.apprenant, Utilisateur.associations.institution, Utilisateur.associations.caissierBanque]
        }

        try {
            const utilisateur: Utilisateur | null = await Utilisateur.findOne(options);

            if (utilisateur == null)
                return res.status(404).json({ success: false, message: "Utilisateur non trouve" });

            return res.status(200).send(utilisateur);
        } catch (error) {
            return res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }

    static async updateUtilisateur(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        let options: FindOptions<InferAttributes<Utilisateur>> = { where: { id: (req as any).utilisateurId } }

        let utilisateur: Utilisateur | null = await Utilisateur.findOne(options);
        if (utilisateur != null) {
            let nomPrenomsAlreadyUsed: boolean = false
            if (utilisateur.nom != req.body.nom || utilisateur.prenoms != req.body.prenoms) {
                nomPrenomsAlreadyUsed = await Utilisateur.findOne({ where: { [Op.and]: [{ nom: req.body.nom }, { prenoms: req.body.prenoms }] } }) != null
            }

            if (nomPrenomsAlreadyUsed) {
                return res.status(400).json({ nomPrenomsAlreadyUsed: nomPrenomsAlreadyUsed });
            }

            await utilisateur.update({
                nom: req.body.nom,
                prenoms: req.body.prenoms,
                contact: req.body.contact,
            })
                .then(async (utilisateur) => {
                    return res.status(200).json({ success: true });
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, message: "Erreur lors de la mise à jour" });
                });

            return null
        }
        else {
            return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
        }
    }

    static async adminUpdateUtilisateur(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole;
            if (role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
                return res.status(403).json({ success: false, message: "Réservé à l'administration" });
            }

            const utilisateur = await Utilisateur.findByPk(req.params.id);
            if (!utilisateur) {
                return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
            }

            const updateData: any = {};
            if (req.body.nom !== undefined) updateData.nom = req.body.nom;
            if (req.body.prenoms !== undefined) updateData.prenoms = req.body.prenoms;
            if (req.body.email !== undefined) updateData.email = req.body.email;
            if (req.body.identifiant !== undefined) updateData.identifiant = req.body.identifiant;
            if (req.body.contact !== undefined) updateData.contact = req.body.contact;
            if (req.body.role !== undefined) updateData.role = req.body.role;
            if (req.body.motDePasse) updateData.motDePasse = bcrypt.hashSync(req.body.motDePasse, 12);

            await utilisateur.update(updateData);
            return res.status(200).json({ success: true, message: "Utilisateur mis à jour" });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }

    static async adminCreateUtilisateur(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole;
            if (role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
                return res.status(403).json({ success: false, message: "Réservé à l'administration" });
            }

            const existe = await Utilisateur.findOne({
                where: { [Op.or]: [{ email: req.body.email }, { identifiant: req.body.identifiant }] }
            });
            if (existe) {
                return res.status(400).json({ success: false, message: "Email ou identifiant déjà utilisé" });
            }

            if (!req.body.motDePasse || req.body.motDePasse.length < 6) {
                return res.status(400).json({ success: false, message: "Mot de passe requis (min 6 caractères)" });
            }

            const userRole: RolesUtilisateur = req.body.role || RolesUtilisateur.APPRENANT;
            if (
                role === RolesUtilisateur.INSTITUTION
                && [RolesUtilisateur.ADMIN, RolesUtilisateur.INSTITUTION].includes(userRole)
            ) {
                return res.status(403).json({
                    success: false,
                    message: "Une institution ne peut pas créer un compte administrateur ou institution."
                });
            }
            const siteIds = await this.validerSites(this.sitesDemandes(req));
            if (siteIds === null && (req.body.siteIds !== undefined || req.body.etablissementIds !== undefined || req.body.etablissementId || req.etablissementId)) {
                return res.status(400).json({ success: false, message: "Un site demandé n’existe pas ou est inactif" });
            }
            const affectations = siteIds || [];
            if (role === RolesUtilisateur.INSTITUTION) {
                if (!affectations.length) {
                    return res.status(400).json({
                        success: false,
                        message: "Sélectionnez au moins un site auquel vous êtes affecté."
                    });
                }
                const sitesAccessibles = await this.sitesAccessibles(req);
                if (affectations.some(etablissementId => !sitesAccessibles.includes(etablissementId))) {
                    return res.status(403).json({
                        success: false,
                        message: "Vous ne pouvez créer un utilisateur que sur les sites qui vous sont affectés."
                    });
                }
            }
            if (!this.nombreSitesAutorise(userRole, affectations)) {
                return res.status(400).json({
                    success: false,
                    message: userRole === RolesUtilisateur.APPRENANT
                        ? "Un étudiant doit être rattaché à un site actif"
                        : "Ce profil doit être affecté à au moins un site"
                });
            }
            const photo = req.file;
            if (!photo) {
                return res.status(400).json({
                    success: false,
                    message: "Une photo de profil est obligatoire pour créer un compte utilisateur."
                });
            }

            const utilisateur = await Utilisateur.create({
                nom: req.body.nom,
                prenoms: req.body.prenoms,
                email: req.body.email,
                identifiant: req.body.identifiant,
                motDePasse: bcrypt.hashSync(req.body.motDePasse, 12),
                role: userRole,
                contact: req.body.contact || null,
                photoDeProfil: photo.filename,
                etablissementId: affectations[0] || null,
            });
            if (affectations.length) {
                await SiteUtilisateur.bulkCreate(affectations.map(etablissementId => ({
                    utilisateurId: utilisateur.id,
                    etablissementId,
                    affectePar: (req as any).utilisateurId || null
                })));
            }

            // Création du profil lié selon le rôle
            // Hors apprenant/enseignant/parent → tous = PersonnelAdministratif (fonction = rôle)
            const isStaff = [
                RolesUtilisateur.PERSONNEL_ADMINISTRATIF,
                RolesUtilisateur.CAISSIER_BANQUE,
                RolesUtilisateur.COMITE_ORIENTATION,
                RolesUtilisateur.CABINET_COMPTABLE,
                RolesUtilisateur.RESSOURCES_HUMAINES,
                RolesUtilisateur.ESA_COMPTA,
                RolesUtilisateur.SECRETAIRE,
                RolesUtilisateur.SURVEILLANT,
                RolesUtilisateur.SUPERVISEUR_GENERAL,
            ].includes(userRole);
            let enseignantBadge: { matricule: string; qrCode: string } | undefined;

            try {
                if (userRole === RolesUtilisateur.APPRENANT) {
                    await Apprenant.create({
                        utilisateurId: utilisateur.id,
                        photo: photo.filename,
                        dateNaissance: req.body.dateNaissance || new Date(),
                        lieuNaissance: req.body.lieuNaissance || '',
                        sexe: req.body.sexe || 'M',
                        nationalite: req.body.nationalite || 'Ivoirienne',
                        cni: req.body.cni || null,
                        statutEtudiant: req.body.statutEtudiant || 'nouveau',
                        periode: req.body.periode || 'matin',
                    });
                } else if (userRole === RolesUtilisateur.ENSEIGNANT) {
                    let matricule = req.body.matricule || null

                    if (!matricule) {
                        const etabId = (req as any).etablissementId || req.body.etablissementId || null
                        let etablissement: Etablissement | null = null
                        if (etabId) {
                            etablissement = await Etablissement.findByPk(etabId)
                        }
                        const etabCode = IDGenerator.deriveEtablissementCode(etablissement)
                        const siteCode = IDGenerator.deriveSiteCode(etablissement)
                        const matiereCode = IDGenerator.deriveMatiereCode(req.body.specialite)
                        const prefix = `${etabCode}-${matiereCode}-${siteCode}-`
                        const count = await Enseignant.count({ where: { matricule: { [Op.like]: prefix + '%' } } as any })
                        matricule = IDGenerator.generateMatricule(etabCode, matiereCode, siteCode, count + 1)
                    }

                    const MAX_RETRIES = 5
                    let enseignant: Enseignant | null = null
                    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                        try {
                            enseignant = await Enseignant.create({
                                utilisateurId: utilisateur.id,
                                photo: photo.filename,
                                specialite: req.body.specialite || null,
                                gradeAcademique: req.body.gradeAcademique || null,
                                matricule: matricule,
                                statut: req.body.statut || 'Permanent',
                                fonctionAdministrative: req.body.fonctionAdministrative || null,
                                anneeExperience: req.body.anneeExperience || 0,
                                cni: req.body.cni || null,
                                dateNaissance: req.body.dateNaissance || null,
                                lieuNaissance: req.body.lieuNaissance || null,
                                sexe: req.body.sexe || 'M',
                                nationalite: req.body.nationalite || 'Ivoirienne',
                                contact: req.body.contact || null,
                                plusHautDiplome: req.body.plusHautDiplome || null,
                            });
                            break
                        } catch (createErr: any) {
                            const errCode = createErr?.parent?.code || createErr?.original?.code || ''
                            const errName = createErr?.name || ''
                            if ((errCode === 'ER_DUP_ENTRY' || errName === 'SequelizeUniqueConstraintError') && attempt < MAX_RETRIES - 1) {
                                const etabId = (req as any).etablissementId || req.body.etablissementId || null
                                let etablissement: Etablissement | null = null
                                if (etabId) {
                                    etablissement = await Etablissement.findByPk(etabId)
                                }
                                const etabCode = IDGenerator.deriveEtablissementCode(etablissement)
                                const siteCode = IDGenerator.deriveSiteCode(etablissement)
                                const matiereCode = IDGenerator.deriveMatiereCode(req.body.specialite)
                                const prefix = `${etabCode}-${matiereCode}-${siteCode}-`
                                const cnt = await Enseignant.count({ where: { matricule: { [Op.like]: prefix + '%' } } as any })
                                matricule = IDGenerator.generateMatricule(etabCode, matiereCode, siteCode, cnt + 1)
                                continue
                            }
                            throw createErr
                        }
                    }

                    if (!enseignant) {
                        throw new Error("Le profil enseignant n'a pas été créé.");
                    }
                    enseignantBadge = await EnseignantBadgeService.ensureIdentity(
                        enseignant,
                        (req as any).etablissementId || req.body.etablissementId || null,
                    );

                } else if (isStaff) {
                    let matricule = req.body.matricule || null

                    if (!matricule) {
                        const etabId = (req as any).etablissementId || req.body.etablissementId || null
                        let etablissement: Etablissement | null = null
                        if (etabId) {
                            etablissement = await Etablissement.findByPk(etabId)
                        }
                        const etabCode = IDGenerator.deriveEtablissementCode(etablissement)
                        const siteCode = IDGenerator.deriveSiteCode(etablissement)
                        const serviceCode = IDGenerator.deriveServiceCode(req.body.directionService, userRole)
                        const prefix = `${etabCode}-${serviceCode}-${siteCode}-`
                        const count = await PersonnelAdministratif.count({ where: { matricule: { [Op.like]: prefix + '%' } } as any })
                        matricule = IDGenerator.generateMatricule(etabCode, serviceCode, siteCode, count + 1)
                    }

                    const MAX_RETRIES = 5
                    let personnel: PersonnelAdministratif | null = null
                    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                        try {
                            personnel = await PersonnelAdministratif.create({
                                utilisateurId: utilisateur.id,
                                fonction: req.body.fonction || this.roleToFonction(userRole),
                                matricule: matricule,
                                statut: req.body.statut || 'Permanent',
                                directionService: req.body.directionService || null,
                                cni: req.body.cni || null,
                                dateNaissance: req.body.dateNaissance || null,
                                lieuNaissance: req.body.lieuNaissance || null,
                                sexe: req.body.sexe || 'M',
                                nationalite: req.body.nationalite || 'Ivoirienne',
                            });
                            break
                        } catch (createErr: any) {
                            const errCode = createErr?.parent?.code || createErr?.original?.code || ''
                            const errName = createErr?.name || ''
                            if ((errCode === 'ER_DUP_ENTRY' || errName === 'SequelizeUniqueConstraintError') && attempt < MAX_RETRIES - 1) {
                                const etabId = (req as any).etablissementId || req.body.etablissementId || null
                                let etablissement: Etablissement | null = null
                                if (etabId) {
                                    etablissement = await Etablissement.findByPk(etabId)
                                }
                                const etabCode = IDGenerator.deriveEtablissementCode(etablissement)
                                const siteCode = IDGenerator.deriveSiteCode(etablissement)
                                const serviceCode = IDGenerator.deriveServiceCode(req.body.directionService, userRole)
                                const prefix = `${etabCode}-${serviceCode}-${siteCode}-`
                                const cnt = await PersonnelAdministratif.count({ where: { matricule: { [Op.like]: prefix + '%' } } as any })
                                matricule = IDGenerator.generateMatricule(etabCode, serviceCode, siteCode, cnt + 1)
                                continue
                            }
                            throw createErr
                        }
                    }

                    try {
                        const dir: string = path.resolve(process.cwd(), 'storage', 'qr-codes', 'personnel')
                        if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }) }
                        const userId = String(utilisateur.id)
                        const qrData = QrTokenService.signer(utilisateur.id)
                        const fileName = `${userId}.png`
                        const filePath = path.join(dir, fileName)
                        await QRCode.toFile(filePath, qrData, {
                            type: 'png', width: 600, margin: 4,
                            errorCorrectionLevel: 'M',
                            color: { dark: '#000000', light: '#ffffff' }
                        })
                        if (personnel) { await personnel.update({ qrCode: fileName }) }
                    } catch (qrError) { console.error('Erreur génération QR personnel:', qrError) }
                }
            } catch (profileError: any) {
                console.error('Erreur création profil:', profileError?.message);
                return res.status(500).json({
                    success: false,
                    message: "Le compte a été créé, mais la génération du profil enseignant ou de son badge a échoué. Relancez la génération du QR code depuis la gestion des QR codes.",
                });
            }

            let hikvisionEnrollmentQueued = false;
            let hikvisionEnrollmentWarning: string | undefined;
            if (userRole === RolesUtilisateur.ENSEIGNANT || isStaff) {
                try {
                    const { default: HikvisionEnrollmentService } = await import("../../inscription/services/HikvisionEnrollmentService");
                    hikvisionEnrollmentQueued = (await HikvisionEnrollmentService.enqueueStaffProfile(Number(utilisateur.id))) > 0;
                } catch (error) {
                    console.error(`[Hikvision] Enrôlement non planifié pour le compte ${utilisateur.id}:`, error);
                    hikvisionEnrollmentWarning = "Le compte est créé, mais l’enrôlement Hikvision n’a pas pu être planifié.";
                }
            }

            return res.status(201).json({
                success: true,
                utilisateur,
                ...(enseignantBadge ? { enseignant: enseignantBadge } : {}),
                ...(userRole === RolesUtilisateur.ENSEIGNANT || isStaff
                    ? { hikvisionEnrollmentQueued, ...(hikvisionEnrollmentWarning ? { hikvisionEnrollmentWarning } : {}) }
                    : {}),
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: "Erreur interne du serveur" });
        }
    }

    static async affecterSites(req: Request, res: Response): Promise<Response> {
        if ((req as any).utilisateurRole !== RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false, message: "Réservé à l'administrateur" });
        }
        try {
            const utilisateur = await Utilisateur.findByPk(req.params.id);
            if (!utilisateur) return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
            const siteIds = await this.validerSites(req.body?.siteIds);
            if (siteIds === null && (!Array.isArray(req.body?.siteIds) || req.body.siteIds.length > 0)) {
                return res.status(400).json({ success: false, message: "Un ou plusieurs sites n’existent pas ou sont inactifs" });
            }
            const affectations = siteIds || [];
            if (!this.nombreSitesAutorise(utilisateur.role, affectations)) {
                return res.status(400).json({
                    success: false,
                    message: utilisateur.role === RolesUtilisateur.APPRENANT
                        ? "Un étudiant doit conserver exactement un site de rattachement"
                        : "Ce profil doit être affecté à au moins un site"
                });
            }

            await DatabaseConnection.getInstance().sequelize.transaction(async transaction => {
                await SiteUtilisateur.destroy({ where: { utilisateurId: utilisateur.id }, transaction });
                if (affectations.length) {
                    await SiteUtilisateur.bulkCreate(affectations.map(etablissementId => ({
                        utilisateurId: utilisateur.id,
                        etablissementId,
                        affectePar: (req as any).utilisateurId || null
                    })), { transaction });
                }
                await utilisateur.update({ etablissementId: affectations[0] || null }, { transaction });
            });

            return res.status(200).json({ success: true, utilisateurId: utilisateur.id, siteIds: affectations });
        } catch (error) {
            console.error("Erreur affectation des sites utilisateur:", error);
            return res.status(500).json({ success: false, message: "Les affectations de sites n’ont pas pu être enregistrées" });
        }
    }

    static async deleteUtilisateur(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole;
        if (role !== RolesUtilisateur.ADMIN && role !== RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false, message: "Réservé à l'administration" });
        }

        const userId = Number(req.params.id);
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ success: false, message: "Identifiant utilisateur invalide" });
        }

        const requesterId = (req as any).utilisateurId;
        if (requesterId && Number(requesterId) === userId) {
            return res.status(400).json({ success: false, message: "Impossible de supprimer votre propre compte" });
        }

        const sequelize = DatabaseConnection.getInstance().sequelize;

        try {
            const utilisateur: Utilisateur | null = await Utilisateur.findByPk(userId);
            if (!utilisateur) {
                return res.status(404).json({ success: false, message: "Utilisateur non trouve" });
            }

            // COMPTES RÉFÉRENCÉS PAR LA GED — incident FK uploaderId.
            // Un compte auteur d'au moins un document GED ou d'une trace d'audit
            // ne peut pas être supprimé : la suppression casserait la traçabilité
            // des archives (et déclencherait une erreur de clé étrangère au
            // prochain affichage). Il faut d'abord réaffecter ces documents
            // (migration 034_ged_reparation_uploader_id / traitement ciblé).
            // Chaque vérification est isolée pour supporter les bases où les
            // tables GED n'existent pas encore (module non déployé, sync différé).
            const liensGED: string[] = [];
            const checksGED: { sql: string; label: string }[] = [
                { sql: 'SELECT COUNT(*) AS cnt FROM ged_documents WHERE uploaderId = :id', label: "document(s) GED dont ce compte est l'auteur" },
                { sql: 'SELECT COUNT(*) AS cnt FROM ged_audit_logs WHERE userId = :id', label: "trace(s) d'audit GED" },
            ];
            for (const check of checksGED) {
                try {
                    const [rows]: any = await sequelize.query(check.sql, { replacements: { id: userId } });
                    const count = rows?.[0]?.cnt || 0;
                    if (count > 0) {
                        liensGED.push(`${count} ${check.label}`);
                    }
                } catch (err: any) {
                    // Table manquante ou erreur de lecture : on ignore silencieusement
                    console.warn(`[deleteUtilisateur] Contrôle GED ignoré (${check.label}):`, err?.message || err);
                }
            }
            if (liensGED.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: `Suppression impossible : ce compte est référencé par la GED (${liensGED.join(', ')}). Réaffectez d'abord ces documents, puis recommencez.`
                });
            }

            if (utilisateur.role === RolesUtilisateur.APPRENANT) {
                await sequelize.transaction(async (t) => {
                    const q = (sql: string, replacements: any = {}) => sequelize.query(sql, { replacements, transaction: t });
                    const [demandes]: any = await q('SELECT id FROM ins_demandes_inscription WHERE utilisateurId = :id', { id: userId });
                    const [cursus]: any = await q('SELECT id FROM ins_cursus_apprenants WHERE utilisateurId = :id', { id: userId });
                    const demandeIds = demandes.map((row: any) => row.id);
                    const cursusIds = cursus.map((row: any) => row.id);

                    if (cursusIds.length > 0) {
                        await q('DELETE FROM ins_cours_participants WHERE cursusApprenantId IN (:ids)', { ids: cursusIds });
                        await q('DELETE FROM ins_equivalences WHERE cursusApprenantId IN (:ids)', { ids: cursusIds });
                        await q('DELETE FROM ins_dispenses WHERE cursusApprenantId IN (:ids)', { ids: cursusIds });
                        await q('DELETE FROM ins_designation_memoires WHERE cursusApprenantId IN (:ids)', { ids: cursusIds });
                    }
                    if (demandeIds.length > 0) {
                        await q('DELETE FROM ins_prerequis_parcours_choisis WHERE parcoursChoisiId IN (SELECT id FROM ins_parcours_choisis WHERE demandeInscriptionId IN (:ids))', { ids: demandeIds });
                        await q('DELETE FROM ins_parcours_choisis WHERE demandeInscriptionId IN (:ids)', { ids: demandeIds });
                        await q('DELETE FROM ins_cours_choisis WHERE demandeInscriptionId IN (:ids)', { ids: demandeIds });
                        await q('DELETE FROM ins_reponses_inscription WHERE demandeInscriptionId IN (:ids)', { ids: demandeIds });
                        await q('DELETE FROM ins_pre_inscriptions WHERE demandeInscriptionId IN (:ids)', { ids: demandeIds });
                        await q('DELETE FROM ins_dossiers_demandes WHERE demandeId IN (:ids)', { ids: demandeIds });
                    }
                    await q('DELETE FROM scol_documents_delivres WHERE demandeId IN (SELECT id FROM scol_demandes_document WHERE etudiantId = :id)', { id: userId });
                    await q('DELETE FROM scol_journal_caisse WHERE demandeDocumentId IN (SELECT id FROM scol_demandes_document WHERE etudiantId = :id)', { id: userId });
                    await q('DELETE FROM scol_recus_caisse WHERE demandeDocumentId IN (SELECT id FROM scol_demandes_document WHERE etudiantId = :id)', { id: userId });
                    await q('DELETE FROM scol_demandes_document WHERE etudiantId = :id', { id: userId });
                    await q('DELETE FROM ins_cursus_apprenants WHERE utilisateurId = :id', { id: userId });
                    await q('DELETE FROM ins_demandes_inscription WHERE utilisateurId = :id', { id: userId });
                    await q('DELETE FROM ins_paiements_inscription WHERE utilisateurId = :id', { id: userId });
                    await q('DELETE FROM ins_bordereaux WHERE utilisateurId = :id', { id: userId });
                    await q('DELETE FROM ins_dossiers_etudiants WHERE utilisateurId = :id', { id: userId });
                    await q('DELETE FROM aut_apprenants WHERE utilisateurId = :id', { id: userId });
                    await q('DELETE FROM aut_user_permissions WHERE utilisateurId = :id', { id: userId });
                    await q('DELETE FROM aut_user_roles WHERE utilisateurId = :id', { id: userId });
                    await q('DELETE FROM aut_utilisateurs WHERE id = :id', { id: userId });
                });
                return res.status(200).json({ success: true, message: "Apprenant et données liées définitivement supprimés" });
            }

            // Tables "bloquantes" (NO ACTION / RESTRICT) liées à de la donnée métier
            // sensible (parents, bourse, réductions, bulletins, caisse) : on refuse plutôt que de
            // détruire silencieusement ces données. Ces cas demandent une purge manuelle.
            // Chaque vérification est isolée pour supporter les bases où certaines tables
            // n'existent pas encore (sync différé, module non déployé, etc.).
            const blockersChecks: { sql: string; label: string }[] = [
                { sql: 'SELECT COUNT(*) AS cnt FROM par_parents_enfants WHERE parentUtilisateurId = :id', label: 'lien(s) parent-enfant' },
                { sql: 'SELECT COUNT(*) AS cnt FROM brs_attributions WHERE valideParId = :id', label: 'attribution(s) de bourse' },
                { sql: 'SELECT COUNT(*) AS cnt FROM cpt_reductions_frais WHERE validePar = :id', label: 'réduction(s) de frais' },
                { sql: 'SELECT COUNT(*) AS cnt FROM ins_bulletins WHERE utilisateurId = :id', label: 'bulletin(s)' },
                { sql: 'SELECT COUNT(*) AS cnt FROM scol_clotures_caisse WHERE caissierId = :id', label: 'clôture(s) de caisse (anciennes)' },
                { sql: 'SELECT COUNT(*) AS cnt FROM scol_recus_caisse WHERE caissierId = :id', label: 'reçu(s) de caisse' },
            ];

            const liens: string[] = [];
            for (const check of blockersChecks) {
                try {
                    const [rows]: any = await sequelize.query(check.sql, { replacements: { id: userId } });
                    const count = rows?.[0]?.cnt || 0;
                    if (count > 0) {
                        liens.push(`${count} ${check.label}`);
                    }
                } catch (err: any) {
                    // Table manquante ou erreur de lecture : on ignore silencieusement
                    console.warn(`[deleteUtilisateur] Bloquant ignoré (${check.label}):`, err?.message || err);
                }
            }

            if (liens.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: `Suppression impossible : cet utilisateur est lié à des données sensibles (${liens.join(', ')}). Un administrateur doit procéder à une purge manuelle ciblée.`
                });
            }

            await sequelize.transaction(async (t) => {
                const q = (sql: string, opts?: any) => sequelize.query(sql, { ...opts, transaction: t });

                // 1) Profils et leurs dépendances (supprime d'abord les lignes de profil
                //    pour que leurs enfants en SET NULL soient nettoyés, puis la ligne user).
                await q(`DELETE FROM aut_user_permissions WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_apprenants WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_enseignants WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_institutions WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_caissiers_banque WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_comite_orientations WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_personnel_administratif WHERE utilisateurId = :id`, { replacements: { id: userId } });
                await q(`DELETE FROM aut_user_roles WHERE utilisateurId = :id`, { replacements: { id: userId } });

                // 2) Suppression DÉFINITIVE de l'utilisateur (hard delete, ignore le soft delete)
                const [del]: any = await q(`DELETE FROM aut_utilisateurs WHERE id = :id`, { replacements: { id: userId } });
                if (!del || del.affectedRows === 0) {
                    throw new Error('USER_NOT_FOUND');
                }
            });

            return res.status(200).json({ success: true, message: "Utilisateur définitivement supprimé" });
        } catch (error: any) {
            if (error?.message === 'USER_NOT_FOUND') {
                return res.status(404).json({ success: false, message: "Utilisateur non trouve" });
            }
            // Erreur de clé étrangère (contrainte non couverte par le blocage ci-dessus)
            const code = error?.original?.code || error?.parent?.code || '';
            const codeNum = Number(error?.original?.errno || error?.parent?.errno || error?.original?.code || error?.parent?.code || 0);
            if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED' || codeNum === 1451 || codeNum === 1217 || error?.name === 'SequelizeForeignKeyConstraintError') {
                return res.status(409).json({
                    success: false,
                    message: "Suppression impossible : l'utilisateur est référencé par d'autres données métier. L'administrateur doit procéder à une purge manuelle ciblée."
                });
            }
            console.error('Erreur suppression définitive utilisateur:', error?.message);
            return res.status(500).json({ success: false, message: "Erreur lors de la suppression" });
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Utilisateur>> = {}

        const rolesAutorises: RolesUtilisateur[] = [
            RolesUtilisateur.ADMIN,
            RolesUtilisateur.INSTITUTION,
            RolesUtilisateur.SECRETAIRE,
        ];
        if (!rolesAutorises.includes((req as any).utilisateurRole)) {
            return res.status(403).json({ success: false })
        }

        await Utilisateur.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, message: "Erreur lors du comptage" });
            });

        return null
    }
}
