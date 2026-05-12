export const PASSWORD_POLICY_HELPER =
  'Minimum 8 characters with uppercase, lowercase, number, and special symbol.';

export const PASSWORD_POLICY_ERROR =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol.';

export const isStrongPassword = (value) => {
  const password = String(value || '');

  return (
    password.length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password)
  );
};

export const getPasswordPolicyError = (value, requiredMessage = 'Password is required.') => {
  if (!String(value || '')) return requiredMessage;
  if (!isStrongPassword(value)) return PASSWORD_POLICY_ERROR;
  return '';
};
