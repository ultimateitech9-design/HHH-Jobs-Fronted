import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { CampusDriveApplicantsPanel } from './CampusDrivesPage';

export default function CampusDriveApplicantsPage() {
  const { driveId } = useParams();

  return (
    <div className="vw-shell-wide space-y-4 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Campus Drive</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">Manage Applicants</h1>
          <p className="mt-1 text-sm text-slate-500">Review applications, update stages, add rounds, and manage bulk actions.</p>
        </div>
        <Link
          to="/portal/campus-connect/drives"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <FiArrowLeft size={14} />
          Back to pools
        </Link>
      </div>

      <CampusDriveApplicantsPanel
        drive={{ id: driveId }}
        pageMode
      />
    </div>
  );
}
