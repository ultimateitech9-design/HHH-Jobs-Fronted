import { useMemo } from 'react';
import { getCurrentUser } from '../../../utils/auth';
import StudentMergedJobsFeed from '../components/StudentMergedJobsFeed';
import StudentMarketplaceShell from '../components/StudentMarketplaceShell';

const StudentHomePage = () => {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const isRetiredUser = currentUser?.role === 'retired_employee';

  return (
    <StudentMarketplaceShell>
      <StudentMergedJobsFeed />
      <p className="hidden text-xs">{isRetiredUser ? 'Retired Professional Workspace' : 'Student Workspace'}</p>
    </StudentMarketplaceShell>
  );
};

export default StudentHomePage;
