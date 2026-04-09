import { useMemo, useState } from 'react';
import {
  FiMessageSquare,
  FiSearch,
  FiShield,
  FiStar,
  FiThumbsUp
} from 'react-icons/fi';
import {
  StudentEmptyState,
  StudentNotice,
  StudentPageShell,
  StudentSurfaceCard,
  studentFieldClassName,
  studentPrimaryButtonClassName,
  studentSecondaryButtonClassName,
  studentTextareaClassName
} from '../components/StudentExperience';
import {
  addCompanyReview,
  formatDateTime,
  getCompanyReviews
} from '../services/studentApi';

const initialReviewForm = {
  companyName: '',
  rating: 5,
  title: '',
  review: '',
  jobId: ''
};

const StarRatingInput = ({ value, onChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-xl transition ${
            star <= value
              ? 'border-amber-300 bg-amber-50 text-amber-500'
              : 'border-slate-200 bg-white text-slate-300 hover:border-amber-200 hover:text-amber-400'
          }`}
        >
          <FiStar className={star <= value ? 'fill-current' : ''} />
        </button>
      ))}
      <span className="text-sm font-semibold text-slate-500">{value}/5 overall rating</span>
    </div>
  );
};

const renderStars = (rating = 0) => {
  return (
    <div className="flex items-center gap-1 text-amber-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar key={star} className={star <= Math.round(Number(rating) || 0) ? 'fill-current' : 'text-slate-300'} />
      ))}
    </div>
  );
};

const StudentCompanyReviewsPage = () => {
  const [companyName, setCompanyName] = useState('');
  const [activeCompany, setActiveCompany] = useState('');
  const [reviewState, setReviewState] = useState({ summary: { count: 0, averageRating: 0 }, reviews: [] });
  const [form, setForm] = useState(initialReviewForm);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const searchReviews = async () => {
    const query = companyName.trim();
    setNotice({ type: '', text: '' });

    if (!query) {
      setNotice({ type: 'error', text: 'Enter a company name to search reviews.' });
      return;
    }

    setLoading(true);
    const response = await getCompanyReviews(query);
    setLoading(false);

    setActiveCompany(query);
    setReviewState({
      summary: response?.data?.summary || { count: 0, averageRating: 0 },
      reviews: response?.data?.reviews || []
    });

    if (response?.error) {
      setNotice({ type: 'error', text: response.error });
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setNotice({ type: '', text: '' });

    if (!form.companyName.trim() || !form.review.trim() || !form.title.trim()) {
      setNotice({ type: 'error', text: 'Company name, review title, and review text are required.' });
      return;
    }

    try {
      const created = await addCompanyReview({
        companyName: form.companyName.trim(),
        rating: Number(form.rating),
        title: form.title.trim(),
        review: form.review.trim(),
        jobId: form.jobId || null
      });

      if (activeCompany && activeCompany.toLowerCase() === form.companyName.trim().toLowerCase()) {
        const nextReviews = [created, ...reviewState.reviews];
        const averageRating = nextReviews.length
          ? Number((nextReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / nextReviews.length).toFixed(1))
          : 0;

        setReviewState({
          summary: { count: nextReviews.length, averageRating },
          reviews: nextReviews
        });
      }

      setForm(initialReviewForm);
      setNotice({ type: 'success', text: 'Review submitted successfully.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Unable to submit review.' });
    }
  };

  const stats = useMemo(() => {
    const totalReviews = Number(reviewState.summary.count || 0);
    const averageRating = Number(reviewState.summary.averageRating || 0).toFixed(1);
    const positiveReviews = reviewState.reviews.filter((item) => Number(item.rating || 0) >= 4).length;

    return [
      {
        label: 'Average Rating',
        value: averageRating,
        helper: activeCompany ? `Current sentiment for ${activeCompany}` : 'Search a company to reveal sentiment'
      },
      {
        label: 'Reviews Found',
        value: String(totalReviews),
        helper: 'Candidate voices captured for the search'
      },
      {
        label: 'Strong Reviews',
        value: String(positiveReviews),
        helper: 'Ratings of 4 stars or higher'
      }
    ];
  }, [activeCompany, reviewState.reviews, reviewState.summary.averageRating, reviewState.summary.count]);

  return (
    <StudentPageShell
      eyebrow="Company Reviews"
      badge="Trust signal"
      title="Research employer reputation before you commit your time"
      subtitle="Search candidate feedback, learn how companies are being experienced, and add your own review to help future applicants make sharper decisions."
      stats={stats}
    >
      {notice.text ? <StudentNotice type={notice.type || 'info'} text={notice.text} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <StudentSurfaceCard
          eyebrow="Write Review"
          title="Share your experience"
          subtitle="Thoughtful reviews build trust for the next student who is deciding where to apply."
        >
          <form onSubmit={submitReview} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">Company Name</span>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
                  placeholder="Enter company name"
                  className={studentFieldClassName}
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">Job ID</span>
                <input
                  type="text"
                  value={form.jobId}
                  onChange={(event) => setForm((current) => ({ ...current, jobId: event.target.value }))}
                  placeholder="Optional related job ID"
                  className={studentFieldClassName}
                />
              </label>
            </div>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">Review Title</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Short summary of your experience"
                className={studentFieldClassName}
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-bold text-slate-700">Overall Rating</span>
              <StarRatingInput
                value={form.rating}
                onChange={(value) => setForm((current) => ({ ...current, rating: value }))}
              />
            </div>

            <label>
              <span className="mb-2 block text-sm font-bold text-slate-700">Full Review</span>
              <textarea
                rows={6}
                value={form.review}
                onChange={(event) => setForm((current) => ({ ...current, review: event.target.value }))}
                placeholder="Describe the interview process, work culture, transparency, or anything that would genuinely help another student."
                className={studentTextareaClassName}
              />
            </label>

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              <button type="submit" className={studentPrimaryButtonClassName}>
                <FiMessageSquare size={15} />
                Submit Review
              </button>
              <button type="button" className={studentSecondaryButtonClassName} onClick={() => setForm(initialReviewForm)}>
                Reset
              </button>
            </div>
          </form>
        </StudentSurfaceCard>

        <div className="space-y-6">
          <StudentSurfaceCard
            eyebrow="Search"
            title="Find company feedback"
            subtitle="Search by company name to open ratings and written experiences from other candidates."
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <label className="flex-1">
                <span className="mb-2 block text-sm font-bold text-slate-700">Company Name</span>
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Search company reviews"
                    className={`${studentFieldClassName} pl-11`}
                  />
                </div>
              </label>
              <button type="button" className={studentPrimaryButtonClassName} onClick={searchReviews}>
                <FiSearch size={15} />
                {loading ? 'Searching...' : 'Search Reviews'}
              </button>
            </div>
          </StudentSurfaceCard>

          <StudentSurfaceCard
            eyebrow="Review Snapshot"
            title={activeCompany ? `${activeCompany} sentiment` : 'Company sentiment overview'}
            subtitle={activeCompany ? 'A quick look at how candidates are rating this employer.' : 'Search a company to view candidate sentiment and detailed feedback.'}
          >
            {loading ? (
              <div className="h-64 animate-pulse rounded-[1.8rem] bg-slate-100" />
            ) : activeCompany ? (
              <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
                <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50/90 p-5 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Average Rating</p>
                  <p className="mt-3 font-heading text-6xl font-black text-navy">
                    {Number(reviewState.summary.averageRating || 0).toFixed(1)}
                  </p>
                  <div className="mt-3 flex justify-center">
                    {renderStars(reviewState.summary.averageRating)}
                  </div>
                  <p className="mt-3 text-sm text-slate-500">Based on {reviewState.summary.count || 0} reviews</p>
                </div>

                {reviewState.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviewState.reviews.map((item) => (
                      <article key={item.id} className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="font-heading text-xl font-bold text-navy">{item.title || 'Candidate review'}</h3>
                            <p className="mt-2 text-sm text-slate-500">
                              {item.companyName || activeCompany}
                              {' • '}
                              {formatDateTime(item.created_at || item.createdAt)}
                            </p>
                            <div className="mt-3">{renderStars(item.rating)}</div>
                          </div>
                          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
                            <FiShield size={12} />
                            Verified Candidate Voice
                          </span>
                        </div>

                        <p className="mt-4 text-sm leading-7 text-slate-600">{item.review}</p>

                        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
                          <FiThumbsUp size={15} />
                          Rating {Number(item.rating || 0).toFixed(1)} / 5
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <StudentEmptyState
                    icon={FiStar}
                    title="No reviews found"
                    description="This company does not have any submitted reviews yet. You can be the first to add one."
                    className="border-none bg-slate-50/80"
                  />
                )}
              </div>
            ) : (
              <StudentEmptyState
                icon={FiSearch}
                title="Search a company to unlock reviews"
                description="Type the employer name above and open ratings, review count, and candidate feedback in one clean view."
                className="border-none bg-slate-50/80"
              />
            )}
          </StudentSurfaceCard>
        </div>
      </div>
    </StudentPageShell>
  );
};

export default StudentCompanyReviewsPage;
