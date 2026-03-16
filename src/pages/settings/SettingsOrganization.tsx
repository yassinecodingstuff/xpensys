import type { FC } from 'react';
import { useState } from 'react';
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  Save,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const SettingsOrganization: FC = () => {
  const [form, setForm] = useState({
    nom: 'Xpensys SAS',
    siret: '123 456 789 00012',
    adresse: '42 rue de la Innovation',
    codePostal: '75008',
    ville: 'Paris',
    pays: 'France',
    telephone: '+33 1 23 45 67 89',
    email: 'contact@xpensys.fr',
    siteWeb: 'https://xpensys.fr',
    devise: 'EUR',
    fuseau: 'Europe/Paris',
    exerciceDebut: '01/01',
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Nom de l'organisation"
                value={form.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                leftIcon={<Building2 className="h-4 w-4" />}
              />
            </div>
            <Input
              label="SIRET"
              value={form.siret}
              onChange={(e) => handleChange('siret', e.target.value)}
            />
            <Input
              label="Site web"
              value={form.siteWeb}
              onChange={(e) => handleChange('siteWeb', e.target.value)}
              leftIcon={<Globe className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Coordonnées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            Coordonnées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Adresse"
                value={form.adresse}
                onChange={(e) => handleChange('adresse', e.target.value)}
                leftIcon={<MapPin className="h-4 w-4" />}
              />
            </div>
            <Input
              label="Code postal"
              value={form.codePostal}
              onChange={(e) => handleChange('codePostal', e.target.value)}
            />
            <Input
              label="Ville"
              value={form.ville}
              onChange={(e) => handleChange('ville', e.target.value)}
            />
            <Input
              label="Pays"
              value={form.pays}
              onChange={(e) => handleChange('pays', e.target.value)}
            />
            <Input
              label="Téléphone"
              value={form.telephone}
              onChange={(e) => handleChange('telephone', e.target.value)}
              leftIcon={<Phone className="h-4 w-4" />}
            />
            <Input
              label="Email de contact"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Paramètres financiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-slate-400" />
            Paramètres financiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Devise par défaut
              </label>
              <select
                value={form.devise}
                onChange={(e) => handleChange('devise', e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              >
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - Dollar</option>
                <option value="GBP">GBP - Livre sterling</option>
                <option value="CHF">CHF - Franc suisse</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Fuseau horaire
              </label>
              <select
                value={form.fuseau}
                onChange={(e) => handleChange('fuseau', e.target.value)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              >
                <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
              </select>
            </div>
            <Input
              label="Début exercice fiscal"
              value={form.exerciceDebut}
              onChange={(e) => handleChange('exerciceDebut', e.target.value)}
              leftIcon={<Calendar className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm font-medium text-green-600">Enregistré avec succès</span>
        )}
        <Button
          size="sm"
          leftIcon={<Save className="h-4 w-4" />}
          onClick={handleSave}
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default SettingsOrganization;
