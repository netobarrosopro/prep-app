// Papéis de acesso
export const ROLES = ["DONO", "PREPARADOR"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  DONO: "Dono do carro",
  PREPARADOR: "Preparador",
};

// Categorias homologadas pela CBA (Confederação Brasileira de Automobilismo)
// + a categoria Entusiasta (projetos de rua/hobby, não homologada)
export const CATEGORIES = [
  "TURISMO_NACIONAL",
  "MARCAS",
  "STOCK_CAR",
  "FORMULA",
  "PROTOTIPOS",
  "ARRANCADA",
  "RALLY",
  "VELOCIDADE_NA_TERRA",
  "DRIFT",
  "AUTOCROSS",
  "ENDURANCE",
  "CLASSICOS",
  "ENTUSIASTA",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  TURISMO_NACIONAL: "Turismo Nacional (CBA)",
  MARCAS: "Marcas (CBA)",
  STOCK_CAR: "Stock Car (CBA)",
  FORMULA: "Fórmula (CBA)",
  PROTOTIPOS: "Protótipos (CBA)",
  ARRANCADA: "Arrancada (CBA)",
  RALLY: "Rally (CBA)",
  VELOCIDADE_NA_TERRA: "Velocidade na Terra (CBA)",
  DRIFT: "Drift (CBA)",
  AUTOCROSS: "Autocross (CBA)",
  ENDURANCE: "Endurance (CBA)",
  CLASSICOS: "Clássicos (CBA)",
  ENTUSIASTA: "Entusiasta",
};

// Tipos de modificação
export const MOD_TYPES = [
  "MOTORIZACAO",
  "ESTETICA",
  "SUSPENSAO",
  "FREIOS",
  "SEGURANCA",
  "OUTROS",
] as const;
export type ModType = (typeof MOD_TYPES)[number];

export const MOD_TYPE_LABELS: Record<ModType, string> = {
  MOTORIZACAO: "Motorização",
  ESTETICA: "Estética",
  SUSPENSAO: "Suspensão",
  FREIOS: "Freios",
  SEGURANCA: "Segurança",
  OUTROS: "Outros",
};

// Status de modificação
export const MOD_STATUSES = ["PLANEJADA", "EM_ANDAMENTO", "CONCLUIDA"] as const;
export type ModStatus = (typeof MOD_STATUSES)[number];

export const MOD_STATUS_LABELS: Record<ModStatus, string> = {
  PLANEJADA: "Planejada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};
