import { useEffect, useMemo, useRef, useState } from 'react';
import { FiCheckCircle, FiChevronDown, FiSearch } from 'react-icons/fi';
import AnimatedSection from '../../../../shared/components/AnimatedSection';
import {
  footerContactCountryOptions,
  footerContactDefaultCountries,
  getFooterContactPhoneDigits
} from '../../../../shared/constants/countryCodes';

const selectedCountryFallback =
  footerContactCountryOptions.find((country) => country.name === 'India') ?? footerContactCountryOptions[0];

const FooterContactForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(selectedCountryFallback);
  const [phoneNumber, setPhoneNumber] = useState('');
  const countryMenuRef = useRef(null);
  const selectedCountryDigits = getFooterContactPhoneDigits(selectedCountry.code);

  useEffect(() => {
    if (!isCountryMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (countryMenuRef.current && !countryMenuRef.current.contains(event.target)) {
        setIsCountryMenuOpen(false);
        setCountrySearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCountryMenuOpen]);

  const filteredCountryOptions = useMemo(() => {
    const normalizedSearch = countrySearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return footerContactCountryOptions.filter((country) =>
        footerContactDefaultCountries.includes(country.name)
      );
    }

    return footerContactCountryOptions.filter((country) =>
      `${country.name} ${country.code}`.toLowerCase().includes(normalizedSearch)
    );
  }, [countrySearch]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setPhoneNumber((current) => current.slice(0, getFooterContactPhoneDigits(country.code)));
    setIsCountryMenuOpen(false);
    setCountrySearch('');
  };

  return (
    <AnimatedSection delay={0.1}>
      <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-700">Contact Form</p>
        <h2 className="mt-3 font-heading text-[2rem] font-bold leading-tight text-navy">
          Get in touch with the right team
        </h2>

        {isSubmitted ? (
          <div className="mt-6 rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-7 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
              <FiCheckCircle size={30} />
            </div>
            <h3 className="mt-5 font-heading text-2xl font-bold text-emerald-900">Message sent</h3>
            <p className="mt-3 text-sm leading-7 text-emerald-700">
              Thank you for reaching out. Our team will review the request and get back to you.
            </p>
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="mt-6 inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition-all hover:-translate-y-0.5"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setIsSubmitted(true);
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Your Name
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Enter full name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-300 focus:bg-white"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Your Email
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@email.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-300 focus:bg-white"
                />
              </label>
            </div>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Contact Number
              <div className="grid gap-2 sm:grid-cols-[220px_minmax(0,1fr)]">
                <div className="relative" ref={countryMenuRef}>
                  <input type="hidden" name="countryCode" value={selectedCountry.code} />
                  <button
                    type="button"
                    onClick={() => setIsCountryMenuOpen((current) => !current)}
                    className="flex h-[46px] w-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-sm outline-none transition-all hover:bg-white focus:border-brand-300 focus:bg-white"
                  >
                    <span className="truncate">{`${selectedCountry.name} (${selectedCountry.code})`}</span>
                    <FiChevronDown
                      className={`shrink-0 text-slate-500 transition-transform ${isCountryMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isCountryMenuOpen ? (
                    <div className="absolute left-0 top-full z-20 mt-2 w-full min-w-[18rem] max-w-[calc(100vw-4rem)] rounded-[1.25rem] border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60">
                      <div className="relative">
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          value={countrySearch}
                          onChange={(event) => setCountrySearch(event.target.value)}
                          placeholder="Search country or code"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-brand-300 focus:bg-white"
                        />
                      </div>

                      <div className="mt-2 max-h-60 overflow-y-auto">
                        {filteredCountryOptions.length ? (
                          filteredCountryOptions.map((country) => {
                            const isActive =
                              country.name === selectedCountry.name && country.code === selectedCountry.code;

                            return (
                              <button
                                key={`${country.name}-${country.code}`}
                                type="button"
                                onClick={() => handleCountrySelect(country)}
                                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition-all ${
                                  isActive
                                    ? 'bg-brand-50 font-semibold text-brand-700'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span className="truncate pr-3">{country.name}</span>
                                <span className="shrink-0 font-semibold text-slate-500">{country.code}</span>
                              </button>
                            );
                          })
                        ) : (
                          <p className="px-3 py-2 text-sm text-slate-500">No matching country found.</p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <input
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  value={phoneNumber}
                  minLength={selectedCountryDigits}
                  maxLength={selectedCountryDigits}
                  required
                  onChange={(event) => {
                    const onlyDigits = event.target.value.replace(/\D/g, '').slice(0, selectedCountryDigits);
                    setPhoneNumber(onlyDigits);
                  }}
                  placeholder={`Enter ${selectedCountryDigits}-digit number`}
                  className="h-[46px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-300 focus:bg-white"
                />
              </div>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Address
              <input
                type="text"
                name="address"
                placeholder="City, State"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-300 focus:bg-white"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Inquiry Type
              <select
                name="inquiryType"
                defaultValue=""
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-300 focus:bg-white"
              >
                <option value="" disabled>Select inquiry type</option>
                <option value="career">Career Opportunity</option>
                <option value="support">Support</option>
                <option value="business">Business</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Your Message
              <textarea
                name="message"
                rows={4}
                required
                placeholder="Tell us what you need help with..."
                className="w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-brand-300 focus:bg-white"
              />
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full gradient-gold px-6 py-2.5 text-sm font-semibold text-primary shadow-lg shadow-gold/20 transition-all hover:-translate-y-0.5"
            >
              Send Message
            </button>
          </form>
        )}
      </article>
    </AnimatedSection>
  );
};

export default FooterContactForm;
