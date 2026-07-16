import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Pause,
  Play,
  Search
} from 'lucide-react';

import useAuthStore from '../../../../core/auth/authStore';
import {
  CAREER_HERO_SIZES,
  CAREER_HERO_SRC_SET,
  getCareerHeroSrc
} from '../../../../shared/utils/publicHeroImage';
import { normalizeRole } from '../../../../utils/auth';

const trustBadges = ['Verified jobs', 'Relevant matching', 'Free to apply'];
const quickTags = ['Remote', 'Full-time', 'Internship', 'Part-time', 'Freelance'];
const CINEMATIC_VIDEO_VERSION = '20260716-2';

const formatLiveCount = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const count = Number(value);
  if (!Number.isFinite(count)) return null;
  return new Intl.NumberFormat('en-IN').format(Math.max(0, count));
};

const buildStatItems = (stats = {}) => [
  { label: 'Open roles', value: formatLiveCount(stats.openJobs) },
  { label: 'Companies hiring', value: formatLiveCount(stats.companies) },
  { label: 'Career categories', value: formatLiveCount(stats.roles) }
];

const heroActionClassName =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5';

const shouldAutoplayCinematicVideo = () => {
  if (typeof window === 'undefined') return false;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const constrainedConnection = connection?.saveData
    || ['slow-2g', '2g'].includes(String(connection?.effectiveType || '').toLowerCase());

  return !prefersReducedMotion && !constrainedConnection;
};

export function HeroSection({ filters, onFiltersChange, onSearch, onKeywordChipClick, stats }) {
  const user = useAuthStore((state) => state.user);
  const videoRef = useRef(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const isHrUser = normalizeRole(user?.role) === 'hr';
  const hrJobsPath = '/portal/hr/jobs';
  const postJobPath = isHrUser ? hrJobsPath : '/login/hr';
  const statItems = buildStatItems(stats);

  useEffect(() => {
    if (!shouldAutoplayCinematicVideo()) {
      setVideoPaused(true);
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      setVideoEnabled(true);
      setVideoPaused(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!videoEnabled || videoPaused || !video || video.readyState < 2) return;
    video.play().catch(() => setVideoPaused(true));
  }, [videoEnabled, videoPaused, videoReady]);

  useEffect(() => {
    if (!videoEnabled || videoPaused) return undefined;

    const handleVisibilityChange = () => {
      const video = videoRef.current;
      if (!video) return;
      if (document.hidden) video.pause();
      else video.play().catch(() => undefined);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [videoEnabled, videoPaused]);

  const toggleVideoPlayback = () => {
    const video = videoRef.current;

    if (!videoEnabled || videoError || !video) {
      setVideoError(false);
      setVideoReady(false);
      setVideoPaused(false);
      setVideoEnabled(true);
      window.requestAnimationFrame(() => {
        const nextVideo = videoRef.current;
        if (!nextVideo) return;
        nextVideo.load();
        nextVideo.play().catch(() => setVideoPaused(true));
      });
      return;
    }

    if (video.paused) {
      video.play().catch(() => undefined);
      setVideoPaused(false);
      return;
    }

    video.pause();
    setVideoPaused(true);
  };

  return (
    <section className="home-film-hero public-cinematic-hero relative isolate min-h-[650px] overflow-hidden border-b border-[#d99b20]/35 bg-[#071524] text-white sm:min-h-[620px] lg:min-h-[640px]">
      <div className="home-film-hero__media absolute inset-0" aria-hidden="true">
        <img
          src={getCareerHeroSrc()}
          srcSet={CAREER_HERO_SRC_SET}
          alt=""
          width="1024"
          height="1024"
          decoding="sync"
          loading="eager"
          fetchPriority="high"
          sizes={CAREER_HERO_SIZES}
          className="public-cinematic-image absolute inset-0 h-full w-full object-cover object-center"
        />
        {videoEnabled ? (
          <video
            ref={videoRef}
            className={`home-film-hero__video absolute inset-0 h-full w-full object-cover ${videoReady ? 'is-ready' : ''}`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={getCareerHeroSrc()}
            onCanPlay={() => {
              setVideoReady(true);
              setVideoError(false);
              if (!videoPaused) videoRef.current?.play().catch(() => setVideoPaused(true));
            }}
            onPlay={() => setVideoPaused(false)}
            onPause={() => {
              if (!document.hidden) setVideoPaused(true);
            }}
            onError={() => {
              setVideoReady(false);
              setVideoError(true);
              setVideoPaused(true);
            }}
          >
            <source src={`/media/hhh-home-story.webm?v=${CINEMATIC_VIDEO_VERSION}`} type="video/webm" />
            <source src={`/media/hhh-home-story.mp4?v=${CINEMATIC_VIDEO_VERSION}`} type="video/mp4" />
          </video>
        ) : null}
      </div>
      <div className="home-film-hero__shade absolute inset-0" aria-hidden="true" />
      <div className="home-film-hero__grain absolute inset-0" aria-hidden="true" />

      <div className="home-match-stream" aria-hidden="true">
        <span className="home-match-stream__line home-match-stream__line--primary" />
        <span className="home-match-stream__line home-match-stream__line--secondary" />
        <span className="home-match-stream__packet home-match-stream__packet--profile">PROFILE</span>
        <span className="home-match-stream__packet home-match-stream__packet--skill">SKILL</span>
        <span className="home-match-stream__packet home-match-stream__packet--role">ROLE</span>
        <span className="home-match-stream__packet home-match-stream__packet--match">MATCH</span>
      </div>

      <button
        type="button"
        onClick={toggleVideoPlayback}
        className="home-film-hero__control"
        data-state={videoError ? 'error' : videoReady && !videoPaused ? 'playing' : 'paused'}
        aria-label={videoError ? 'Retry hero film' : videoReady && !videoPaused ? 'Pause hero film' : 'Play hero film'}
        title={videoError ? 'Retry hero film' : videoReady && !videoPaused ? 'Pause hero film' : 'Play hero film'}
      >
        {videoReady && !videoPaused ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
      </button>

      <div className="vw-shell-wide relative z-10 flex min-h-[650px] flex-col justify-end pb-7 pt-8 sm:min-h-[620px] sm:pb-9 lg:min-h-[640px] lg:pb-10">
        <div className="max-w-4xl">
          <div className="home-film-hero__eyebrow inline-flex items-center gap-2 border-l-2 border-brand-400 pl-3 text-[11px] font-black uppercase text-brand-300">
            <span className="home-film-hero__live-dot" aria-hidden="true" />
            HHH Jobs connected hiring network
          </div>

          <h1 className="mt-4 max-w-4xl font-heading text-4xl font-black leading-[1.06] tracking-normal text-white sm:text-5xl lg:text-6xl">
            Ambition meets the right opportunity.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
            From a student&apos;s first project to a company&apos;s next hire, HHH Jobs connects skills, location, trust, and real hiring movement across India.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-200 sm:text-sm">
            {trustBadges.map((badge) => (
              <span key={badge} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-300" />
                {badge}
              </span>
            ))}
          </div>
        </div>

        <form
          onSubmit={onSearch}
          className="mt-6 grid max-w-5xl gap-1.5 rounded-md border border-[#f2c75f]/45 bg-[#fffdf9] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.24)] sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_auto]"
        >
          <label className="flex min-w-0 items-center gap-2 rounded-md px-3 text-slate-700">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="sr-only">Job title or keyword</span>
            <input
              type="search"
              value={filters.keyword}
              onChange={(event) => onFiltersChange({ ...filters, keyword: event.target.value })}
              placeholder="Job title, skill, or company"
              className="h-11 w-full min-w-0 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </label>
          <label className="flex min-w-0 items-center gap-2 border-t border-slate-200 px-3 text-slate-700 sm:border-l sm:border-t-0">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="sr-only">Location</span>
            <input
              type="search"
              value={filters.location}
              onChange={(event) => onFiltersChange({ ...filters, location: event.target.value })}
              placeholder="City, state, or pincode"
              className="h-11 w-full min-w-0 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </label>
          <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#14549a] px-6 text-sm font-black text-white transition hover:bg-[#103f75]">
            <Search className="h-4 w-4" />
            Search jobs
          </button>
        </form>

        <div className="mt-3 hidden flex-wrap gap-2 sm:flex">
          {quickTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onKeywordChipClick(tag)}
              className="rounded-full border border-white/20 bg-[#071524]/55 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-[#f2c75f] hover:text-[#fff1c9]"
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Link to="/jobs" className={`${heroActionClassName} bg-[#d99b20] text-[#151922] hover:bg-[#e8b23c]`}>
            Explore opportunities
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to={postJobPath}
            state={isHrUser ? undefined : { portalLabel: 'Recruiter / HR login', from: hrJobsPath }}
            className={`${heroActionClassName} border border-white/30 bg-[#071524]/45 text-white hover:border-[#f2c75f]/70 hover:bg-[#071524]/70`}
          >
            <Briefcase className="h-4 w-4" />
            Post a job
          </Link>
          <Link
            to="/campus-connect"
            className={`${heroActionClassName} border border-white/30 bg-[#071524]/45 text-white hover:border-[#f2c75f]/70 hover:bg-[#071524]/70`}
          >
            <GraduationCap className="h-4 w-4" />
            Campus connect
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-3 border-y border-white/15 bg-slate-950/20">
          {statItems.map((item, index) => (
            <div
              key={item.label}
              className={`flex min-h-[62px] flex-wrap items-center gap-x-2 gap-y-0.5 py-3 ${
                index > 0 ? 'border-l border-white/15 pl-3 sm:pl-5' : ''
              }`}
            >
              {item.value === null ? (
                <span className="block h-6 w-12 animate-pulse rounded bg-white/20" aria-hidden="true" />
              ) : (
                <p className="text-lg font-black text-white sm:text-2xl">{item.value}</p>
              )}
              <p className="max-w-[8rem] text-[9px] font-black uppercase leading-4 text-white/60 sm:text-[10px]">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
