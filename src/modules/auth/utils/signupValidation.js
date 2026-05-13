import { countryCodeOptions } from '../config/authOptions';
import { getPasswordPolicyError } from '../../../utils/passwordPolicy';

const textOnlyRegex = /^[A-Za-z\s]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthGap = today.getMonth() - dob.getMonth();
  if (monthGap < 0 || (monthGap === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
};

export const getMaxSignupDob = () => {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 16);

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getSelectedCountry = (countryCode) =>
  countryCodeOptions.find((item) => item.code === countryCode) || countryCodeOptions[0];

export const validatePhoneByCountryCode = (countryCode, value, { required = true } = {}) => {
  const selectedCountry = getSelectedCountry(countryCode);
  const mobileValue = String(value || '').trim();

  if (!mobileValue) {
    return required ? 'Mobile number is required.' : '';
  }

  if (!/^\d+$/.test(mobileValue)) {
    return 'Mobile number should contain only digits.';
  }

  if (mobileValue.length !== selectedCountry.digits) {
    return `Mobile number must be exactly ${selectedCountry.digits} digits for ${selectedCountry.label}.`;
  }

  if (selectedCountry.code === '+91' && !/^[6-9]\d{9}$/.test(mobileValue)) {
    return 'Enter a valid India mobile number with 10 digits starting from 6-9.';
  }

  return '';
};

export const validateSignupField = (key, value, nextForm) => {
  switch (key) {
    case 'name':
      if (!String(value || '').trim()) return 'Name is required.';
      if (!textOnlyRegex.test(String(value || '').trim())) return 'Name should contain only letters and spaces.';
      if (String(value || '').trim().length < 2) return 'Name must be at least 2 characters.';
      return '';

    case 'companyName':
      if (nextForm.role === 'hr') {
        if (!String(value || '').trim()) return 'Company name is required.';
        if (!textOnlyRegex.test(String(value || '').trim())) {
          return 'Company name should contain only letters and spaces.';
        }
      }
      return '';

    case 'email':
      if (!String(value || '').trim()) return 'Email is required.';
      if (!emailRegex.test(String(value || '').trim())) return 'Enter a valid email address.';
      return '';

    case 'mobile': {
      return validatePhoneByCountryCode(nextForm.countryCode, value);
    }

    case 'password':
      return getPasswordPolicyError(value);

    case 'dateOfBirth':
      if (nextForm.role !== 'hr') {
        if (!value) return 'Date of birth is required for registration.';
        const age = calculateAge(value);
        if (age === null) return 'Please enter a valid date of birth.';
        if (age < 16) return 'Minimum age for registration is 16 years.';
        if (nextForm.role === 'retired_employee' && age < 60) {
          return 'Minimum age for retired employee registration is 60 years.';
        }
      }
      return '';

    default:
      return '';
  }
};
