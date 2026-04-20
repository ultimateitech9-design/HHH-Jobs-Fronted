import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import AnimatedSection from '../../../../shared/components/AnimatedSection';

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Software Engineer at Google',
    text: 'The cleaner dashboard and role discovery flow made it much easier to focus on real opportunities.',
    avatar: 'PS'
  },
  {
    name: 'James Wilson',
    role: 'HR Director at TechFlow',
    text: 'This is the kind of recruiter dashboard structure that actually helps teams move faster.',
    avatar: 'JW'
  },
  {
    name: 'Anita Desai',
    role: 'Fresh Graduate',
    text: 'I could finally understand where I was in the application process without digging through clutter.',
    avatar: 'AD'
  },
  {
    name: 'Raj Kapoor',
    role: 'Retired Army Veteran',
    text: 'The platform now feels much more trustworthy and easier to navigate for experienced professionals.',
    avatar: 'RK'
  }
];

export function TestimonialsSection() {
  const sliderRef = useRef(null);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const visibleTestimonials = useMemo(() => [...testimonials, ...testimonials], []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return undefined;

    const normalizeLoopPosition = () => {
      const card = slider.querySelector('[data-testimonial-slide]');
      if (!card) return;

      const sliderStyle = window.getComputedStyle(slider);
      const gap = Number.parseFloat(sliderStyle.columnGap || sliderStyle.gap || '0') || 0;
      const stride = card.getBoundingClientRect().width + gap;
      const loopThreshold = stride * testimonials.length;

      if (slider.scrollLeft >= loopThreshold) {
        slider.scrollLeft -= loopThreshold;
      }

      if (slider.scrollLeft < 0) {
        slider.scrollLeft += loopThreshold;
      }
    };

    normalizeLoopPosition();
    slider.addEventListener('scroll', normalizeLoopPosition, { passive: true });
    window.addEventListener('resize', normalizeLoopPosition);

    return () => {
      slider.removeEventListener('scroll', normalizeLoopPosition);
      window.removeEventListener('resize', normalizeLoopPosition);
    };
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || isAutoPaused) return undefined;

    const mediaQuery =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    if (mediaQuery?.matches) return undefined;

    let frameId = 0;
    let lastTimestamp = 0;
    const pixelsPerSecond = 58;

    const step = (timestamp) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }

      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      slider.scrollLeft += (elapsed * pixelsPerSecond) / 1000;
      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isAutoPaused]);

  return (
    <section className="bg-secondary-50/50 px-4 py-12 md:py-14">
      <div className="mx-auto w-full max-w-none">
        <AnimatedSection className="mb-8 text-center md:mb-10">
          <h2 className="font-heading text-3xl font-extrabold text-navy md:text-4xl">
            What Our Users <span className="gradient-text">Say</span>
          </h2>
          <p className="mt-3 text-slate-500">Real stories from real users across your platform roles.</p>
        </AnimatedSection>
        <AnimatedSection>
          <div
            className="relative"
            onMouseEnter={() => setIsAutoPaused(true)}
            onMouseLeave={() => setIsAutoPaused(false)}
          >
            <div
              ref={sliderRef}
              className="flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {visibleTestimonials.map((item, index) => (
                <motion.div
                  key={`${item.name}-${index}`}
                  data-testimonial-slide
                  whileHover={{ y: -5, scale: 1.01 }}
                  className="glass-card group relative min-w-0 shrink-0 basis-[92%] overflow-hidden rounded-3xl p-5 sm:basis-[calc((100%-1.5rem)/2)]"
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="absolute -right-2 -top-2 text-brand-100 transition-colors group-hover:text-brand-200"
                  >
                    <Quote className="h-20 w-20" />
                  </motion.div>
                  <div className="relative z-10">
                    <div className="mb-4 flex gap-1">
                      {[0, 1, 2, 3, 4].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="leading-7 text-slate-700">&ldquo;{item.text}&rdquo;</p>
                    <div className="mt-6 flex items-center gap-3 border-t border-slate-200 pt-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary font-heading text-sm font-bold text-white">
                        {item.avatar}
                      </div>
                      <div>
                        <p className="font-heading text-sm font-semibold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.role}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
