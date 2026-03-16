export type Role = 'Employé' | 'Manager' | 'Finance' | 'Admin';

export interface MockUser {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  departement: 'Commercial' | 'Marketing' | 'Finance' | 'RH' | 'Ops' | 'Tech';
  role: Role;
  managerId?: string;
  avatarUrl?: string;
}

export type StatutMission =
  | 'brouillon'
  | 'en_attente'
  | 'info_demandee'
  | 'approuvee'
  | 'rejetee'
  | 'en_cours'
  | 'cloture_demandee'
  | 'remboursee'
  | 'cloturee'
  | 'annulee';

export type ModeRemboursement = 'reel' | 'forfait' | 'calcule';

/** Libellés d'affichage pour le mode de remboursement (réel avec accent, etc.) */
export const modeRemboursementLabel: Record<ModeRemboursement, string> = {
  reel: 'Réel',
  forfait: 'Forfait',
  calcule: 'Calculé',
};

/** Libellés d'affichage pour les flags des dépenses (plafond dépassé au lieu de over_limit, etc.) */
const flagLabelMap: Record<string, string> = {
  plafond_depasse: 'Plafond dépassé',
  urgent: 'Urgent',
  incomplet: 'Justificatif incomplet',
  a_traiter: 'À traiter',
};

export function getFlagLabel(flag: string): string {
  return flagLabelMap[flag] ?? flag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface DepensePrevueMission {
  id: string;
  /** Nom ou id de la catégorie */
  categorieId: string;
  description: string;
  montantEstime: number;
  modeRemboursement: ModeRemboursement;
}

export interface Mission {
  id: string;
  titre: string;
  destination: string;
  dateDebut: string; // ISO
  dateFin: string; // ISO
  /** Projet ou centre de coût associé */
  projetAssocie?: string;
  statut: StatutMission;
  /**
   * Budget alloué par le manager lors de l'approbation.
   * null si la mission est encore en brouillon ou en attente.
   */
  budgetAlloue: number | null;
  depense: number;
  userId: string;
  /**
   * Catégories de dépenses que le collaborateur souhaite utiliser.
   * Les règles (plafonds, mode) sont définies dans les politiques.
   */
  categoriesDemandees: string[];
  /**
   * Dépenses prévues saisies lors de la demande de mission.
   */
  depensesPrevues?: DepensePrevueMission[];
  /**
   * Collaborateurs affectés à cette mission (IDs utilisateur).
   */
  participants?: string[];
  /**
   * Timeline détaillée de la mission (mockée pour la démo).
   */
  events?: MissionEvent[];
}

export type MissionEventType =
  | 'created'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'info_requested'
  | 'info_provided'
  | 'budget_modified'
  | 'expense_added'
  | 'expense_removed'
  | 'closure_requested'
  | 'closure_approved'
  | 'reimbursement_sent'
  | 'advance_requested'
  | 'advance_approved'
  | 'advance_paid'
  | 'completed'
  | 'closed'
  | 'comment';

export interface MissionEvent {
  id: string;
  type: MissionEventType;
  /**
   * Horodatage ISO (converti en Date côté UI).
   */
  timestamp: string;
  actor: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  data?: {
    comment?: string;
    amount?: number;
    oldValue?: unknown;
    newValue?: unknown;
    expenseId?: string;
    expenseDescription?: string;
  };
}

export type StatutRemboursement = 'brouillon' | 'en_attente' | 'valide' | 'refuse' | 'paye' | 'demande_info';

/** Statuts dépense (nouveau flux simplifié) */
export type ExpenseStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'reimbursed';

export type StatutJustificatif = 'non_fournis' | 'en_attente' | 'valide' | 'rejete';

export interface Depense {
  id: string;
  missionId?: string | null;
  montant: number;
  devise: string;
  date: string; // ISO
  categorie: string;
  description: string;
  modeRemboursement: ModeRemboursement;
  statutRemboursement: StatutRemboursement;
  justificatifUrl?: string;
  statutJustificatif: StatutJustificatif;
  flags: string[];
  userId: string;
  transactionCarteId?: string | null;
  /** Message de l'approbateur lors d'une demande d'information */
  commentaireApprobateur?: string;
  /** Date de la demande d'information */
  dateDemandeInfo?: string;
  /** Nom de l'approbateur ayant fait la demande */
  approbateurNom?: string;
}

export type TypeDemande = 'mission' | 'avance' | 'depense';

export type StatutDemande = 'en_attente' | 'approuvee' | 'rejete';

export interface DemandeApprobation {
  id: string;
  type: TypeDemande;
  entityId: string;
  demandeurId: string;
  approbateurId: string;
  statut: StatutDemande;
  dateCreation: string; // ISO
  commentaire?: string;
  /**
   * Budget alloué par le manager lors de l'approbation d'une mission.
   */
  budgetAlloue?: number;
}

export interface CategorieDepense {
  id: string;
  nom: string;
  icone: string;
}

/** @deprecated Ancienne structure - utilisez PolicyRule */
export interface RegleCategorie {
  categorieId: string;
  modeDefaut: ModeRemboursement;
  plafond: number | null;
  justificatifObligatoire: boolean;
  overrideAutorise: boolean;
  /** Règle active (sinon masquée si "Afficher types inactifs" désactivé) */
  isActive?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
   NOUVELLE STRUCTURE POLITIQUES (v2) - Plafonds par poste
═══════════════════════════════════════════════════════════════════════════ */

/** Type de dépense */
export type ExpenseType =
  | 'hotel'
  | 'flight'
  | 'train'
  | 'meals'
  | 'client_meal'
  | 'taxi'
  | 'mileage'
  | 'parking'
  | 'car_rental'
  | 'miscellaneous';

/** Poste hiérarchique pour les plafonds */
export type PolicyRole = 'employee' | 'manager' | 'director';

/** Labels d'affichage pour les postes */
export const policyRoleLabels: Record<PolicyRole, string> = {
  employee: 'Employé',
  manager: 'Manager',
  director: 'Directeur',
};

/** Unité de plafond */
export type LimitUnit = 'night' | 'day' | 'trip' | 'person' | 'expense' | 'km';

/** Labels d'affichage pour les unités */
export const limitUnitLabels: Record<LimitUnit, string> = {
  night: '/ nuit',
  day: '/ jour',
  trip: '/ trajet',
  person: '/ personne',
  expense: '/ dépense',
  km: '/ km',
};

/** Plafond par poste */
export interface RoleLimit {
  role: PolicyRole;
  /** Plafond principal */
  limit: {
    amount: number | null;
    per: LimitUnit;
  };
  /** Forfaits repas (si mode forfait sur meals) */
  perDiem?: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  /** Barème kilométrique (si mileage) */
  mileageRates?: {
    mode: 'unique' | 'byPower';
    unique?: number;
    byPower?: { power: string; rate: number }[];
  };
  /** Contraintes spécifiques à ce poste */
  constraints?: {
    maxStarRating?: number | null;     // Hôtel: 2, 3, 4, 5, null = pas de limite
    allowedClasses?: string[];         // Vol, Train
    allowedCategories?: string[];      // Location voiture
    maxKmPerTrip?: number | null;      // Kilométrique, null = pas de limite
    maxKmPerDay?: number | null;       // Kilométrique, null = pas de limite
    maxGuestsWithoutApproval?: number; // Repas client
  };
  /** Autoriser dépassement */
  overrideAllowed: boolean;
  /** Justification obligatoire en cas de dépassement */
  overrideRequiresJustification?: boolean;
}

/** Supplément par ville (s'ajoute au plafond du poste) */
export interface CitySupplement {
  id: string;
  cities: string[];
  supplementAmount: number;
}

/** Règle de politique pour un type de dépense (nouvelle structure) */
export interface PolicyRule {
  id: string;
  expenseType: ExpenseType;
  reimbursementMode: 'real' | 'per_diem' | 'mileage';
  /** Plafonds par poste */
  limitsByRole: RoleLimit[];
  /** Suppléments par ville (s'ajoutent au plafond du poste) */
  citySupplements?: CitySupplement[];
  /** Infos obligatoires (repas client) */
  requiredInfo?: string[];
  /** Options remboursables (location voiture) */
  reimbursableOptions?: string[];
  /** Véhicules autorisés (kilométrique) */
  allowedVehicles?: string[];
  /** Indemnité vélo (kilométrique) */
  bikeAllowance?: number;
  /** Description obligatoire (divers) */
  descriptionRequired?: boolean;
  /** Justificatif obligatoire */
  receiptRequired: boolean;
  /** Règle active */
  isActive: boolean;
}

/** Politique de dépenses (nouvelle structure v2) */
export interface Politique {
  id: string;
  nom: string;
  description: string;
  /** Départements concernés. ['*'] = tous les départements */
  departements: string[];
  /** Règles par type de dépense (nouvelle structure) */
  rules: PolicyRule[];
  /** @deprecated Utiliser rules à la place */
  reglesCategories?: RegleCategorie[];
  /** @deprecated Supprimé - les plafonds varient par poste dans les rules */
  roles?: Role[];
  /** @deprecated Supprimé */
  pays?: string[];
  /** Priorité d'application (plus petit = plus prioritaire) */
  priorite: number;
  /** Politique active ou non */
  actif: boolean;
  /** Nombre d'employés concernés (calculé) */
  employesConcernes?: number;
  /** Date dernière modification (ISO) */
  dateModification?: string;
  /** Date de création (ISO) */
  dateCreation?: string;
}

export interface BaremeForfaitaire {
  id: string;
  pays: string;
  ville: string;
  tarifJournalier: {
    petit_dejeuner: number;
    dejeuner: number;
    diner: number;
    total: number;
  };
}

export type StatutTransactionCarte =
  | 'en_attente_justificatif'
  | 'rapprochee'
  | 'non_rapprochee';

export interface TransactionCarte {
  id: string;
  montant: number;
  date: string; // ISO
  marchand: string;
  categorie: string;
  userId: string;
  depenseId?: string | null;
  statut: StatutTransactionCarte;
}

/** Utilisateurs cohérents : 5 employés + 2 managers + 1 finance */
export const mockUsers: MockUser[] = [
  { id: 'user-001', prenom: 'Marie', nom: 'Dupont', email: 'marie.dupont@company.com', departement: 'Commercial', role: 'Employé', managerId: 'user-006' },
  { id: 'user-002', prenom: 'Thomas', nom: 'Bernard', email: 'thomas.bernard@company.com', departement: 'Tech', role: 'Employé', managerId: 'user-006' },
  { id: 'user-003', prenom: 'Sophie', nom: 'Martin', email: 'sophie.martin@company.com', departement: 'Commercial', role: 'Employé', managerId: 'user-006' },
  { id: 'user-004', prenom: 'Pierre', nom: 'Durand', email: 'pierre.durand@company.com', departement: 'Tech', role: 'Employé', managerId: 'user-007' },
  { id: 'user-005', prenom: 'Lucas', nom: 'Petit', email: 'lucas.petit@company.com', departement: 'Marketing', role: 'Employé', managerId: 'user-007' },
  { id: 'user-006', prenom: 'Jean', nom: 'Martin', email: 'jean.martin@company.com', departement: 'Commercial', role: 'Manager' },
  { id: 'user-007', prenom: 'Claire', nom: 'Dubois', email: 'claire.dubois@company.com', departement: 'Tech', role: 'Manager' },
  { id: 'user-008', prenom: 'Marc', nom: 'Finance', email: 'marc.finance@company.com', departement: 'Finance', role: 'Finance' },
];

/** 5 types de dépenses utilisés dans les données (train, flight, hotel, meals, taxi) */
export const expenseTypes = [
  { id: 'train', nom: 'Train', icone: 'Train' },
  { id: 'flight', nom: 'Vol', icone: 'Plane' },
  { id: 'hotel', nom: 'Hébergement', icone: 'Hotel' },
  { id: 'meals', nom: 'Repas', icone: 'Utensils' },
  { id: 'taxi', nom: 'Taxi', icone: 'Car' },
] as const;

export const categoriesDepense: CategorieDepense[] = expenseTypes.map((t) => ({
  id: t.id,
  nom: t.nom,
  icone: t.icone,
}));

/** Configuration des statuts de mission pour l'UI */
export const missionStatuses: { value: StatutMission; label: string }[] = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'info_demandee', label: 'Info demandée' },
  { value: 'approuvee', label: 'Approuvée' },
  { value: 'rejetee', label: 'Rejetée' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'cloture_demandee', label: 'Clôture demandée' },
  { value: 'remboursee', label: 'Remboursée' },
  { value: 'cloturee', label: 'Clôturée' },
  { value: 'annulee', label: 'Annulée' },
];

export const politiques: Politique[] = [
  {
    id: 'p1',
    nom: 'Commercial & Marketing',
    description: 'Politique pour les équipes commerciales et marketing. Plafonds adaptés aux déplacements clients fréquents.',
    departements: ['Commercial', 'Marketing'],
    priorite: 1,
    actif: true,
    employesConcernes: 8,
    dateCreation: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    dateModification: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    rules: [
      {
        id: 'r1-hotel',
        expenseType: 'hotel',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 130, per: 'night' }, constraints: { maxStarRating: 4 }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 170, per: 'night' }, constraints: { maxStarRating: 4 }, overrideAllowed: true, overrideRequiresJustification: true },
          { role: 'director', limit: { amount: 250, per: 'night' }, constraints: { maxStarRating: 5 }, overrideAllowed: true, overrideRequiresJustification: false },
        ],
        citySupplements: [
          { id: 'cs1', cities: ['Paris'], supplementAmount: 30 },
          { id: 'cs2', cities: ['Londres', 'New York'], supplementAmount: 50 },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r1-flight',
        expenseType: 'flight',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 350, per: 'trip' }, constraints: { allowedClasses: ['Economy'] }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 600, per: 'trip' }, constraints: { allowedClasses: ['Economy', 'Premium Economy'] }, overrideAllowed: true, overrideRequiresJustification: true },
          { role: 'director', limit: { amount: 1500, per: 'trip' }, constraints: { allowedClasses: ['Economy', 'Premium Economy', 'Business'] }, overrideAllowed: true },
        ],
        citySupplements: [
          { id: 'cs3', cities: ['États-Unis', 'Japon', 'Australie'], supplementAmount: 200 },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r1-train',
        expenseType: 'train',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 150, per: 'trip' }, constraints: { allowedClasses: ['2ème classe'] }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 250, per: 'trip' }, constraints: { allowedClasses: ['2ème classe', '1ère classe'] }, overrideAllowed: true },
          { role: 'director', limit: { amount: 400, per: 'trip' }, constraints: { allowedClasses: ['1ère classe'] }, overrideAllowed: true },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r1-meals',
        expenseType: 'meals',
        reimbursementMode: 'per_diem',
        limitsByRole: [
          { role: 'employee', limit: { amount: 50, per: 'day' }, perDiem: { breakfast: 12, lunch: 18, dinner: 20 }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 65, per: 'day' }, perDiem: { breakfast: 15, lunch: 22, dinner: 28 }, overrideAllowed: true },
          { role: 'director', limit: { amount: 85, per: 'day' }, perDiem: { breakfast: 18, lunch: 30, dinner: 37 }, overrideAllowed: true },
        ],
        citySupplements: [
          { id: 'cs4', cities: ['Paris', 'Londres'], supplementAmount: 10 },
        ],
        receiptRequired: false,
        isActive: true,
      },
      {
        id: 'r1-client_meal',
        expenseType: 'client_meal',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 50, per: 'person' }, constraints: { maxGuestsWithoutApproval: 4 }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 70, per: 'person' }, constraints: { maxGuestsWithoutApproval: 6 }, overrideAllowed: true },
          { role: 'director', limit: { amount: 100, per: 'person' }, constraints: { maxGuestsWithoutApproval: 10 }, overrideAllowed: true },
        ],
        citySupplements: [
          { id: 'cs5', cities: ['Paris'], supplementAmount: 15 },
        ],
        requiredInfo: ['Nom convives', 'Société'],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r1-taxi',
        expenseType: 'taxi',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 50, per: 'expense' }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 80, per: 'expense' }, overrideAllowed: true },
          { role: 'director', limit: { amount: 150, per: 'expense' }, overrideAllowed: true },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r1-mileage',
        expenseType: 'mileage',
        reimbursementMode: 'mileage',
        limitsByRole: [
          { role: 'employee', limit: { amount: 0.52, per: 'km' }, mileageRates: { mode: 'byPower', byPower: [{ power: '3 CV', rate: 0.502 }, { power: '4 CV', rate: 0.575 }, { power: '5 CV', rate: 0.603 }, { power: '6 CV', rate: 0.631 }, { power: '7 CV+', rate: 0.661 }] }, constraints: { maxKmPerTrip: 500 }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 0.52, per: 'km' }, mileageRates: { mode: 'byPower', byPower: [{ power: '3 CV', rate: 0.502 }, { power: '4 CV', rate: 0.575 }, { power: '5 CV', rate: 0.603 }, { power: '6 CV', rate: 0.631 }, { power: '7 CV+', rate: 0.661 }] }, constraints: { maxKmPerTrip: 800 }, overrideAllowed: true },
          { role: 'director', limit: { amount: 0.52, per: 'km' }, mileageRates: { mode: 'byPower', byPower: [{ power: '3 CV', rate: 0.502 }, { power: '4 CV', rate: 0.575 }, { power: '5 CV', rate: 0.603 }, { power: '6 CV', rate: 0.631 }, { power: '7 CV+', rate: 0.661 }] }, constraints: { maxKmPerTrip: null }, overrideAllowed: true },
        ],
        allowedVehicles: ['Voiture', 'Moto/Scooter'],
        receiptRequired: false,
        isActive: true,
      },
      {
        id: 'r1-parking',
        expenseType: 'parking',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 25, per: 'day' }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 35, per: 'day' }, overrideAllowed: true },
          { role: 'director', limit: { amount: 50, per: 'day' }, overrideAllowed: true },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r1-car_rental',
        expenseType: 'car_rental',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 60, per: 'day' }, constraints: { allowedCategories: ['Economy', 'Compact'] }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 90, per: 'day' }, constraints: { allowedCategories: ['Economy', 'Compact', 'Midsize'] }, overrideAllowed: true },
          { role: 'director', limit: { amount: 150, per: 'day' }, constraints: { allowedCategories: ['Economy', 'Compact', 'Midsize', 'Fullsize', 'Premium'] }, overrideAllowed: true },
        ],
        reimbursableOptions: ['Assurance', 'GPS', 'Plein essence'],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r1-miscellaneous',
        expenseType: 'miscellaneous',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 50, per: 'expense' }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 100, per: 'expense' }, overrideAllowed: true },
          { role: 'director', limit: { amount: 200, per: 'expense' }, overrideAllowed: true },
        ],
        descriptionRequired: true,
        receiptRequired: true,
        isActive: true,
      },
    ],
  },
  {
    id: 'p2',
    nom: 'Tech & Produit',
    description: 'Politique pour les équipes techniques. Moins de déplacements clients, focus sur les conférences et formations.',
    departements: ['Tech', 'Produit', 'Data'],
    priorite: 2,
    actif: true,
    employesConcernes: 15,
    dateCreation: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    dateModification: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    rules: [
      {
        id: 'r2-hotel',
        expenseType: 'hotel',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 120, per: 'night' }, constraints: { maxStarRating: 3 }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 150, per: 'night' }, constraints: { maxStarRating: 4 }, overrideAllowed: true, overrideRequiresJustification: true },
          { role: 'director', limit: { amount: 220, per: 'night' }, constraints: { maxStarRating: 5 }, overrideAllowed: true },
        ],
        citySupplements: [
          { id: 'cs6', cities: ['Paris', 'San Francisco', 'New York'], supplementAmount: 40 },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r2-flight',
        expenseType: 'flight',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 400, per: 'trip' }, constraints: { allowedClasses: ['Economy'] }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 700, per: 'trip' }, constraints: { allowedClasses: ['Economy', 'Premium Economy'] }, overrideAllowed: true },
          { role: 'director', limit: { amount: 2000, per: 'trip' }, constraints: { allowedClasses: ['Economy', 'Premium Economy', 'Business'] }, overrideAllowed: true },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r2-train',
        expenseType: 'train',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 120, per: 'trip' }, constraints: { allowedClasses: ['2ème classe'] }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 200, per: 'trip' }, constraints: { allowedClasses: ['2ème classe', '1ère classe'] }, overrideAllowed: true },
          { role: 'director', limit: { amount: 350, per: 'trip' }, constraints: { allowedClasses: ['1ère classe'] }, overrideAllowed: true },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r2-meals',
        expenseType: 'meals',
        reimbursementMode: 'per_diem',
        limitsByRole: [
          { role: 'employee', limit: { amount: 45, per: 'day' }, perDiem: { breakfast: 10, lunch: 16, dinner: 19 }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 55, per: 'day' }, perDiem: { breakfast: 12, lunch: 20, dinner: 23 }, overrideAllowed: true },
          { role: 'director', limit: { amount: 75, per: 'day' }, perDiem: { breakfast: 15, lunch: 28, dinner: 32 }, overrideAllowed: true },
        ],
        receiptRequired: false,
        isActive: true,
      },
      {
        id: 'r2-taxi',
        expenseType: 'taxi',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 40, per: 'expense' }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 60, per: 'expense' }, overrideAllowed: true },
          { role: 'director', limit: { amount: 100, per: 'expense' }, overrideAllowed: true },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r2-mileage',
        expenseType: 'mileage',
        reimbursementMode: 'mileage',
        limitsByRole: [
          { role: 'employee', limit: { amount: 0.45, per: 'km' }, mileageRates: { mode: 'unique', unique: 0.45 }, constraints: { maxKmPerTrip: 300 }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 0.50, per: 'km' }, mileageRates: { mode: 'unique', unique: 0.50 }, constraints: { maxKmPerTrip: 500 }, overrideAllowed: true },
          { role: 'director', limit: { amount: 0.55, per: 'km' }, mileageRates: { mode: 'unique', unique: 0.55 }, constraints: { maxKmPerTrip: null }, overrideAllowed: true },
        ],
        allowedVehicles: ['Voiture', 'Vélo'],
        bikeAllowance: 0.25,
        receiptRequired: false,
        isActive: true,
      },
      {
        id: 'r2-parking',
        expenseType: 'parking',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 20, per: 'day' }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 30, per: 'day' }, overrideAllowed: true },
          { role: 'director', limit: { amount: 45, per: 'day' }, overrideAllowed: true },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r2-miscellaneous',
        expenseType: 'miscellaneous',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 100, per: 'expense' }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 200, per: 'expense' }, overrideAllowed: true },
          { role: 'director', limit: { amount: 500, per: 'expense' }, overrideAllowed: true },
        ],
        descriptionRequired: true,
        receiptRequired: true,
        isActive: true,
      },
    ],
  },
  {
    id: 'p3',
    nom: 'Tous les départements',
    description: 'Politique par défaut applicable à tous les départements non couverts par une politique spécifique.',
    departements: ['*'],
    priorite: 99,
    actif: true,
    employesConcernes: 45,
    dateCreation: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    dateModification: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    rules: [
      {
        id: 'r3-hotel',
        expenseType: 'hotel',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 100, per: 'night' }, constraints: { maxStarRating: 3 }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 130, per: 'night' }, constraints: { maxStarRating: 4 }, overrideAllowed: true, overrideRequiresJustification: true },
          { role: 'director', limit: { amount: 200, per: 'night' }, constraints: { maxStarRating: 5 }, overrideAllowed: true },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r3-flight',
        expenseType: 'flight',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 300, per: 'trip' }, constraints: { allowedClasses: ['Economy'] }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 500, per: 'trip' }, constraints: { allowedClasses: ['Economy', 'Premium Economy'] }, overrideAllowed: true },
          { role: 'director', limit: { amount: 1200, per: 'trip' }, constraints: { allowedClasses: ['Economy', 'Premium Economy', 'Business'] }, overrideAllowed: true },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r3-train',
        expenseType: 'train',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 100, per: 'trip' }, constraints: { allowedClasses: ['2ème classe'] }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 180, per: 'trip' }, constraints: { allowedClasses: ['2ème classe', '1ère classe'] }, overrideAllowed: true },
          { role: 'director', limit: { amount: 300, per: 'trip' }, constraints: { allowedClasses: ['1ère classe'] }, overrideAllowed: true },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r3-meals',
        expenseType: 'meals',
        reimbursementMode: 'per_diem',
        limitsByRole: [
          { role: 'employee', limit: { amount: 40, per: 'day' }, perDiem: { breakfast: 8, lunch: 15, dinner: 17 }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 50, per: 'day' }, perDiem: { breakfast: 10, lunch: 18, dinner: 22 }, overrideAllowed: true },
          { role: 'director', limit: { amount: 70, per: 'day' }, perDiem: { breakfast: 14, lunch: 26, dinner: 30 }, overrideAllowed: true },
        ],
        receiptRequired: false,
        isActive: true,
      },
      {
        id: 'r3-taxi',
        expenseType: 'taxi',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 35, per: 'expense' }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 50, per: 'expense' }, overrideAllowed: true },
          { role: 'director', limit: { amount: 80, per: 'expense' }, overrideAllowed: true },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r3-mileage',
        expenseType: 'mileage',
        reimbursementMode: 'mileage',
        limitsByRole: [
          { role: 'employee', limit: { amount: 0.45, per: 'km' }, mileageRates: { mode: 'unique', unique: 0.45 }, constraints: { maxKmPerTrip: 200 }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 0.45, per: 'km' }, mileageRates: { mode: 'unique', unique: 0.45 }, constraints: { maxKmPerTrip: 400 }, overrideAllowed: true },
          { role: 'director', limit: { amount: 0.50, per: 'km' }, mileageRates: { mode: 'unique', unique: 0.50 }, constraints: { maxKmPerTrip: null }, overrideAllowed: true },
        ],
        allowedVehicles: ['Voiture'],
        receiptRequired: false,
        isActive: true,
      },
      {
        id: 'r3-parking',
        expenseType: 'parking',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 15, per: 'day' }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 25, per: 'day' }, overrideAllowed: true },
          { role: 'director', limit: { amount: 40, per: 'day' }, overrideAllowed: true },
        ],
        receiptRequired: true,
        isActive: true,
      },
      {
        id: 'r3-miscellaneous',
        expenseType: 'miscellaneous',
        reimbursementMode: 'real',
        limitsByRole: [
          { role: 'employee', limit: { amount: 30, per: 'expense' }, overrideAllowed: false },
          { role: 'manager', limit: { amount: 75, per: 'expense' }, overrideAllowed: true },
          { role: 'director', limit: { amount: 150, per: 'expense' }, overrideAllowed: true },
        ],
        descriptionRequired: true,
        receiptRequired: true,
        isActive: true,
      },
    ],
  },
];

export const baremesForfaitaires: BaremeForfaitaire[] = [
  {
    id: 'b1',
    pays: 'France',
    ville: 'Paris',
    tarifJournalier: {
      petit_dejeuner: 8,
      dejeuner: 18,
      diner: 25,
      total: 51,
    },
  },
  {
    id: 'b2',
    pays: 'France',
    ville: 'Lyon',
    tarifJournalier: {
      petit_dejeuner: 7,
      dejeuner: 16,
      diner: 22,
      total: 45,
    },
  },
  {
    id: 'b3',
    pays: 'Belgique',
    ville: 'Bruxelles',
    tarifJournalier: {
      petit_dejeuner: 9,
      dejeuner: 20,
      diner: 27,
      total: 56,
    },
  },
  {
    id: 'b4',
    pays: 'Allemagne',
    ville: 'Berlin',
    tarifJournalier: {
      petit_dejeuner: 8,
      dejeuner: 19,
      diner: 24,
      total: 51,
    },
  },
];

/** 10 missions cohérentes (1 par statut) - scénario janvier 2026 */
export const missions: Mission[] = [
  {
    id: 'mission-001',
    titre: 'Salon Tech Berlin 2026',
    destination: 'Berlin',
    dateDebut: '2026-03-15',
    dateFin: '2026-03-18',
    statut: 'brouillon',
    budgetAlloue: null,
    depense: 0,
    userId: 'user-001',
    categoriesDemandees: ['Train', 'Vol', 'Hébergement', 'Repas'],
    depensesPrevues: [
      { id: 'dp-001-1', categorieId: 'flight', description: 'Vol Paris-Berlin A/R', montantEstime: 280, modeRemboursement: 'reel' },
      { id: 'dp-001-2', categorieId: 'hotel', description: 'Hotel 3 nuits', montantEstime: 450, modeRemboursement: 'reel' },
      { id: 'dp-001-3', categorieId: 'meals', description: 'Repas 4 jours', montantEstime: 200, modeRemboursement: 'reel' },
    ],
    events: [
      { id: 'mission-001-e1', type: 'created', timestamp: '2026-01-28T09:00:00.000Z', actor: { id: 'user-001', name: 'Marie Dupont', role: 'Employé' } },
    ],
  },
  {
    id: 'mission-002',
    titre: 'Formation AWS Paris',
    destination: 'Paris',
    dateDebut: '2026-02-20',
    dateFin: '2026-02-21',
    statut: 'en_attente',
    budgetAlloue: null,
    depense: 0,
    userId: 'user-002',
    categoriesDemandees: ['Train', 'Repas'],
    depensesPrevues: [
      { id: 'dp-002-1', categorieId: 'train', description: 'TGV Lyon-Paris A/R', montantEstime: 150, modeRemboursement: 'reel' },
      { id: 'dp-002-2', categorieId: 'meals', description: 'Repas 2 jours', montantEstime: 80, modeRemboursement: 'reel' },
    ],
    events: [
      { id: 'mission-002-e1', type: 'created', timestamp: '2026-01-25T09:00:00.000Z', actor: { id: 'user-002', name: 'Thomas Bernard', role: 'Employé' } },
      { id: 'mission-002-e2', type: 'submitted', timestamp: '2026-01-26T10:00:00.000Z', actor: { id: 'user-002', name: 'Thomas Bernard', role: 'Employé' } },
    ],
  },
  {
    id: 'mission-003',
    titre: 'Client Meeting Londres',
    destination: 'Londres',
    dateDebut: '2026-02-10',
    dateFin: '2026-02-12',
    statut: 'info_demandee',
    budgetAlloue: null,
    depense: 0,
    userId: 'user-003',
    categoriesDemandees: ['Vol', 'Hébergement', 'Repas', 'Taxi'],
    depensesPrevues: [
      { id: 'dp-003-1', categorieId: 'flight', description: 'Vol Paris-Londres A/R', montantEstime: 200, modeRemboursement: 'reel' },
      { id: 'dp-003-2', categorieId: 'hotel', description: 'Hotel 2 nuits', montantEstime: 350, modeRemboursement: 'reel' },
      { id: 'dp-003-3', categorieId: 'meals', description: 'Dîner client', montantEstime: 250, modeRemboursement: 'reel' },
      { id: 'dp-003-4', categorieId: 'taxi', description: 'Trajets', montantEstime: 80, modeRemboursement: 'reel' },
    ],
    events: [
      { id: 'mission-003-e1', type: 'created', timestamp: '2026-01-20T09:00:00.000Z', actor: { id: 'user-003', name: 'Sophie Martin', role: 'Employé' } },
      { id: 'mission-003-e2', type: 'submitted', timestamp: '2026-01-21T10:00:00.000Z', actor: { id: 'user-003', name: 'Sophie Martin', role: 'Employé' } },
      { id: 'mission-003-e3', type: 'info_requested', timestamp: '2026-01-22T14:00:00.000Z', actor: { id: 'user-006', name: 'Jean Martin', role: 'Manager' }, data: { comment: "Merci de préciser le nombre de convives pour le dîner client et le nom de l'entreprise" } },
    ],
  },
  {
    id: 'mission-004',
    titre: 'Audit Technique Lyon',
    destination: 'Lyon',
    dateDebut: '2026-02-05',
    dateFin: '2026-02-07',
    statut: 'approuvee',
    budgetAlloue: 650,
    depense: 0,
    userId: 'user-004',
    participants: ['user-004', 'user-002'],
    categoriesDemandees: ['Train', 'Hébergement', 'Repas', 'Taxi'],
    depensesPrevues: [
      { id: 'dp-004-1', categorieId: 'train', description: 'TGV Paris-Lyon A/R', montantEstime: 120, modeRemboursement: 'reel' },
      { id: 'dp-004-2', categorieId: 'hotel', description: 'Hotel 2 nuits', montantEstime: 260, modeRemboursement: 'reel' },
      { id: 'dp-004-3', categorieId: 'meals', description: 'Repas 3 jours', montantEstime: 120, modeRemboursement: 'reel' },
      { id: 'dp-004-4', categorieId: 'taxi', description: 'Trajets gare-client', montantEstime: 50, modeRemboursement: 'reel' },
    ],
    events: [
      { id: 'mission-004-e1', type: 'created', timestamp: '2026-01-15T09:00:00.000Z', actor: { id: 'user-004', name: 'Pierre Durand', role: 'Employé' } },
      { id: 'mission-004-e2', type: 'submitted', timestamp: '2026-01-15T10:00:00.000Z', actor: { id: 'user-004', name: 'Pierre Durand', role: 'Employé' } },
      { id: 'mission-004-e3', type: 'approved', timestamp: '2026-01-16T14:00:00.000Z', actor: { id: 'user-007', name: 'Claire Dubois', role: 'Manager' }, data: { amount: 650, comment: 'OK, budget 650€ accordé', oldValue: null, newValue: 650 } },
    ],
  },
  {
    id: 'mission-005',
    titre: 'Conférence Marketing Las Vegas',
    destination: 'Las Vegas',
    dateDebut: '2026-03-01',
    dateFin: '2026-03-05',
    statut: 'rejetee',
    budgetAlloue: null,
    depense: 0,
    userId: 'user-005',
    categoriesDemandees: ['Vol', 'Hébergement', 'Repas'],
    depensesPrevues: [
      { id: 'dp-005-1', categorieId: 'flight', description: 'Vol Paris-Las Vegas A/R', montantEstime: 1200, modeRemboursement: 'reel' },
      { id: 'dp-005-2', categorieId: 'hotel', description: 'Hotel 4 nuits', montantEstime: 1600, modeRemboursement: 'reel' },
      { id: 'dp-005-3', categorieId: 'meals', description: 'Repas 5 jours', montantEstime: 400, modeRemboursement: 'reel' },
    ],
    events: [
      { id: 'mission-005-e1', type: 'created', timestamp: '2026-01-10T09:00:00.000Z', actor: { id: 'user-005', name: 'Lucas Petit', role: 'Employé' } },
      { id: 'mission-005-e2', type: 'submitted', timestamp: '2026-01-10T10:00:00.000Z', actor: { id: 'user-005', name: 'Lucas Petit', role: 'Employé' } },
      { id: 'mission-005-e3', type: 'rejected', timestamp: '2026-01-12T14:00:00.000Z', actor: { id: 'user-007', name: 'Claire Dubois', role: 'Manager' }, data: { comment: "Budget trop élevé. Merci de privilégier la version en ligne de la conférence cette année." } },
    ],
  },
  {
    id: 'mission-006',
    titre: 'Prospection Client Bordeaux',
    destination: 'Bordeaux',
    dateDebut: '2026-01-28',
    dateFin: '2026-01-30',
    statut: 'en_cours',
    budgetAlloue: 600,
    depense: 284,
    userId: 'user-001',
    categoriesDemandees: ['Train', 'Hébergement', 'Repas'],
    depensesPrevues: [
      { id: 'dp-006-1', categorieId: 'train', description: 'TGV Paris-Bordeaux', montantEstime: 89, modeRemboursement: 'reel' },
      { id: 'dp-006-2', categorieId: 'hotel', description: 'Hotel 2 nuits', montantEstime: 240, modeRemboursement: 'reel' },
      { id: 'dp-006-3', categorieId: 'meals', description: 'Repas prospect', montantEstime: 150, modeRemboursement: 'reel' },
    ],
    events: [
      { id: 'mission-006-e1', type: 'created', timestamp: '2026-01-20T09:00:00.000Z', actor: { id: 'user-001', name: 'Marie Dupont', role: 'Employé' } },
      { id: 'mission-006-e2', type: 'submitted', timestamp: '2026-01-20T10:00:00.000Z', actor: { id: 'user-001', name: 'Marie Dupont', role: 'Employé' } },
      { id: 'mission-006-e3', type: 'approved', timestamp: '2026-01-21T14:00:00.000Z', actor: { id: 'user-006', name: 'Jean Martin', role: 'Manager' }, data: { amount: 600, oldValue: null, newValue: 600 } },
      { id: 'mission-006-e4', type: 'advance_requested', timestamp: '2026-01-22T09:00:00.000Z', actor: { id: 'user-001', name: 'Marie Dupont', role: 'Employé' }, data: { amount: 150 } },
      { id: 'mission-006-e5', type: 'advance_approved', timestamp: '2026-01-22T11:00:00.000Z', actor: { id: 'user-006', name: 'Jean Martin', role: 'Manager' }, data: { amount: 150 } },
      { id: 'mission-006-e6', type: 'advance_paid', timestamp: '2026-01-23T10:00:00.000Z', actor: { id: 'user-008', name: 'Marc Finance', role: 'Finance' }, data: { amount: 150 } },
      { id: 'mission-006-e7', type: 'expense_added', timestamp: '2026-01-28T12:00:00.000Z', actor: { id: 'user-001', name: 'Marie Dupont', role: 'Employé' }, data: { expenseId: 'exp-001', expenseDescription: 'TGV Paris-Bordeaux', amount: 89 } },
      { id: 'mission-006-e8', type: 'expense_added', timestamp: '2026-01-28T18:00:00.000Z', actor: { id: 'user-001', name: 'Marie Dupont', role: 'Employé' }, data: { expenseId: 'exp-002', expenseDescription: 'Hotel Mercure nuit 1', amount: 120 } },
      { id: 'mission-006-e9', type: 'expense_added', timestamp: '2026-01-29T13:00:00.000Z', actor: { id: 'user-001', name: 'Marie Dupont', role: 'Employé' }, data: { expenseId: 'exp-003', expenseDescription: 'Déjeuner prospect', amount: 75 } },
    ],
  },
  {
    id: 'mission-007',
    titre: 'Workshop Dev Madrid',
    destination: 'Madrid',
    dateDebut: '2026-01-20',
    dateFin: '2026-01-23',
    statut: 'cloture_demandee',
    budgetAlloue: 900,
    depense: 725,
    userId: 'user-002',
    categoriesDemandees: ['Vol', 'Hébergement', 'Repas', 'Taxi'],
    depensesPrevues: [
      { id: 'dp-007-1', categorieId: 'flight', description: 'Vol Paris-Madrid A/R', montantEstime: 180, modeRemboursement: 'reel' },
      { id: 'dp-007-2', categorieId: 'hotel', description: 'Hotel 3 nuits', montantEstime: 330, modeRemboursement: 'reel' },
      { id: 'dp-007-3', categorieId: 'meals', description: 'Repas 4 jours forfait', montantEstime: 160, modeRemboursement: 'forfait' },
      { id: 'dp-007-4', categorieId: 'taxi', description: 'Taxi aéroport x2', montantEstime: 55, modeRemboursement: 'reel' },
    ],
    events: [
      { id: 'mission-007-e1', type: 'created', timestamp: '2026-01-10T09:00:00.000Z', actor: { id: 'user-002', name: 'Thomas Bernard', role: 'Employé' } },
      { id: 'mission-007-e2', type: 'submitted', timestamp: '2026-01-10T10:00:00.000Z', actor: { id: 'user-002', name: 'Thomas Bernard', role: 'Employé' } },
      { id: 'mission-007-e3', type: 'approved', timestamp: '2026-01-11T14:00:00.000Z', actor: { id: 'user-006', name: 'Jean Martin', role: 'Manager' }, data: { amount: 900, oldValue: null, newValue: 900 } },
      { id: 'mission-007-e3b', type: 'advance_requested', timestamp: '2026-01-12T09:00:00.000Z', actor: { id: 'user-002', name: 'Thomas Bernard', role: 'Employé' }, data: { amount: 250 } },
      { id: 'mission-007-e3c', type: 'advance_approved', timestamp: '2026-01-12T11:00:00.000Z', actor: { id: 'user-006', name: 'Jean Martin', role: 'Manager' }, data: { amount: 250 } },
      { id: 'mission-007-e3d', type: 'advance_paid', timestamp: '2026-01-13T10:00:00.000Z', actor: { id: 'user-008', name: 'Marc Finance', role: 'Finance' }, data: { amount: 250 } },
      { id: 'mission-007-e4', type: 'expense_added', timestamp: '2026-01-20T11:00:00.000Z', actor: { id: 'user-002', name: 'Thomas Bernard', role: 'Employé' }, data: { expenseId: 'exp-004', expenseDescription: 'Vol Paris-Madrid A/R', amount: 180 } },
      { id: 'mission-007-e5', type: 'expense_added', timestamp: '2026-01-23T09:00:00.000Z', actor: { id: 'user-002', name: 'Thomas Bernard', role: 'Employé' }, data: { expenseId: 'exp-005', expenseDescription: 'Hotel 3 nuits', amount: 330 } },
      { id: 'mission-007-e6', type: 'expense_added', timestamp: '2026-01-23T10:00:00.000Z', actor: { id: 'user-002', name: 'Thomas Bernard', role: 'Employé' }, data: { expenseId: 'exp-006', expenseDescription: 'Repas 4 jours forfait', amount: 160 } },
      { id: 'mission-007-e7', type: 'expense_added', timestamp: '2026-01-23T11:00:00.000Z', actor: { id: 'user-002', name: 'Thomas Bernard', role: 'Employé' }, data: { expenseId: 'exp-007', expenseDescription: 'Taxi aéroport x2', amount: 55 } },
      { id: 'mission-007-e8', type: 'closure_requested', timestamp: '2026-01-27T09:00:00.000Z', actor: { id: 'user-002', name: 'Thomas Bernard', role: 'Employé' }, data: { comment: 'Demande de clôture.' } },
    ],
  },
  {
    id: 'mission-008',
    titre: 'Salon Retail Nantes',
    destination: 'Nantes',
    dateDebut: '2026-01-13',
    dateFin: '2026-01-15',
    statut: 'remboursee',
    budgetAlloue: 700,
    depense: 580,
    userId: 'user-003',
    categoriesDemandees: ['Train', 'Hébergement', 'Repas'],
    depensesPrevues: [
      { id: 'dp-008-1', categorieId: 'train', description: 'TGV Paris-Nantes A/R', montantEstime: 140, modeRemboursement: 'reel' },
      { id: 'dp-008-2', categorieId: 'hotel', description: 'Hotel 2 nuits', montantEstime: 280, modeRemboursement: 'reel' },
      { id: 'dp-008-3', categorieId: 'meals', description: 'Repas 3 jours', montantEstime: 160, modeRemboursement: 'forfait' },
    ],
    events: [
      { id: 'mission-008-e1', type: 'created', timestamp: '2026-01-05T09:00:00.000Z', actor: { id: 'user-003', name: 'Sophie Martin', role: 'Employé' } },
      { id: 'mission-008-e2', type: 'submitted', timestamp: '2026-01-05T10:00:00.000Z', actor: { id: 'user-003', name: 'Sophie Martin', role: 'Employé' } },
      { id: 'mission-008-e3', type: 'approved', timestamp: '2026-01-06T14:00:00.000Z', actor: { id: 'user-006', name: 'Jean Martin', role: 'Manager' }, data: { amount: 700, oldValue: null, newValue: 700 } },
      { id: 'mission-008-e4', type: 'expense_added', timestamp: '2026-01-13T11:00:00.000Z', actor: { id: 'user-003', name: 'Sophie Martin', role: 'Employé' }, data: { expenseId: 'exp-008', amount: 140 } },
      { id: 'mission-008-e5', type: 'expense_added', timestamp: '2026-01-14T09:00:00.000Z', actor: { id: 'user-003', name: 'Sophie Martin', role: 'Employé' }, data: { expenseId: 'exp-009', amount: 280 } },
      { id: 'mission-008-e6', type: 'expense_added', timestamp: '2026-01-14T12:00:00.000Z', actor: { id: 'user-003', name: 'Sophie Martin', role: 'Employé' }, data: { expenseId: 'exp-010', amount: 100 } },
      { id: 'mission-008-e7', type: 'expense_added', timestamp: '2026-01-15T12:00:00.000Z', actor: { id: 'user-003', name: 'Sophie Martin', role: 'Employé' }, data: { expenseId: 'exp-011', amount: 60 } },
      { id: 'mission-008-e8', type: 'closure_requested', timestamp: '2026-01-16T09:00:00.000Z', actor: { id: 'user-003', name: 'Sophie Martin', role: 'Employé' }, data: { comment: 'Demande de clôture.' } },
      { id: 'mission-008-e9', type: 'closure_approved', timestamp: '2026-01-16T15:00:00.000Z', actor: { id: 'user-006', name: 'Jean Martin', role: 'Manager' }, data: { comment: 'Clôture validée.' } },
      { id: 'mission-008-e10', type: 'reimbursement_sent', timestamp: '2026-01-17T10:00:00.000Z', actor: { id: 'user-008', name: 'Marc Finance', role: 'Finance' }, data: { amount: 580, comment: 'Remboursement envoyé.' } },
    ],
  },
  {
    id: 'mission-009',
    titre: 'Séminaire Tech Nice 2025',
    destination: 'Nice',
    dateDebut: '2025-12-05',
    dateFin: '2025-12-07',
    statut: 'cloturee',
    budgetAlloue: 1200,
    depense: 1150,
    userId: 'user-004',
    categoriesDemandees: ['Train', 'Hébergement', 'Repas', 'Taxi'],
    depensesPrevues: [
      { id: 'dp-009-1', categorieId: 'train', description: 'TGV Paris-Nice A/R', montantEstime: 150, modeRemboursement: 'reel' },
      { id: 'dp-009-2', categorieId: 'hotel', description: 'Hotel 2 nuits Nice', montantEstime: 400, modeRemboursement: 'reel' },
      { id: 'dp-009-3', categorieId: 'meals', description: 'Repas séminaire', montantEstime: 350, modeRemboursement: 'reel' },
      { id: 'dp-009-4', categorieId: 'taxi', description: 'Trajets', montantEstime: 250, modeRemboursement: 'reel' },
    ],
    events: [
      { id: 'mission-009-e1', type: 'created', timestamp: '2025-11-20T09:00:00.000Z', actor: { id: 'user-004', name: 'Pierre Durand', role: 'Employé' } },
      { id: 'mission-009-e2', type: 'submitted', timestamp: '2025-11-20T10:00:00.000Z', actor: { id: 'user-004', name: 'Pierre Durand', role: 'Employé' } },
      { id: 'mission-009-e3', type: 'approved', timestamp: '2025-11-21T14:00:00.000Z', actor: { id: 'user-007', name: 'Claire Dubois', role: 'Manager' }, data: { amount: 1200, oldValue: null, newValue: 1200 } },
      { id: 'mission-009-e4', type: 'expense_added', timestamp: '2025-12-05T11:00:00.000Z', actor: { id: 'user-004', name: 'Pierre Durand', role: 'Employé' }, data: { expenseId: 'exp-012', amount: 150 } },
      { id: 'mission-009-e5', type: 'expense_added', timestamp: '2025-12-05T18:00:00.000Z', actor: { id: 'user-004', name: 'Pierre Durand', role: 'Employé' }, data: { expenseId: 'exp-013', amount: 400 } },
      { id: 'mission-009-e6', type: 'expense_added', timestamp: '2025-12-06T12:00:00.000Z', actor: { id: 'user-004', name: 'Pierre Durand', role: 'Employé' }, data: { expenseId: 'exp-014', amount: 200 } },
      { id: 'mission-009-e7', type: 'expense_added', timestamp: '2025-12-06T14:00:00.000Z', actor: { id: 'user-004', name: 'Pierre Durand', role: 'Employé' }, data: { expenseId: 'exp-015', amount: 150 } },
      { id: 'mission-009-e8', type: 'expense_added', timestamp: '2025-12-07T12:00:00.000Z', actor: { id: 'user-004', name: 'Pierre Durand', role: 'Employé' }, data: { expenseId: 'exp-016', amount: 150 } },
      { id: 'mission-009-e9', type: 'expense_added', timestamp: '2025-12-07T15:00:00.000Z', actor: { id: 'user-004', name: 'Pierre Durand', role: 'Employé' }, data: { expenseId: 'exp-017', amount: 100 } },
      { id: 'mission-009-e10', type: 'closure_requested', timestamp: '2025-12-08T09:00:00.000Z', actor: { id: 'user-004', name: 'Pierre Durand', role: 'Employé' }, data: { comment: 'Demande de clôture.' } },
      { id: 'mission-009-e11', type: 'closure_approved', timestamp: '2025-12-08T15:00:00.000Z', actor: { id: 'user-007', name: 'Claire Dubois', role: 'Manager' }, data: { comment: 'Clôture validée.' } },
      { id: 'mission-009-e12', type: 'reimbursement_sent', timestamp: '2025-12-09T10:00:00.000Z', actor: { id: 'user-008', name: 'Marc Finance', role: 'Finance' }, data: { amount: 1150, comment: 'Remboursement envoyé.' } },
      { id: 'mission-009-e13', type: 'closed', timestamp: '2025-12-10T11:00:00.000Z', actor: { id: 'user-007', name: 'Claire Dubois', role: 'Manager' }, data: { comment: 'Mission archivée.' } },
    ],
  },
  {
    id: 'mission-010',
    titre: 'Demo Client Toulouse',
    destination: 'Toulouse',
    dateDebut: '2026-01-25',
    dateFin: '2026-01-26',
    statut: 'annulee',
    budgetAlloue: null,
    depense: 0,
    userId: 'user-005',
    categoriesDemandees: ['Train', 'Hébergement', 'Repas'],
    events: [
      { id: 'mission-010-e1', type: 'created', timestamp: '2026-01-22T09:00:00.000Z', actor: { id: 'user-005', name: 'Lucas Petit', role: 'Employé' } },
      { id: 'mission-010-e2', type: 'comment', timestamp: '2026-01-23T14:00:00.000Z', actor: { id: 'user-005', name: 'Lucas Petit', role: 'Employé' }, data: { comment: 'Client a annulé le meeting' } },
    ],
  },
];

/** Dépenses : une par statut (brouillon, en_attente, valide, refuse, demande_info, paye) */
export const depenses: Depense[] = [
  { id: 'exp-000', missionId: 'mission-006', userId: 'user-001', montant: 35, devise: 'EUR', date: '2026-01-27', categorie: 'Repas', description: 'Déjeuner client Lyon', modeRemboursement: 'reel', statutRemboursement: 'brouillon', statutJustificatif: 'non_fournis', flags: [], justificatifUrl: undefined },
  { id: 'exp-001', missionId: 'mission-006', userId: 'user-001', montant: 89, devise: 'EUR', date: '2026-01-28', categorie: 'Train', description: 'TGV Paris-Bordeaux', modeRemboursement: 'reel', statutRemboursement: 'valide', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/1.pdf' },
  { id: 'exp-003', missionId: 'mission-006', userId: 'user-001', montant: 75, devise: 'EUR', date: '2026-01-29', categorie: 'Repas', description: 'Déjeuner prospect', modeRemboursement: 'reel', statutRemboursement: 'en_attente', statutJustificatif: 'en_attente', flags: ['plafond_depasse'], justificatifUrl: 'https://example.com/j/3.pdf' },
  { id: 'exp-010', missionId: 'mission-007', userId: 'user-002', montant: 42, devise: 'EUR', date: '2026-01-26', categorie: 'Taxi', description: 'Taxi gare Part-Dieu', modeRemboursement: 'reel', statutRemboursement: 'en_attente', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/10.pdf' },
  { id: 'exp-011', missionId: 'mission-007', userId: 'user-002', montant: 215, devise: 'EUR', date: '2026-01-25', categorie: 'Hôtel', description: 'Hôtel Mercure Lyon 1 nuit', modeRemboursement: 'reel', statutRemboursement: 'en_attente', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/11.pdf' },
  { id: 'exp-012', missionId: 'mission-007', userId: 'user-002', montant: 18, devise: 'EUR', date: '2026-01-24', categorie: 'Repas', description: 'Petit-déjeuner réunion', modeRemboursement: 'forfait', statutRemboursement: 'en_attente', statutJustificatif: 'en_attente', flags: [], justificatifUrl: undefined },
  { id: 'exp-013', missionId: 'mission-007', userId: 'user-002', montant: 156, devise: 'EUR', date: '2026-01-23', categorie: 'Train', description: 'TGV Lyon-Marseille A/R', modeRemboursement: 'reel', statutRemboursement: 'en_attente', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/13.pdf' },
  { id: 'exp-004', missionId: 'mission-007', userId: 'user-002', montant: 180, devise: 'EUR', date: '2026-01-20', categorie: 'Vol', description: 'Vol Paris-Madrid A/R', modeRemboursement: 'reel', statutRemboursement: 'refuse', statutJustificatif: 'valide', flags: ['hors_politique'], justificatifUrl: 'https://example.com/j/4.pdf' },
  { id: 'exp-005', missionId: 'mission-007', userId: 'user-002', montant: 45, devise: 'EUR', date: '2026-01-22', categorie: 'Taxi', description: 'Taxi aéroport Madrid', modeRemboursement: 'reel', statutRemboursement: 'demande_info', statutJustificatif: 'en_attente', flags: ['justificatif_manquant'], justificatifUrl: undefined, commentaireApprobateur: 'Bonjour, merci de fournir le justificatif du taxi (reçu ou facture). Le montant semble également différent de ce qui était prévu dans le budget mission. Pouvez-vous clarifier ?', dateDemandeInfo: '2026-01-24T14:30:00.000Z', approbateurNom: 'Marie Dupont' },
  { id: 'exp-008', missionId: 'mission-008', userId: 'user-003', montant: 140, devise: 'EUR', date: '2026-01-13', categorie: 'Train', description: 'TGV Paris-Nantes A/R', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/8.pdf' },
  // Dépenses supplémentaires pour alimenter le dashboard manager
  { id: 'exp-020', missionId: 'mission-006', userId: 'user-001', montant: 210, devise: 'EUR', date: '2026-01-15', categorie: 'Hôtel', description: 'Hôtel Ibis Bordeaux 1 nuit', modeRemboursement: 'reel', statutRemboursement: 'valide', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/20.pdf' },
  { id: 'exp-021', missionId: 'mission-006', userId: 'user-001', montant: 32, devise: 'EUR', date: '2026-01-16', categorie: 'Taxi', description: 'Taxi gare Bordeaux', modeRemboursement: 'reel', statutRemboursement: 'valide', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/21.pdf' },
  { id: 'exp-022', missionId: 'mission-006', userId: 'user-001', montant: 28, devise: 'EUR', date: '2026-01-17', categorie: 'Repas', description: 'Dîner client Bordeaux', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/22.pdf' },
  { id: 'exp-023', missionId: 'mission-006', userId: 'user-001', montant: 15, devise: 'EUR', date: '2026-01-18', categorie: 'Parking', description: 'Parking aéroport CDG', modeRemboursement: 'reel', statutRemboursement: 'valide', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/23.pdf' },
  { id: 'exp-030', missionId: 'mission-007', userId: 'user-002', montant: 320, devise: 'EUR', date: '2026-01-21', categorie: 'Hôtel', description: 'Hôtel NH Madrid 2 nuits', modeRemboursement: 'reel', statutRemboursement: 'valide', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/30.pdf' },
  { id: 'exp-031', missionId: 'mission-007', userId: 'user-002', montant: 55, devise: 'EUR', date: '2026-01-22', categorie: 'Repas', description: 'Dîner équipe Madrid', modeRemboursement: 'reel', statutRemboursement: 'valide', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/31.pdf' },
  { id: 'exp-032', missionId: 'mission-007', userId: 'user-002', montant: 12, devise: 'EUR', date: '2026-01-23', categorie: 'Fournitures', description: 'Fournitures bureau Madrid', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/32.pdf' },
  { id: 'exp-040', missionId: 'mission-008', userId: 'user-003', montant: 185, devise: 'EUR', date: '2026-01-08', categorie: 'Hôtel', description: 'Hôtel Novotel Nantes', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/40.pdf' },
  { id: 'exp-041', missionId: 'mission-008', userId: 'user-003', montant: 38, devise: 'EUR', date: '2026-01-09', categorie: 'Taxi', description: 'Taxi gare Nantes', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/41.pdf' },
  { id: 'exp-042', missionId: 'mission-008', userId: 'user-003', montant: 22, devise: 'EUR', date: '2026-01-10', categorie: 'Repas', description: 'Déjeuner client Nantes', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/42.pdf' },
  { id: 'exp-043', missionId: 'mission-008', userId: 'user-003', montant: 65, devise: 'EUR', date: '2026-01-14', categorie: 'Vol', description: 'Vol Nantes-Paris', modeRemboursement: 'reel', statutRemboursement: 'en_attente', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/43.pdf' },
  { id: 'exp-044', missionId: 'mission-008', userId: 'user-003', montant: 95, devise: 'EUR', date: '2026-01-12', categorie: 'Fournitures', description: 'Matériel présentation Nantes', modeRemboursement: 'reel', statutRemboursement: 'valide', statutJustificatif: 'valide', flags: ['plafond_depasse'], justificatifUrl: 'https://example.com/j/44.pdf' },
  // Dépenses mois précédent (décembre 2025) pour comparaison graphique
  { id: 'exp-050', missionId: 'mission-006', userId: 'user-001', montant: 175, devise: 'EUR', date: '2025-12-10', categorie: 'Hôtel', description: 'Hôtel Lyon mission client', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/50.pdf' },
  { id: 'exp-051', missionId: 'mission-006', userId: 'user-001', montant: 95, devise: 'EUR', date: '2025-12-11', categorie: 'Train', description: 'TGV Paris-Lyon A/R', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/51.pdf' },
  { id: 'exp-052', missionId: 'mission-006', userId: 'user-001', montant: 42, devise: 'EUR', date: '2025-12-12', categorie: 'Repas', description: 'Déjeuner client Lyon', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/52.pdf' },
  { id: 'exp-053', missionId: 'mission-006', userId: 'user-001', montant: 28, devise: 'EUR', date: '2025-12-13', categorie: 'Taxi', description: 'Taxi gare Lyon', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/53.pdf' },
  { id: 'exp-054', missionId: 'mission-007', userId: 'user-002', montant: 250, devise: 'EUR', date: '2025-12-05', categorie: 'Hôtel', description: 'Hôtel Barcelone 2 nuits', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/54.pdf' },
  { id: 'exp-055', missionId: 'mission-007', userId: 'user-002', montant: 190, devise: 'EUR', date: '2025-12-04', categorie: 'Vol', description: 'Vol Paris-Barcelone', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/55.pdf' },
  { id: 'exp-056', missionId: 'mission-007', userId: 'user-002', montant: 65, devise: 'EUR', date: '2025-12-06', categorie: 'Repas', description: 'Dîner conférence Barcelone', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/56.pdf' },
  { id: 'exp-057', missionId: 'mission-007', userId: 'user-002', montant: 35, devise: 'EUR', date: '2025-12-07', categorie: 'Taxi', description: 'Taxi aéroport Barcelone', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/57.pdf' },
  { id: 'exp-058', missionId: 'mission-008', userId: 'user-003', montant: 120, devise: 'EUR', date: '2025-12-15', categorie: 'Train', description: 'TGV Paris-Rennes A/R', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/58.pdf' },
  { id: 'exp-059', missionId: 'mission-008', userId: 'user-003', montant: 48, devise: 'EUR', date: '2025-12-16', categorie: 'Repas', description: 'Déjeuner partenaire Rennes', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/59.pdf' },
  { id: 'exp-060', missionId: 'mission-008', userId: 'user-003', montant: 80, devise: 'EUR', date: '2025-12-18', categorie: 'Fournitures', description: 'Matériel formation Rennes', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/60.pdf' },
  { id: 'exp-061', missionId: 'mission-008', userId: 'user-003', montant: 22, devise: 'EUR', date: '2025-12-17', categorie: 'Parking', description: 'Parking gare Rennes', modeRemboursement: 'reel', statutRemboursement: 'paye', statutJustificatif: 'valide', flags: [], justificatifUrl: 'https://example.com/j/61.pdf' },
];

/** 3 approbations explicites cohérentes avec le scénario (mission, dépense, avance) */
export const demandesApprobation: DemandeApprobation[] = [
  {
    id: 'approval-001',
    type: 'mission',
    entityId: 'mission-002',
    demandeurId: 'user-002',
    approbateurId: 'user-006',
    statut: 'en_attente',
    dateCreation: '2026-01-26T09:00:00.000Z',
    commentaire: 'Merci de valider cette mission (Formation AWS Paris).',
  },
  {
    id: 'approval-002',
    type: 'depense',
    entityId: 'exp-003',
    demandeurId: 'user-001',
    approbateurId: 'user-006',
    statut: 'en_attente',
    dateCreation: '2026-01-29T09:00:00.000Z',
    commentaire: 'Dépense à valider (Déjeuner prospect - mission Bordeaux).',
  },
  {
    id: 'approval-003',
    type: 'avance',
    entityId: 'mission-007',
    demandeurId: 'user-002',
    approbateurId: 'user-006',
    statut: 'en_attente',
    dateCreation: '2026-01-28T09:00:00.000Z',
    commentaire: "En mission à Madrid depuis le 20/01 pour le workshop. Demande d'avance pour couvrir les frais restants sur place (repas, déplacements) jusqu'au retour le 23/01.",
  },
  {
    id: 'approval-004',
    type: 'depense',
    entityId: 'exp-004',
    demandeurId: 'user-002',
    approbateurId: 'user-006',
    statut: 'en_attente',
    dateCreation: '2026-01-21T10:00:00.000Z',
    commentaire: 'Vol Paris-Madrid A/R à valider.',
  },
  {
    id: 'approval-005',
    type: 'depense',
    entityId: 'exp-043',
    demandeurId: 'user-003',
    approbateurId: 'user-006',
    statut: 'en_attente',
    dateCreation: '2026-01-25T08:30:00.000Z',
    commentaire: 'Vol Nantes-Paris à valider.',
  },
  {
    id: 'approval-006',
    type: 'mission',
    entityId: 'mission-008',
    demandeurId: 'user-003',
    approbateurId: 'user-006',
    statut: 'approuvee',
    dateCreation: '2026-01-04T11:00:00.000Z',
    commentaire: 'Mission client Nantes approuvée.',
    budgetAlloue: 700,
  },
  {
    id: 'approval-007',
    type: 'depense',
    entityId: 'exp-011',
    demandeurId: 'user-002',
    approbateurId: 'user-006',
    statut: 'en_attente',
    dateCreation: '2026-01-22T14:00:00.000Z',
    commentaire: 'Hôtel Mercure Lyon 1 nuit à valider.',
  },
  {
    id: 'approval-008',
    type: 'depense',
    entityId: 'exp-044',
    demandeurId: 'user-003',
    approbateurId: 'user-006',
    statut: 'en_attente',
    dateCreation: '2026-01-14T09:00:00.000Z',
    commentaire: 'Matériel présentation Nantes à valider.',
  },
  {
    id: 'approval-009',
    type: 'depense',
    entityId: 'exp-001',
    demandeurId: 'user-001',
    approbateurId: 'user-006',
    statut: 'approuvee',
    dateCreation: '2026-01-10T08:00:00.000Z',
    commentaire: 'TGV Paris-Bordeaux approuvé.',
  },
  {
    id: 'approval-010',
    type: 'depense',
    entityId: 'exp-020',
    demandeurId: 'user-001',
    approbateurId: 'user-006',
    statut: 'approuvee',
    dateCreation: '2026-01-08T10:00:00.000Z',
    commentaire: 'Hôtel Ibis Bordeaux approuvé.',
  },
  {
    id: 'approval-011',
    type: 'avance',
    entityId: 'mission-006',
    demandeurId: 'user-001',
    approbateurId: 'user-006',
    statut: 'approuvee',
    dateCreation: '2026-01-05T09:00:00.000Z',
    commentaire: 'Avance mission Bordeaux approuvée.',
  },
  {
    id: 'approval-012',
    type: 'depense',
    entityId: 'exp-030',
    demandeurId: 'user-002',
    approbateurId: 'user-006',
    statut: 'approuvee',
    dateCreation: '2026-01-15T11:00:00.000Z',
    commentaire: 'Hôtel NH Madrid approuvé.',
  },
];

/** Transactions carte (liées à certaines dépenses pour la démo) */
export const transactionsCarte: TransactionCarte[] = depenses
  .filter((d) => ['exp-001', 'exp-004', 'exp-008'].includes(d.id))
  .map((d, i) => ({
    id: `t${i + 1}`,
    montant: d.montant,
    date: d.date,
    marchand: ['SNCF', 'Air France', 'SNCF'][i],
    categorie: d.categorie,
    userId: d.userId,
    depenseId: d.id,
    statut: 'rapprochee' as StatutTransactionCarte,
  }));

// ─── FINANCE ────────────────────────────────────────────────────────────────

export type FinanceStatut =
  | 'a_approuver'
  | 'approuve'
  | 'a_rembourser'
  | 'rembourse'
  | 'exporte'
  | 'rejete';

export type FinanceConformite = 'conforme' | 'depassement' | 'anomalie';

export interface FinanceItem {
  id: string;
  type: TypeDemande; // 'mission' | 'depense' | 'avance'
  entityId: string;
  demandeurId: string;
  demandeurNom: string;
  departement: string;
  objet: string;
  montant: number;
  dateSoumission: string;
  conformite: FinanceConformite;
  statutFinance: FinanceStatut;
  dateApprobationManager: string;
  iban?: string;
  dateApprobationFinance?: string;
  dateRemboursement?: string;
  refVirement?: string;
  dateExport?: string;
  anomalieDetail?: string;
}

export interface FinanceHistoryEntry {
  id: string;
  date: string;
  action: 'approuve' | 'rejete' | 'rembourse' | 'exporte';
  type: TypeDemande;
  employeNom: string;
  objet: string;
  montant: number;
  par: string;
  entityId: string;
}

export const financeItems: FinanceItem[] = [
  // --- À approuver (validé par Manager, en attente Finance) ---
  { id: 'fin-001', type: 'mission', entityId: 'mission-002', demandeurId: 'user-002', demandeurNom: 'Thomas Bernard', departement: 'Tech', objet: 'Formation AWS Paris', montant: 2400, dateSoumission: '2026-01-20', conformite: 'conforme', statutFinance: 'a_approuver', dateApprobationManager: '2026-01-22' },
  { id: 'fin-002', type: 'depense', entityId: 'exp-003', demandeurId: 'user-001', demandeurNom: 'Marie Dupont', departement: 'Commercial', objet: 'Déjeuner prospect Bordeaux', montant: 75, dateSoumission: '2026-01-23', conformite: 'depassement', statutFinance: 'a_approuver', dateApprobationManager: '2026-01-24', anomalieDetail: 'Plafond repas: 25 €/pers.' },
  { id: 'fin-003', type: 'avance', entityId: 'mission-007', demandeurId: 'user-002', demandeurNom: 'Thomas Bernard', departement: 'Tech', objet: 'Avance mission Madrid', montant: 500, dateSoumission: '2026-01-18', conformite: 'conforme', statutFinance: 'a_approuver', dateApprobationManager: '2026-01-19' },
  { id: 'fin-004', type: 'depense', entityId: 'exp-011', demandeurId: 'user-002', demandeurNom: 'Thomas Bernard', departement: 'Tech', objet: 'Hôtel Mercure Lyon 1 nuit', montant: 215, dateSoumission: '2026-01-21', conformite: 'conforme', statutFinance: 'a_approuver', dateApprobationManager: '2026-01-23' },
  { id: 'fin-005', type: 'mission', entityId: 'mission-008', demandeurId: 'user-003', demandeurNom: 'Sophie Martin', departement: 'Commercial', objet: 'Salon Tech Nantes', montant: 1800, dateSoumission: '2026-01-10', conformite: 'anomalie', statutFinance: 'a_approuver', dateApprobationManager: '2026-01-12', anomalieDetail: 'Budget alloué supérieur au plafond direction' },
  { id: 'fin-006', type: 'depense', entityId: 'exp-043', demandeurId: 'user-003', demandeurNom: 'Sophie Martin', departement: 'Commercial', objet: 'Vol Nantes-Paris', montant: 65, dateSoumission: '2026-01-15', conformite: 'conforme', statutFinance: 'a_approuver', dateApprobationManager: '2026-01-16' },
  { id: 'fin-007', type: 'depense', entityId: 'exp-044', demandeurId: 'user-003', demandeurNom: 'Sophie Martin', departement: 'Commercial', objet: 'Matériel présentation Nantes', montant: 95, dateSoumission: '2026-01-13', conformite: 'depassement', statutFinance: 'a_approuver', dateApprobationManager: '2026-01-14', anomalieDetail: 'Dépassement plafond fournitures: 50 €' },

  // --- À rembourser (approuvé Finance, en attente de virement) ---
  { id: 'fin-010', type: 'depense', entityId: 'exp-001', demandeurId: 'user-001', demandeurNom: 'Marie Dupont', departement: 'Commercial', objet: 'TGV Paris-Bordeaux', montant: 89, dateSoumission: '2026-01-10', conformite: 'conforme', statutFinance: 'a_rembourser', dateApprobationManager: '2026-01-11', dateApprobationFinance: '2026-01-15', iban: 'FR76 3000 4028 3700 0100 4521' },
  { id: 'fin-011', type: 'depense', entityId: 'exp-020', demandeurId: 'user-001', demandeurNom: 'Marie Dupont', departement: 'Commercial', objet: 'Hôtel Ibis Bordeaux 1 nuit', montant: 210, dateSoumission: '2026-01-08', conformite: 'conforme', statutFinance: 'a_rembourser', dateApprobationManager: '2026-01-09', dateApprobationFinance: '2026-01-13', iban: 'FR76 3000 4028 3700 0100 4521' },
  { id: 'fin-012', type: 'avance', entityId: 'mission-006', demandeurId: 'user-001', demandeurNom: 'Marie Dupont', departement: 'Commercial', objet: 'Avance mission Bordeaux', montant: 300, dateSoumission: '2026-01-05', conformite: 'conforme', statutFinance: 'a_rembourser', dateApprobationManager: '2026-01-06', dateApprobationFinance: '2026-01-10', iban: 'FR76 3000 4028 3700 0100 4521' },
  { id: 'fin-013', type: 'depense', entityId: 'exp-030', demandeurId: 'user-002', demandeurNom: 'Thomas Bernard', departement: 'Tech', objet: 'Hôtel NH Madrid 2 nuits', montant: 320, dateSoumission: '2026-01-15', conformite: 'conforme', statutFinance: 'a_rembourser', dateApprobationManager: '2026-01-16', dateApprobationFinance: '2026-01-20', iban: 'FR76 1234 5678 9012 3456 7890' },

  // --- Remboursé (en attente export) - Janvier 2026 ---
  { id: 'fin-020', type: 'depense', entityId: 'exp-022', demandeurId: 'user-001', demandeurNom: 'Marie Dupont', departement: 'Commercial', objet: 'Dîner client Bordeaux', montant: 28, dateSoumission: '2026-01-05', conformite: 'conforme', statutFinance: 'rembourse', dateApprobationManager: '2026-01-06', dateApprobationFinance: '2026-01-08', dateRemboursement: '2026-01-12', refVirement: 'VIR-2026-0112-001' },
  { id: 'fin-021', type: 'depense', entityId: 'exp-021', demandeurId: 'user-001', demandeurNom: 'Marie Dupont', departement: 'Commercial', objet: 'Taxi gare Bordeaux', montant: 32, dateSoumission: '2026-01-06', conformite: 'conforme', statutFinance: 'rembourse', dateApprobationManager: '2026-01-07', dateApprobationFinance: '2026-01-09', dateRemboursement: '2026-01-12', refVirement: 'VIR-2026-0112-002' },
  { id: 'fin-022', type: 'depense', entityId: 'exp-023', demandeurId: 'user-001', demandeurNom: 'Marie Dupont', departement: 'Commercial', objet: 'Parking aéroport CDG', montant: 15, dateSoumission: '2026-01-07', conformite: 'conforme', statutFinance: 'rembourse', dateApprobationManager: '2026-01-08', dateApprobationFinance: '2026-01-10', dateRemboursement: '2026-01-14', refVirement: 'VIR-2026-0114-001' },
  { id: 'fin-023', type: 'depense', entityId: 'exp-031', demandeurId: 'user-002', demandeurNom: 'Thomas Bernard', departement: 'Tech', objet: 'Dîner équipe Madrid', montant: 55, dateSoumission: '2026-01-10', conformite: 'conforme', statutFinance: 'rembourse', dateApprobationManager: '2026-01-11', dateApprobationFinance: '2026-01-14', dateRemboursement: '2026-01-18', refVirement: 'VIR-2026-0118-001' },
  { id: 'fin-024', type: 'depense', entityId: 'exp-032', demandeurId: 'user-002', demandeurNom: 'Thomas Bernard', departement: 'Tech', objet: 'Fournitures bureau Madrid', montant: 12, dateSoumission: '2026-01-11', conformite: 'conforme', statutFinance: 'rembourse', dateApprobationManager: '2026-01-12', dateApprobationFinance: '2026-01-15', dateRemboursement: '2026-01-18', refVirement: 'VIR-2026-0118-002' },
  { id: 'fin-025', type: 'depense', entityId: 'exp-008', demandeurId: 'user-003', demandeurNom: 'Sophie Martin', departement: 'Commercial', objet: 'TGV Paris-Nantes A/R', montant: 140, dateSoumission: '2026-01-04', conformite: 'conforme', statutFinance: 'rembourse', dateApprobationManager: '2026-01-05', dateApprobationFinance: '2026-01-07', dateRemboursement: '2026-01-10', refVirement: 'VIR-2026-0110-001' },
  { id: 'fin-026', type: 'depense', entityId: 'exp-040', demandeurId: 'user-003', demandeurNom: 'Sophie Martin', departement: 'Commercial', objet: 'Hôtel Novotel Nantes', montant: 185, dateSoumission: '2026-01-04', conformite: 'conforme', statutFinance: 'rembourse', dateApprobationManager: '2026-01-05', dateApprobationFinance: '2026-01-07', dateRemboursement: '2026-01-10', refVirement: 'VIR-2026-0110-002' },
  { id: 'fin-027', type: 'depense', entityId: 'exp-041', demandeurId: 'user-003', demandeurNom: 'Sophie Martin', departement: 'Commercial', objet: 'Taxi gare Nantes', montant: 38, dateSoumission: '2026-01-05', conformite: 'conforme', statutFinance: 'rembourse', dateApprobationManager: '2026-01-06', dateApprobationFinance: '2026-01-08', dateRemboursement: '2026-01-12', refVirement: 'VIR-2026-0112-003' },
  { id: 'fin-028', type: 'depense', entityId: 'exp-042', demandeurId: 'user-003', demandeurNom: 'Sophie Martin', departement: 'Commercial', objet: 'Déjeuner client Nantes', montant: 22, dateSoumission: '2026-01-06', conformite: 'conforme', statutFinance: 'rembourse', dateApprobationManager: '2026-01-07', dateApprobationFinance: '2026-01-09', dateRemboursement: '2026-01-14', refVirement: 'VIR-2026-0114-002' },

  // --- Remboursé (déjà exporté) - Décembre 2025 ---
  { id: 'fin-030', type: 'depense', entityId: 'exp-050', demandeurId: 'user-001', demandeurNom: 'Marie Dupont', departement: 'Commercial', objet: 'Hôtel Lyon mission client', montant: 175, dateSoumission: '2025-12-02', conformite: 'conforme', statutFinance: 'exporte', dateApprobationManager: '2025-12-03', dateApprobationFinance: '2025-12-05', dateRemboursement: '2025-12-10', refVirement: 'VIR-2025-1210-001', dateExport: '2026-01-05' },
  { id: 'fin-031', type: 'depense', entityId: 'exp-051', demandeurId: 'user-001', demandeurNom: 'Marie Dupont', departement: 'Commercial', objet: 'TGV Paris-Lyon A/R', montant: 95, dateSoumission: '2025-12-03', conformite: 'conforme', statutFinance: 'exporte', dateApprobationManager: '2025-12-04', dateApprobationFinance: '2025-12-06', dateRemboursement: '2025-12-10', refVirement: 'VIR-2025-1210-002', dateExport: '2026-01-05' },
  { id: 'fin-032', type: 'depense', entityId: 'exp-052', demandeurId: 'user-001', demandeurNom: 'Marie Dupont', departement: 'Commercial', objet: 'Déjeuner client Lyon', montant: 42, dateSoumission: '2025-12-04', conformite: 'conforme', statutFinance: 'exporte', dateApprobationManager: '2025-12-05', dateApprobationFinance: '2025-12-07', dateRemboursement: '2025-12-12', refVirement: 'VIR-2025-1212-001', dateExport: '2026-01-05' },
  { id: 'fin-033', type: 'depense', entityId: 'exp-054', demandeurId: 'user-002', demandeurNom: 'Thomas Bernard', departement: 'Tech', objet: 'Hôtel Barcelone 2 nuits', montant: 250, dateSoumission: '2025-12-01', conformite: 'conforme', statutFinance: 'exporte', dateApprobationManager: '2025-12-02', dateApprobationFinance: '2025-12-04', dateRemboursement: '2025-12-08', refVirement: 'VIR-2025-1208-001', dateExport: '2026-01-05' },
  { id: 'fin-034', type: 'depense', entityId: 'exp-055', demandeurId: 'user-002', demandeurNom: 'Thomas Bernard', departement: 'Tech', objet: 'Vol Paris-Barcelone', montant: 190, dateSoumission: '2025-12-01', conformite: 'conforme', statutFinance: 'exporte', dateApprobationManager: '2025-12-02', dateApprobationFinance: '2025-12-04', dateRemboursement: '2025-12-08', refVirement: 'VIR-2025-1208-002', dateExport: '2026-01-05' },
  { id: 'fin-035', type: 'depense', entityId: 'exp-056', demandeurId: 'user-002', demandeurNom: 'Thomas Bernard', departement: 'Tech', objet: 'Dîner conférence Barcelone', montant: 65, dateSoumission: '2025-12-02', conformite: 'conforme', statutFinance: 'exporte', dateApprobationManager: '2025-12-03', dateApprobationFinance: '2025-12-05', dateRemboursement: '2025-12-10', refVirement: 'VIR-2025-1210-003', dateExport: '2026-01-05' },
  { id: 'fin-036', type: 'depense', entityId: 'exp-058', demandeurId: 'user-003', demandeurNom: 'Sophie Martin', departement: 'Commercial', objet: 'TGV Paris-Rennes A/R', montant: 120, dateSoumission: '2025-12-08', conformite: 'conforme', statutFinance: 'exporte', dateApprobationManager: '2025-12-09', dateApprobationFinance: '2025-12-11', dateRemboursement: '2025-12-15', refVirement: 'VIR-2025-1215-001', dateExport: '2026-01-05' },
  { id: 'fin-037', type: 'depense', entityId: 'exp-059', demandeurId: 'user-003', demandeurNom: 'Sophie Martin', departement: 'Commercial', objet: 'Déjeuner partenaire Rennes', montant: 48, dateSoumission: '2025-12-09', conformite: 'conforme', statutFinance: 'exporte', dateApprobationManager: '2025-12-10', dateApprobationFinance: '2025-12-12', dateRemboursement: '2025-12-15', refVirement: 'VIR-2025-1215-002', dateExport: '2026-01-05' },
];export const financeHistory: FinanceHistoryEntry[] = [
  { id: 'fh-001', date: '2026-01-25', action: 'approuve', type: 'mission', employeNom: 'Pierre Durand', objet: 'Audit client Marseille', montant: 1500, par: 'Claire Finance', entityId: 'mission-010' },
  { id: 'fh-002', date: '2026-01-24', action: 'rejete', type: 'depense', employeNom: 'Lucas Petit', objet: 'Minibar hôtel', montant: 35, par: 'Claire Finance', entityId: 'exp-100' },
  { id: 'fh-003', date: '2026-01-23', action: 'rembourse', type: 'depense', employeNom: 'Marie Dupont', objet: 'Dîner client Bordeaux', montant: 28, par: 'Claire Finance', entityId: 'exp-022' },
  { id: 'fh-004', date: '2026-01-22', action: 'approuve', type: 'depense', employeNom: 'Thomas Bernard', objet: 'TGV Paris-Bordeaux', montant: 89, par: 'Claire Finance', entityId: 'exp-001' },
  { id: 'fh-005', date: '2026-01-21', action: 'rembourse', type: 'depense', employeNom: 'Marie Dupont', objet: 'Taxi gare Bordeaux', montant: 32, par: 'Claire Finance', entityId: 'exp-021' },
  { id: 'fh-006', date: '2026-01-20', action: 'approuve', type: 'avance', employeNom: 'Marie Dupont', objet: 'Avance mission Bordeaux', montant: 300, par: 'Claire Finance', entityId: 'mission-006' },
  { id: 'fh-007', date: '2026-01-18', action: 'rembourse', type: 'depense', employeNom: 'Thomas Bernard', objet: 'Dîner équipe Madrid', montant: 55, par: 'Claire Finance', entityId: 'exp-031' },
  { id: 'fh-008', date: '2026-01-15', action: 'approuve', type: 'mission', employeNom: 'Sophie Martin', objet: 'Salon Tech Nantes', montant: 700, par: 'Claire Finance', entityId: 'mission-008' },
  { id: 'fh-009', date: '2026-01-14', action: 'rembourse', type: 'depense', employeNom: 'Marie Dupont', objet: 'Parking aéroport CDG', montant: 15, par: 'Claire Finance', entityId: 'exp-023' },
  { id: 'fh-010', date: '2026-01-12', action: 'rembourse', type: 'depense', employeNom: 'Sophie Martin', objet: 'TGV Paris-Nantes A/R', montant: 140, par: 'Claire Finance', entityId: 'exp-008' },
  { id: 'fh-011', date: '2026-01-10', action: 'rembourse', type: 'depense', employeNom: 'Sophie Martin', objet: 'Hôtel Novotel Nantes', montant: 185, par: 'Claire Finance', entityId: 'exp-040' },
  { id: 'fh-012', date: '2026-01-05', action: 'exporte', type: 'depense', employeNom: '—', objet: 'Export Décembre 2025 (8 éléments)', montant: 985, par: 'Claire Finance', entityId: 'export-dec-2025' },
  { id: 'fh-013', date: '2025-12-28', action: 'rejete', type: 'depense', employeNom: 'Pierre Durand', objet: 'Spa hôtel Lyon', montant: 120, par: 'Claire Finance', entityId: 'exp-200' },
  { id: 'fh-014', date: '2025-12-22', action: 'approuve', type: 'depense', employeNom: 'Thomas Bernard', objet: 'Hôtel Barcelone 2 nuits', montant: 250, par: 'Claire Finance', entityId: 'exp-054' },
];
