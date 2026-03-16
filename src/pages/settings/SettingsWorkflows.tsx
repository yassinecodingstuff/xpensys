import type { FC } from 'react';
import WorkflowsList from '../admin/WorkflowsList';

/** Re-uses the existing WorkflowsList component inside the settings layout. */
const SettingsWorkflows: FC = () => <WorkflowsList />;

export default SettingsWorkflows;
