const COMPANY_OVERVIEW_CONTENT = {
  'eimager': {
    title: 'About Eimager',
    description:
      'Eimager is a background verification platform focused on faster, technology-driven employee screening and workforce trust. Its website highlights secure verification workflows, compliance-ready processes, smart dashboards, and a mission to make hiring more transparent for employers and professionals.'
  },
  'ultimate-itech': {
    title: 'About Ultimate ITech',
    description:
      'Ultimate ITech delivers end-to-end IT services spanning cybersecurity, cloud solutions, software development, digital transformation, infrastructure support, and managed services. The company presents itself as a long-term technology partner helping businesses modernize operations, strengthen security, and scale with tailored solutions.'
  },
  'indian-trade-mart': {
    title: 'About Indian Trade Mart',
    description:
      'Indian Trade Mart is a B2B marketplace built to connect buyers with verified manufacturers, suppliers, exporters, and service providers across India. Its website focuses on supplier discovery, product sourcing, and business growth through searchable categories, city-based listings, and enquiry-driven trade workflows.'
  },
  'sristech-designers': {
    title: 'About Sristech Designers',
    description:
      'Sristech Designers & Consultants is an architecture and design consultancy working across architectural planning, interiors, landscape, structural design, MEP, cost consultancy, and project management. Its website describes a design-led approach focused on creating functional, visually strong spaces for residential, commercial, and industrial projects.'
  },
  'startup-n-business': {
    title: 'About Startup N Business',
    description:
      'Startup N Business positions itself as a single-window business support platform for founders, startups, and growing companies. Its website covers company registration, compliance, mentoring, investment support, digital services, and operational advisory for businesses building or expanding across India.'
  },
  'pdss-lab': {
    title: 'About PDSS Lab',
    description:
      'PDSS Lab, or PDCE Sristech Testing & Research Laboratory, provides engineering and consultancy services for infrastructure and industrial projects. The website emphasizes geotechnical investigation, digital land survey, testing, transport planning, and technical reporting delivered with precision and project-focused expertise.'
  },
  'pdce-group': {
    title: 'About PDCE Group',
    description:
      'PDCE Group presents itself as a single-window engineering consultancy serving infrastructure and development projects. Its public materials highlight project management consultancy, quantity surveying, structural design, MEP services, DPR preparation, surveys, geotechnical work, testing, and broader engineering support across India.'
  },
  'bsh-infra': {
    title: 'About BSH Infra',
    description:
      'BSH Infra is an EPC and construction-focused company providing end-to-end support from design and planning to execution and delivery. The website highlights civil and structural works, PEB buildings, steel fabrication, interiors, facade, landscaping, and MEP services for residential, commercial, industrial, and public-sector projects.'
  },
  'sristech-movies': {
    title: 'About Sristech Movies',
    description:
      'Sristech Movies is an entertainment and media house specializing in music, films, audiovisual production, post-production, digital effects, and multimedia content. The website positions the company as a creative production studio working across songs, movies, short films, documentaries, and digital visual storytelling.'
  },
  'bsh-realty': {
    title: 'About BSH Realty',
    description:
      'BSH Realty focuses on real-estate and property-related business opportunities. On this profile, the company is presented around a property-led business identity, with hiring categories and positioning aligned to real estate, advisory, and market-facing services.'
  },
  'bsh-reality': {
    title: 'About BSH Realty',
    description:
      'BSH Realty focuses on real-estate and property-related business opportunities. On this profile, the company is presented around a property-led business identity, with hiring categories and positioning aligned to real estate, advisory, and market-facing services.'
  }
};

const toText = (value) => String(value || '').trim();

export const getCompanyOverviewContent = (company) => {
  const slug = toText(company?.slug).toLowerCase();
  const name = toText(company?.name) || 'This company';
  const override = COMPANY_OVERVIEW_CONTENT[slug];

  if (override) return override;

  const fallbackDescription =
    toText(company?.description) ||
    `${name} is featured on HHH Jobs with a dedicated company hiring lounge and curated employer profile.`;

  return {
    title: `About ${name}`,
    description: fallbackDescription
  };
};

export default COMPANY_OVERVIEW_CONTENT;
