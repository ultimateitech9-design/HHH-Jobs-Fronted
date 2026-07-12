import {
  Building2,
  BriefcaseBusiness,
  Factory,
  Fingerprint,
  MapPin,
  MapPinned,
  Route,
  ScanSearch,
  UserRoundCheck
} from 'lucide-react';

const RAIL_CONFIG = {
  location: {
    label: 'Location path',
    steps: [
      { label: 'State', icon: MapPinned },
      { label: 'District', icon: Route },
      { label: 'City', icon: MapPin },
      { label: 'Pincode', icon: Fingerprint }
    ]
  },
  sectors: {
    label: 'Industry path',
    steps: [
      { label: 'Industry', icon: Factory },
      { label: 'Sector', icon: Building2 },
      { label: 'Open roles', icon: BriefcaseBusiness }
    ]
  },
  categories: {
    label: 'Career path',
    steps: [
      { label: 'Role', icon: BriefcaseBusiness },
      { label: 'Skills', icon: ScanSearch },
      { label: 'Match', icon: UserRoundCheck }
    ]
  }
};

const DirectoryCinematicRail = ({ mode = 'categories' }) => {
  const config = RAIL_CONFIG[mode] || RAIL_CONFIG.categories;

  return (
    <div
      className={`directory-story-rail directory-story-rail--${mode}`}
      role="img"
      aria-label={`${config.label}: ${config.steps.map((step) => step.label).join(' to ')}`}
    >
      <span className="directory-story-rail__label">{config.label}</span>
      <span className="directory-story-rail__track" aria-hidden="true">
        <span className="directory-story-rail__signal" />
      </span>
      <span className="directory-story-rail__steps" aria-hidden="true">
        {config.steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <span className="directory-story-rail__step" key={step.label}>
              <span className="directory-story-rail__icon">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span>{step.label}</span>
              {index < config.steps.length - 1 ? <span className="directory-story-rail__separator">/</span> : null}
            </span>
          );
        })}
      </span>
    </div>
  );
};

export default DirectoryCinematicRail;
