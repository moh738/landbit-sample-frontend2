import * as Yup from 'yup';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useEffect } from 'react';
import { useFormikContext } from 'formik';

export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])[A-Za-z\d!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]{8,25}$/;

export const emailField = Yup.string()
  .required('Email is required')
  .transform((value) => (value ? value.trim() : ''))
  .matches(
    /^(?!.*\.\.)[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/,
    'Please enter a valid email address'
  )
  .max(100, 'Email must be at most 100 characters')
  .test(
    'not-support-email',
    'This email is not allowed',
    (value) => value?.toLowerCase() !== 'support@landbitt.com'
  );

export const phoneField = (countryCode: string) =>
  Yup.string()
    .required('Phone Number is required')
    .test('is-valid-phone', 'Invalid Phone Number', function (value) {
      if (!value) return true;
      try {
        const phoneNumber = parsePhoneNumberFromString(value);
        if (!phoneNumber || !phoneNumber?.nationalNumber) {
          return this?.createError({ message: 'Phone Number is required' });
        }
        if (
          !phoneNumber?.isValid() ||
          phoneNumber?.country !== countryCode?.toUpperCase()
        ) {
          return this?.createError({
            message: 'Please enter a valid phone number.',
          });
        }

        return true;
      } catch (err) {
        return this?.createError({ message: 'Please enter a valid phone number.' });
      }
    });

export const passwordField = Yup.string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(25, 'Password must be 25 characters or less')
  .matches(
    passwordRegex,
    'Use 8–25 characters with at least one upper, one lower, one number and one special; no spaces.'
  );

export const nameField = Yup.string()
  .required('Full Name is required')
  .trim()
  .matches(
    /^[A-Za-z]{2,}(?: [A-Za-z]+)*$/,
    'Enter your full name (2–100 letters) with single spaces only.'
  )
  .max(100, 'Must be 100 characters or less');

export const termsField = Yup.boolean().oneOf(
  [true],
  'Please accept the terms and conditions'
);

export const ScrollToError = () => {
  const { submitCount, isValid, errors } = useFormikContext<any>();

  useEffect(() => {
    if (submitCount === 0 || isValid) return;
    const fieldElements = document.querySelectorAll<HTMLElement>(
      'input[name], select[name], textarea[name]'
    );

    for (let i = 0; i < fieldElements.length; i++) {
      const name = fieldElements[i].getAttribute('name') || '';
      if (errors[name]) {
        fieldElements[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
        fieldElements[i].focus();
        break;
      }
    }
    // Only run when submitCount changes (on submit), not when errors change, so typing in State/City doesn't steal focus
  // eslint-disable-next-line react-hooks/exhaustive-deps -- omit errors/isValid so we don't re-run on every keystroke
  }, [submitCount]);

  return null;
};
