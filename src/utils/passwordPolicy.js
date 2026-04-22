export const PASSWORD_POLICY_HELPER =
  'Minimum 8 characters with at least 1 letter, 1 number, and 1 special symbol.';

export const PASSWORD_POLICY_ERROR =
  'Password must be at least 8 characters and include a letter, a number, and a special symbol.';

export const isStrongPassword = (value) => {
  const password = String(value || '');

  return (
    password.length >= 8
    && /[A-Za-z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password)
  );
};

export const getPasswordPolicyError = (value, requiredMessage = 'Password is required.') => {
  if (!String(value || '')) return requiredMessage;
  if (!isStrongPassword(value)) return PASSWORD_POLICY_ERROR;
  return '';
};
