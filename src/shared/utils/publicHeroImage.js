export const CAREER_HERO_MOBILE_SRC = '/career-compass-hero-640.webp?v=20260713';
export const CAREER_HERO_DESKTOP_SRC = '/career-compass-hero-1024.webp?v=20260713';
export const CAREER_HERO_SRC_SET = `${CAREER_HERO_MOBILE_SRC} 640w, ${CAREER_HERO_DESKTOP_SRC} 1024w`;
export const CAREER_HERO_SIZES = '(max-width: 767px) 240px, 100vw';

export const getCareerHeroSrc = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return CAREER_HERO_DESKTOP_SRC;
  }

  return window.matchMedia('(max-width: 767px)').matches
    ? CAREER_HERO_MOBILE_SRC
    : CAREER_HERO_DESKTOP_SRC;
};
