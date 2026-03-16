export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
}

export type MissionStatus =
  | 'draft'
  | 'pending_approval'
  | 'info_requested'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'pending_closure'
  | 'completed'
  | 'closed'
  | 'cancelled';

export interface DepensePrevue {
  id: string;
  categorieId: string;
  description: string;
  montantEstime: number;
  modeRemboursement: ModeRemboursement;
}

export interface Mission {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO date
  endDate?: string; // ISO date
  status: MissionStatus;
  ownerId: string; // User.id
  destination?: string;
  /**
   * Budget alloué par le manager lors de l'approbation.
   * null si la mission n'est pas encore approuvée.
   */
  budgetAlloue: number | null;
  /**
   * Catégories de dépenses que le collaborateur souhaite utiliser
   * pour cette mission. Les règles (plafonds, mode) viennent des politiques.
   */
  categoriesDemandees: string[];
  /**
   * Détail des dépenses prévues saisies par le collaborateur
   * lors de la demande de mission.
   */
  depensesPrevues: DepensePrevue[];
  /**
   * Somme des montants estimés pour les dépenses prévues.
   */
  montantTotalPrevu: number;
}

export interface Categorie {
  id: string;
  nom: string;
  icone: string;
}

export type ModeRemboursement = 'reel' | 'forfait' | 'calcule';

export interface RegleCategorie {
  categorieId: string;
  modeDefaut: ModeRemboursement;
  plafond: number | null;
  justificatifObligatoire: boolean;
  /**
   * Indique si un manager peut exceptionnellement modifier le plafond
   * ou le mode de remboursement pour cette catégorie.
   */
  overrideAutorise: boolean;
}

export interface Politique {
  id: string;
  nom: string;
  description: string;
  departements: string[];
  roles: string[];
  reglesCategories: RegleCategorie[];
}

export type ExpenseCategory =
  | 'TRANSPORT'
  | 'ACCOMMODATION'
  | 'MEAL'
  | 'OTHER';

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'OTHER';

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'reimbursed';

export interface Expense {
  id: string;
  missionId?: string;
  userId: string;
  date: string; // ISO date
  label: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  status: ExpenseStatus;
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalItem {
  id: string;
  type: 'EXPENSE';
  targetId: string; // Expense.id
  approverId: string; // User.id
  status: ApprovalStatus;
  createdAt: string; // ISO date
  decidedAt?: string; // ISO date
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}


