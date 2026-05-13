import { useCallback, useState } from 'react';
import { FiLock } from 'react-icons/fi';
import usePlanAccess, { getPlanTierName } from '../hooks/usePlanAccess';
import UpgradePlanModal from './UpgradePlanModal';

const FeatureGate = ({
  feature,
  featureLabel = '',
  children,
  fallback = null,
  inline = false,
  showLockIcon = true
}) => {
  const { canAccess, currentTier, getRequiredTier, audienceRole } = usePlanAccess();
  const [showModal, setShowModal] = useState(false);
  const hasAccess = canAccess(feature);
  const requiredTier = getRequiredTier(feature);

  const handleUpgradeClick = useCallback((e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setShowModal(true);
  }, []);

  if (hasAccess) {
    return children;
  }

  if (fallback) {
    return (
      <>
        {typeof fallback === 'function' ? fallback({ onUpgrade: handleUpgradeClick }) : fallback}
        <UpgradePlanModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          featureKey={feature}
          featureLabel={featureLabel || feature}
          currentTier={currentTier}
          requiredTier={requiredTier}
          audienceRole={audienceRole}
        />
      </>
    );
  }

  if (inline) {
    return (
      <>
        <button
          type="button"
          onClick={handleUpgradeClick}
          className="group inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
        >
          {showLockIcon && <FiLock size={12} className="text-slate-400 group-hover:text-indigo-500" />}
          <span>{featureLabel || 'Upgrade to unlock'}</span>
        </button>
        <UpgradePlanModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          featureKey={feature}
          featureLabel={featureLabel || feature}
          currentTier={currentTier}
          requiredTier={requiredTier}
          audienceRole={audienceRole}
        />
      </>
    );
  }

  return (
    <>
      <div className="relative rounded-xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-5 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <FiLock size={20} className="text-slate-400" />
        </div>
        <h3 className="font-heading text-sm font-bold text-slate-800">
          {featureLabel || 'Premium Feature'}
        </h3>
        <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">
          This feature requires a <span className="font-semibold text-slate-700">{getPlanTierName(requiredTier)}</span> plan.
          Upgrade to unlock full access.
        </p>
        <button
          type="button"
          onClick={handleUpgradeClick}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <FiLock size={12} />
          Upgrade Plan
        </button>
      </div>
      <UpgradePlanModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureKey={feature}
        featureLabel={featureLabel || feature}
        currentTier={currentTier}
        requiredTier={requiredTier}
        audienceRole={audienceRole}
      />
    </>
  );
};

export default FeatureGate;
