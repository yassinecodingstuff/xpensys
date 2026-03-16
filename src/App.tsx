import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import DashboardManager from './pages/DashboardManager';
import ExpensesList from './pages/expenses/ExpensesList';
import ExpenseForm from './pages/expenses/ExpenseForm';
import ExpenseDetail from './pages/expenses/ExpenseDetail';
import MissionsListPage from './pages/MissionsListPage';
import MissionDetail from './pages/missions/MissionDetail';
import MissionForm from './pages/missions/MissionForm';
import ApprovalQueue from './pages/approvals/ApprovalQueue';
import ApprovalDetail from './pages/approvals/ApprovalDetail';
import AdminPage from './pages/AdminPage';
import PolicyList from './pages/admin/policies/PolicyList';
import PolicyDetail from './pages/admin/policies/PolicyDetail';
import PolicyForm from './pages/admin/policies/PolicyForm';
import WorkflowsList from './pages/admin/WorkflowsList';
import WorkflowBuilder from './pages/admin/WorkflowBuilder';
import UsersAdmin from './pages/admin/UsersAdmin';
import UserDetail from './pages/admin/users/UserDetail';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import SettingsLayout from './pages/settings/SettingsLayout';
import SettingsOrganization from './pages/settings/SettingsOrganization';
import SettingsDepartments from './pages/settings/SettingsDepartments';
import SettingsUsers from './pages/settings/SettingsUsers';
import SettingsRoles from './pages/settings/SettingsRoles';
import SettingsPolicies from './pages/settings/SettingsPolicies';
import SettingsWorkflows from './pages/settings/SettingsWorkflows';
import LoginPage from './pages/auth/LoginPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/manager" element={<DashboardManager />} />
          <Route path="/expenses" element={<ExpensesList />} />
          <Route path="/expenses/new" element={<ExpenseForm />} />
          <Route path="/expenses/:id" element={<ExpenseDetail />} />
          <Route path="/missions" element={<MissionsListPage />} />
          <Route path="/missions/new" element={<MissionForm />} />
          <Route path="/missions/:id/edit" element={<MissionForm />} />
          <Route path="/missions/:id" element={<MissionDetail />} />
          <Route path="/approvals" element={<ApprovalQueue />} />
          <Route path="/approvals/:id" element={<ApprovalDetail />} />
          <Route path="/admin" element={<AdminPage />}>
            <Route index element={<Navigate to="/admin/policies" replace />} />
            <Route path="policies" element={<PolicyList />} />
            <Route path="policies/new" element={<PolicyForm />} />
            <Route path="policies/:id/edit" element={<PolicyForm />} />
            <Route path="policies/:id" element={<PolicyDetail />} />
            <Route path="workflows" element={<WorkflowsList />} />
            <Route path="workflows/:id" element={<WorkflowBuilder />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="users/:id" element={<UserDetail />} />
          </Route>
          <Route path="/admin/*" element={<Navigate to="/admin/policies" replace />} />
          <Route path="/finance" element={<FinanceDashboard />} />
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="/settings/organization" replace />} />
            <Route path="organization" element={<SettingsOrganization />} />
            <Route path="departments" element={<SettingsDepartments />} />
            <Route path="users" element={<SettingsUsers />} />
            <Route path="roles" element={<SettingsRoles />} />
            <Route path="policies" element={<SettingsPolicies />} />
            <Route path="workflows" element={<SettingsWorkflows />} />
          </Route>
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;

