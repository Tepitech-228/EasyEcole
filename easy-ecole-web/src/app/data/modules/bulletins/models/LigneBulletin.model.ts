export class LigneBulletin {
  declare id?: number;
  declare bulletinId?: number;
  declare coursId?: number;
  declare moyenneCC?: number | null;
  declare noteDevoir?: number | null;
  declare noteExamen?: number | null;
  declare moyenne?: number | null;
  declare coefficient?: number | null;
  declare rang?: number | null;
  declare appreciation?: string | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  declare cours?: any;
}
