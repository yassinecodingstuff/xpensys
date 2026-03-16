import type { FC } from 'react';
import PolicyList from '../admin/policies/PolicyList';

/** Re-uses the existing PolicyList component inside the settings layout. */
const SettingsPolicies: FC = () => <PolicyList />;

export default SettingsPolicies;
