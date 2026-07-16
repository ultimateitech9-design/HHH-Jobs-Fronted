import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  FileCheck2,
  GitMerge,
  GraduationCap,
  Handshake,
  MapPin,
  Search,
  UserRoundSearch
} from 'lucide-react';

const storyChapters = [
  {
    number: '01',
    eyebrow: 'Discover',
    title: 'Start with direction, not a wall of listings.',
    description: 'A student or professional brings role intent, skills, and location into one search. HHH Jobs turns that context into nearby and India-wide opportunity paths.',
    signal: 'Intent + location',
    outcome: 'Relevant private and government jobs',
    action: 'Explore opportunities',
    to: '/jobs',
    icon: Search,
    participants: [MapPin, UserRoundSearch]
  },
  {
    number: '02',
    eyebrow: 'Prove',
    title: 'Let projects and experience tell the fuller story.',
    description: 'Profiles move beyond keyword counting. Projects, tools, responsibilities, work history, and career direction create evidence that a hiring team can actually review.',
    signal: 'Skills + evidence',
    outcome: 'A stronger candidate fit picture',
    action: 'Build career context',
    to: '/job-seekers',
    icon: FileCheck2,
    participants: [GraduationCap, UserRoundSearch]
  },
  {
    number: '03',
    eyebrow: 'Connect',
    title: 'Bring talent, recruiters, and campuses into one flow.',
    description: 'Employers publish real requirements, campuses prepare cohorts, and matching signals help the right profiles reach a focused shortlist with less operational noise.',
    signal: 'Requirement + fit',
    outcome: 'Shortlists built with context',
    action: 'See the hiring network',
    to: '/recruiters',
    icon: GitMerge,
    participants: [Building2, BriefcaseBusiness]
  },
  {
    number: '04',
    eyebrow: 'Move',
    title: 'Carry every promising match toward an outcome.',
    description: 'Applications, interviews, placement coordination, offers, and hiring support stay connected so every participant understands what moved and what comes next.',
    signal: 'Action + follow-through',
    outcome: 'Hiring and placement outcomes',
    action: 'Connect your campus',
    to: '/campus-connect',
    icon: Handshake,
    participants: [GraduationCap, Building2]
  }
];

const formatChapterLabel = (chapter) => `${chapter.number} / ${String(storyChapters.length).padStart(2, '0')}`;

const HomeStoryExperience = () => {
  const chapterRefs = useRef([]);
  const [activeChapter, setActiveChapter] = useState(0);
  const currentChapter = storyChapters[activeChapter];
  const CurrentIcon = currentChapter.icon;

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!visibleEntry) return;
        const index = Number(visibleEntry.target.dataset.storyChapter);
        if (Number.isInteger(index)) setActiveChapter(index);
      },
      {
        rootMargin: '-24% 0px -40%',
        threshold: [0.15, 0.35, 0.6]
      }
    );

    chapterRefs.current.forEach((chapter) => {
      if (chapter) observer.observe(chapter);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="home-story-experience border-b border-slate-200 bg-[#f7f8fb]" data-no-cinematic-reveal>
      <header className="home-story-experience__intro vw-shell-wide grid gap-6 border-b border-slate-200 py-12 md:py-16 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-end">
        <div>
          <p className="text-[11px] font-black uppercase text-[#925a05]">The HHH Jobs story</p>
          <h2 className="mt-3 max-w-xl font-heading text-3xl font-black leading-tight text-[#102f52] md:text-5xl">
            One journey. Every side of hiring connected.
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
          Opportunity becomes useful when people can discover it, prove their fit, connect with the right decision-makers, and keep moving toward a real outcome.
        </p>
      </header>

      <div className="home-story-experience__layout vw-shell-wide grid lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)] lg:gap-14">
        <aside className="home-story-console lg:sticky lg:top-24 lg:self-start" aria-live="polite">
          <div className="home-story-console__frame">
            <div className="home-story-console__header">
              <span>{formatChapterLabel(currentChapter)}</span>
              <span>LIVE JOURNEY</span>
            </div>

            <div className="home-story-console__focus">
              <span className="home-story-console__icon">
                <CurrentIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p>{currentChapter.eyebrow}</p>
                <h3>{currentChapter.signal}</h3>
              </div>
            </div>

            <div className="home-story-console__route" aria-hidden="true">
              {storyChapters.map((chapter, index) => (
                <span
                  key={chapter.number}
                  className={index <= activeChapter ? 'is-complete' : ''}
                >
                  {chapter.number}
                </span>
              ))}
            </div>

            <div className="home-story-console__outcome">
              <span>OUTCOME</span>
              <strong>{currentChapter.outcome}</strong>
            </div>
          </div>
        </aside>

        <div className="home-story-chapters">
          {storyChapters.map((chapter, index) => {
            const Icon = chapter.icon;
            return (
              <article
                key={chapter.number}
                ref={(node) => {
                  chapterRefs.current[index] = node;
                }}
                data-story-chapter={index}
                className={`home-story-chapter ${index === activeChapter ? 'is-active' : ''}`}
              >
                <div className="home-story-chapter__heading">
                  <span className="home-story-chapter__number">{chapter.number}</span>
                  <span className="home-story-chapter__icon">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>

                <p className="home-story-chapter__eyebrow">{chapter.eyebrow}</p>
                <h3 className="font-heading">{chapter.title}</h3>
                <p className="home-story-chapter__description">{chapter.description}</p>

                <div className="home-story-chapter__signal">
                  <div className="home-story-chapter__participants" aria-hidden="true">
                    {chapter.participants.map((ParticipantIcon, participantIndex) => (
                      <span key={`${chapter.number}-${participantIndex}`}>
                        <ParticipantIcon className="h-4 w-4" />
                      </span>
                    ))}
                  </div>
                  <span className="home-story-chapter__signal-line" aria-hidden="true" />
                  <strong>{chapter.outcome}</strong>
                </div>

                <Link to={chapter.to} className="home-story-chapter__link">
                  {chapter.action}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeStoryExperience;
