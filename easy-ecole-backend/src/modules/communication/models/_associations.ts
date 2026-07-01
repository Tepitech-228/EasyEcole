import { Communication } from "./Communication";
import { Actualite } from "./Actualite";
import { Suggestion } from "./Suggestion";
import { ReponseSuggestion } from "./ReponseSuggestion";
import { Utilisateur } from "../../auth/models/Utilisateur";

Suggestion.hasMany(ReponseSuggestion, { foreignKey: 'suggestionId', as: 'reponsesSuggestion' })
ReponseSuggestion.belongsTo(Suggestion, { foreignKey: 'suggestionId', as: 'suggestion' })

Utilisateur.hasMany(Suggestion, { foreignKey: 'utilisateurId', as: 'suggestions' })
Suggestion.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' })

Utilisateur.hasMany(ReponseSuggestion, { foreignKey: 'utilisateurId', as: 'reponsesSuggestion' })
ReponseSuggestion.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' })
