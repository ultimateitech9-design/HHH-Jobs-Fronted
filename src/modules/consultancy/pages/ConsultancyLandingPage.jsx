import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  Check,
  ClipboardCheck,
  FileCheck2,
  IndianRupee,
  LoaderCircle,
  Mail,
  MapPin,
  Quote,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound
} from 'lucide-react';
import useAuthStore from '../../../core/auth/authStore';
import { submitConsultancyEnquiry } from '../services/consultancyApi';
import './consultancy.css';

const serviceOptions = [
  { value: 'permanent_hiring', label: 'Permanent hiring', description: 'Role ownership from brief to joining.', icon: BriefcaseBusiness },
  { value: 'bulk_hiring', label: 'Bulk hiring', description: 'High-volume sourcing with one operating view.', icon: UsersRound },
  { value: 'campus_hiring', label: 'Campus hiring', description: 'College discovery, drives, and placement flow.', icon: Building2 },
  { value: 'executive_search', label: 'Executive search', description: 'Focused leadership and specialist mandates.', icon: Target },
  { value: 'contract_staffing', label: 'Contract staffing', description: 'Flexible workforce requirements and tracking.', icon: CalendarCheck2 },
  { value: 'recruitment_process', label: 'Recruitment process', description: 'Structured sourcing, screening, and MIS support.', icon: ClipboardCheck }
];

const storyChapters = [
  {
    number: '01',
    eyebrow: 'Discovery',
    title: 'We turn a vacancy into a hiring brief.',
    description: 'Your team shares the business context, location, team shape, must-have evidence, budget, and joining window. The mandate becomes measurable before sourcing begins.',
    signal: 'Requirement clarity',
    icon: SearchCheck
  },
  {
    number: '02',
    eyebrow: 'Search',
    title: 'Candidates arrive with context, not just keywords.',
    description: 'Profiles are reviewed for role fit, projects, tools, experience depth, location feasibility, communication, and intent before they enter your shortlist.',
    signal: 'Evidence-led shortlist',
    icon: Target
  },
  {
    number: '03',
    eyebrow: 'Selection',
    title: 'Every interview moves the same shared pipeline.',
    description: 'Submitted, shortlisted, interviewed, offered, and hired counts stay visible in the company MIS, alongside notes, meetings, and the next committed action.',
    signal: 'Live fulfillment MIS',
    icon: BarChart3
  },
  {
    number: '04',
    eyebrow: 'Partnership',
    title: 'Commercials and onboarding stay attached to the work.',
    description: 'Quotations, service scope, invoices, status updates, and onboarding milestones live with the mandate so both teams know what has happened and what comes next.',
    signal: 'One accountable record',
    icon: FileCheck2
  }
];

const operatingSignals = [
  { value: 'One', label: 'case timeline', icon: ClipboardCheck },
  { value: 'Live', label: 'requirement MIS', icon: BarChart3 },
  { value: 'Email', label: 'quotation delivery', icon: Mail },
  { value: 'Clear', label: 'billing trail', icon: IndianRupee }
];

const initialForm = {
  companyName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  companySize: '',
  serviceTypes: [],
  faxNumber: ''
};

const ConsultancyLandingPage = () => {
  const user = useAuthStore((state) => state.user);
  const enquiryRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      contactName: current.contactName || user.name || '',
      contactEmail: current.contactEmail || user.email || '',
      contactPhone: current.contactPhone || user.mobile || user.phone || ''
    }));
  }, [user]);

  const selectedServices = useMemo(() => new Set(form.serviceTypes), [form.serviceTypes]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const toggleService = (service) => {
    setForm((current) => ({
      ...current,
      serviceTypes: current.serviceTypes.includes(service)
        ? current.serviceTypes.filter((item) => item !== service)
        : [...current.serviceTypes, service]
    }));
    setError('');
  };

  const scrollToEnquiry = () => {
    enquiryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.serviceTypes.length === 0) {
      setError('Select at least one recruitment service.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await submitConsultancyEnquiry(form);
      setSuccess(response.consultancyCase || {});
      setForm((current) => ({
        ...initialForm,
        companyName: current.companyName,
        contactName: current.contactName,
        contactEmail: current.contactEmail,
        contactPhone: current.contactPhone,
        companySize: current.companySize
      }));
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit your consultancy request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="consultancy-page">
      <section className="consultancy-hero" data-no-cinematic-reveal>
        <picture className="consultancy-hero__media" aria-hidden="true">
          <source media="(max-width: 680px)" srcSet="/career-compass-hero-640.webp" />
          <img
            src="/career-compass-hero-1024.webp"
            alt=""
            width="1024"
            height="683"
            fetchPriority="high"
          />
        </picture>
        <div className="consultancy-hero__veil" aria-hidden="true" />
        <div className="vw-shell-wide consultancy-hero__content">
          <div className="consultancy-hero__copy">
            <p className="consultancy-kicker"><span /> HHH Recruitment Consultancy</p>
            <h1>Hiring that moves from requirement to joining.</h1>
            <p className="consultancy-hero__lead">
              A recruitment partner for companies that need accountable sourcing, sharper shortlists, visible fulfillment, and one commercial record from first meeting to onboarding.
            </p>
            <div className="consultancy-hero__trust" aria-label="Consultancy commitments">
              <span><BadgeCheck /> Requirement-led search</span>
              <span><ShieldCheck /> Verified workflow</span>
              <span><BarChart3 /> Company MIS</span>
            </div>
            <div className="consultancy-hero__actions">
              <button type="button" className="consultancy-button consultancy-button--gold" onClick={scrollToEnquiry}>
                Request a quotation <ArrowRight />
              </button>
              <Link to={user ? '/portal/hr/consultancy' : '/login/hr'} className="consultancy-button consultancy-button--glass">
                Open company MIS <BarChart3 />
              </Link>
            </div>
          </div>

          <div className="consultancy-hero__ledger" aria-label="Consultancy workflow">
            <p>Mandate control</p>
            <ol>
              <li><span>01</span> Brief</li>
              <li><span>02</span> Source</li>
              <li><span>03</span> Select</li>
              <li><span>04</span> Join</li>
            </ol>
          </div>
        </div>
        <button type="button" className="consultancy-hero__scroll" onClick={scrollToEnquiry} aria-label="Go to consultancy enquiry">
          <ArrowDown />
        </button>
      </section>

      <section className="consultancy-signal-band" aria-label="Consultancy operating model">
        <div className="vw-shell-wide consultancy-signal-band__grid">
          {operatingSignals.map((signal) => (
            <div key={signal.label} className="consultancy-signal">
              <signal.icon />
              <div><strong>{signal.value}</strong><span>{signal.label}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="consultancy-story" data-cinematic-reveal>
        <div className="vw-shell-wide consultancy-story__layout">
          <header className="consultancy-story__intro">
            <p className="consultancy-kicker consultancy-kicker--dark"><span /> The hiring story</p>
            <h2>One mandate. Four accountable chapters.</h2>
            <p>
              Consultancy works when decisions remain visible. Each chapter below creates the input for the next one, without losing commercial or candidate context.
            </p>
            <div className="consultancy-story__rail" aria-hidden="true"><span /></div>
          </header>

          <div className="consultancy-story__chapters">
            {storyChapters.map((chapter) => (
              <article key={chapter.number} className="consultancy-chapter">
                <div className="consultancy-chapter__number">{chapter.number}</div>
                <div className="consultancy-chapter__body">
                  <div className="consultancy-chapter__eyebrow"><chapter.icon /> {chapter.eyebrow}</div>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.description}</p>
                  <span className="consultancy-chapter__signal"><Check /> {chapter.signal}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="consultancy-services" data-cinematic-reveal>
        <div className="vw-shell-wide">
          <header className="consultancy-section-heading">
            <div>
              <p className="consultancy-kicker consultancy-kicker--dark"><span /> Engagements</p>
              <h2>Support shaped around the hiring problem.</h2>
            </div>
            <p>Choose one mandate or combine services. The quotation keeps scope, output, and commercials explicit.</p>
          </header>
          <div className="consultancy-services__grid">
            {serviceOptions.map((service, index) => (
              <article key={service.value} className="consultancy-service-card">
                <span className="consultancy-service-card__index">0{index + 1}</span>
                <service.icon />
                <h3>{service.label}</h3>
                <p>{service.description}</p>
                <button type="button" onClick={() => {
                  if (!selectedServices.has(service.value)) toggleService(service.value);
                  scrollToEnquiry();
                }} aria-label={`Select ${service.label}`}>
                  Select service <ArrowRight />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section ref={enquiryRef} className="consultancy-enquiry" data-cinematic-reveal>
        <div className="vw-shell-wide consultancy-enquiry__layout">
          <div className="consultancy-enquiry__brief">
            <p className="consultancy-kicker"><span /> Start the conversation</p>
            <h2>Tell us what your next team needs to become.</h2>
            <p>
              Share only your company and contact basics now. Roles, locations, budget, timeline, and interview details are collected during onboarding.
            </p>
            <ul>
              <li><Check /> Detailed requirement captured during onboarding</li>
              <li><Check /> Meeting and status tracking</li>
              <li><Check /> Quotation delivered by email</li>
              <li><Check /> Requirements, invoices, and progress in MIS</li>
            </ul>
            <div className="consultancy-enquiry__contact">
              <Mail />
              <div><span>Consultancy desk</span><a href="mailto:support@hhh-jobs.com">support@hhh-jobs.com</a></div>
            </div>
          </div>

          <div className="consultancy-enquiry__form-shell">
            {success ? (
              <div className="consultancy-success" role="status">
                <span className="consultancy-success__icon"><FileCheck2 /></span>
                <p className="consultancy-kicker consultancy-kicker--dark"><span /> Request recorded</p>
                <h2>Your hiring conversation now has a reference.</h2>
                <p>Use this number whenever you speak with the consultancy team.</p>
                <strong>{success.reference_code || 'Request received'}</strong>
                <div className="consultancy-success__actions">
                  <Link to={user ? '/portal/hr/consultancy' : '/login/hr'} className="consultancy-button consultancy-button--navy">
                    Open company MIS <ArrowRight />
                  </Link>
                  <button type="button" className="consultancy-button consultancy-button--light" onClick={() => setSuccess(null)}>
                    Add another request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="consultancy-form">
                <div className="consultancy-form__heading">
                  <div><Quote /><span>Quotation request</span></div>
                  <p>Only the essentials. Detailed brief comes later.</p>
                </div>

                <div className="consultancy-form__grid">
                  <label>
                    Name *
                    <input value={form.contactName} onChange={updateField('contactName')} maxLength={255} autoComplete="name" required placeholder="Full name" />
                  </label>
                  <label>
                    Company name *
                    <input value={form.companyName} onChange={updateField('companyName')} maxLength={255} autoComplete="organization" required placeholder="Company or organisation" />
                  </label>
                  <label>
                    Phone *
                    <input type="tel" value={form.contactPhone} onChange={updateField('contactPhone')} maxLength={64} autoComplete="tel" inputMode="tel" required placeholder="+91" />
                  </label>
                  <label>
                    Email *
                    <input type="email" value={form.contactEmail} onChange={updateField('contactEmail')} maxLength={255} autoComplete="email" required placeholder="name@company.com" />
                  </label>
                  <label className="consultancy-form__wide">
                    Company size *
                    <select value={form.companySize} onChange={updateField('companySize')} required>
                      <option value="">Select size</option>
                      <option value="1-20">1-20</option>
                      <option value="21-100">21-100</option>
                      <option value="101-500">101-500</option>
                      <option value="501-2000">501-2,000</option>
                      <option value="2000+">2,000+</option>
                    </select>
                  </label>
                </div>

                <fieldset className="consultancy-form__services" aria-required="true">
                  <legend>Recruitment service *</legend>
                  <div>
                    {serviceOptions.map((service) => (
                      <label key={service.value} className={selectedServices.has(service.value) ? 'is-selected' : ''}>
                        <input
                          type="checkbox"
                          checked={selectedServices.has(service.value)}
                          onChange={() => toggleService(service.value)}
                        />
                        <service.icon />
                        <span>{service.label}</span>
                        <Check className="consultancy-form__check" />
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="consultancy-form__trap" aria-hidden="true">
                  Fax number
                  <input tabIndex="-1" autoComplete="off" value={form.faxNumber} onChange={updateField('faxNumber')} />
                </label>

                {error ? <p className="consultancy-form__error" role="alert">{error}</p> : null}
                <button type="submit" className="consultancy-button consultancy-button--gold consultancy-form__submit" disabled={submitting}>
                  {submitting ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                  {submitting ? 'Creating your case...' : 'Request consultation'}
                  {!submitting ? <ArrowRight /> : null}
                </button>
                <p className="consultancy-form__consent">
                  By submitting, you allow HHH Jobs to contact you about this requirement. No candidate payment is requested through this form.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="consultancy-closing" data-cinematic-reveal>
        <div className="vw-shell-wide consultancy-closing__inner">
          <MapPin />
          <div>
            <p className="consultancy-kicker"><span /> India hiring network</p>
            <h2>A local requirement can still use a national talent view.</h2>
          </div>
          <button type="button" className="consultancy-button consultancy-button--glass" onClick={scrollToEnquiry}>
            Brief our team <ArrowRight />
          </button>
        </div>
      </section>
    </div>
  );
};

export default ConsultancyLandingPage;
