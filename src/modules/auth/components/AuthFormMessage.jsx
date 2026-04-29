const toneClassMap = {
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-brand-100 bg-brand-50 text-brand-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

const AuthFormMessage = ({ children, tone = 'error' }) => {
  if (!children) return null;

  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-[1.1rem] border px-4 py-2.5 text-sm font-medium ${toneClassMap[tone]}`}>
      {children}
    </div>
  );
};

export default AuthFormMessage;
