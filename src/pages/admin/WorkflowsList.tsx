import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Plus,
  CheckCircle2,
  Clock,
  FileEdit,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';

// Mock workflows data
const workflows = [
  {
    id: 'wf-001',
    name: 'Validation notes de frais',
    description: 'Circuit de validation standard pour les notes de frais avec seuil à 500 €.',
    status: 'published' as const,
    trigger: 'Note de frais soumise',
    steps: 4,
    updatedAt: '2026-01-25',
    createdBy: 'Jean Martin',
  },
  {
    id: 'wf-002',
    name: 'Approbation missions',
    description: 'Validation des demandes de mission par le manager et la direction.',
    status: 'published' as const,
    trigger: 'Mission soumise',
    steps: 3,
    updatedAt: '2026-01-20',
    createdBy: 'Jean Martin',
  },
  {
    id: 'wf-003',
    name: 'Demande d\'avance',
    description: 'Processus de validation des demandes d\'avance sur frais.',
    status: 'draft' as const,
    trigger: 'Avance demandée',
    steps: 2,
    updatedAt: '2026-01-18',
    createdBy: 'Marie Dupont',
  },
  {
    id: 'wf-004',
    name: 'Remboursement automatique',
    description: 'Remboursement automatique des dépenses < 50 € avec justificatif validé.',
    status: 'published' as const,
    trigger: 'Dépense validée',
    steps: 3,
    updatedAt: '2026-01-15',
    createdBy: 'Jean Martin',
  },
  {
    id: 'wf-005',
    name: 'Clôture de mission',
    description: 'Processus de clôture et bilan budgétaire en fin de mission.',
    status: 'draft' as const,
    trigger: 'Clôture demandée',
    steps: 5,
    updatedAt: '2026-01-10',
    createdBy: 'Sophie Martin',
  },
];

const statusConfig = {
  published: { label: 'Publié', variant: 'success' as const, icon: CheckCircle2 },
  draft: { label: 'Brouillon', variant: 'neutral' as const, icon: FileEdit },
};

const WorkflowsList: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Workflows
          </h1>
          <p className="text-xs text-slate-500">
            Gérez les circuits de validation et d&apos;automatisation.
          </p>
        </div>
        <Button
          size="md"
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => navigate('/admin/workflows/new')}
        >
          Nouveau workflow
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b-0 pb-0">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-slate-400" />
            <CardTitle>{workflows.length} workflows</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow</TableHead>
                <TableHead>Déclencheur</TableHead>
                <TableHead className="text-center">Étapes</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière modification</TableHead>
                <TableHead>Créé par</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((wf) => {
                const statusInfo = statusConfig[wf.status];
                const StatusIcon = statusInfo.icon;
                return (
                  <TableRow
                    key={wf.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/workflows/${wf.id}`)}
                  >
                    <TableCell className="text-sm font-medium text-slate-900">
                      {wf.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-600">{wf.trigger}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-slate-700">
                      {wf.steps}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant} size="sm">
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(wf.updatedAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {wf.createdBy}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowsList;
