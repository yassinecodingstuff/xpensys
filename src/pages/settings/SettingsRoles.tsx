import type { FC } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

interface Permission {
  label: string;
  admin: boolean;
  manager: boolean;
  finance: boolean;
  collaborateur: boolean;
}

const permissions: Permission[] = [
  { label: 'Voir ses propres dépenses', admin: true, manager: true, finance: true, collaborateur: true },
  { label: 'Créer une dépense', admin: true, manager: true, finance: false, collaborateur: true },
  { label: 'Approuver les dépenses', admin: true, manager: true, finance: true, collaborateur: false },
  { label: 'Voir toutes les dépenses', admin: true, manager: true, finance: true, collaborateur: false },
  { label: 'Gérer les missions', admin: true, manager: true, finance: false, collaborateur: true },
  { label: 'Approuver les missions', admin: true, manager: true, finance: true, collaborateur: false },
  { label: 'Effectuer les remboursements', admin: true, manager: false, finance: true, collaborateur: false },
  { label: 'Exporter les données', admin: true, manager: false, finance: true, collaborateur: false },
  { label: 'Gérer les politiques', admin: true, manager: false, finance: false, collaborateur: false },
  { label: 'Gérer les workflows', admin: true, manager: false, finance: false, collaborateur: false },
  { label: 'Gérer les utilisateurs', admin: true, manager: false, finance: false, collaborateur: false },
  { label: 'Gérer les départements', admin: true, manager: false, finance: false, collaborateur: false },
  { label: "Accéder aux paramètres", admin: true, manager: false, finance: false, collaborateur: false },
];

const roles = [
  { key: 'admin' as const, label: 'Admin', variant: 'danger' as const, description: 'Accès complet à toute la plateforme' },
  { key: 'manager' as const, label: 'Manager', variant: 'warning' as const, description: 'Gestion d\'équipe et approbations' },
  { key: 'finance' as const, label: 'Finance', variant: 'info' as const, description: 'Remboursements et exports comptables' },
  { key: 'collaborateur' as const, label: 'Collaborateur', variant: 'neutral' as const, description: 'Saisie de dépenses et missions' },
];

const SettingsRoles: FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Rôles & Permissions</h2>
        <p className="text-sm text-slate-500">Matrice des permissions par rôle. La personnalisation sera disponible prochainement.</p>
      </div>

      {/* Role cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {roles.map((role) => (
          <Card key={role.key}>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <Badge variant={role.variant}>{role.label}</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500">{role.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                {permissions.filter((p) => p[role.key]).length} permissions
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-400" />
            Matrice des permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Permission</th>
                  {roles.map((role) => (
                    <th key={role.key} className="px-4 py-3 text-center text-xs font-medium text-slate-500">{role.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((perm, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 text-sm text-slate-700">{perm.label}</td>
                    {roles.map((role) => (
                      <td key={role.key} className="px-4 py-2.5 text-center">
                        {perm[role.key] ? (
                          <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="mx-auto h-4 w-4 text-slate-300" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Coming soon */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-slate-400" />
        <p className="mt-3 text-sm font-medium text-slate-700">Personnalisation des rôles</p>
        <p className="mt-1 text-xs text-slate-500">
          La possibilité de créer des rôles personnalisés et d'ajuster les permissions individuellement sera disponible dans une prochaine version.
        </p>
      </div>
    </div>
  );
};

export default SettingsRoles;
