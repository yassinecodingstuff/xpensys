import type { FC } from 'react';
import UsersAdmin from '../admin/UsersAdmin';

/** Re-uses the existing UsersAdmin component inside the settings layout. */
const SettingsUsers: FC = () => <UsersAdmin />;

export default SettingsUsers;
