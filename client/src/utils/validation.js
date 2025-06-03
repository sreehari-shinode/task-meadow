// Email validation regex
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

// Password validation regex (at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Username validation regex (3-30 chars, alphanumeric + underscore)
const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!passwordRegex.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
  return '';
};

export const validateUsername = (username) => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters long';
  if (username.length > 30) return 'Username cannot exceed 30 characters';
  if (!usernameRegex.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return '';
};

export const isFormValid = (formData) => {
  const emailError = validateEmail(formData.email);
  const passwordError = validatePassword(formData.password);
  const usernameError = validateUsername(formData.username);

  return {
    isValid: !emailError && !passwordError && !usernameError,
    errors: {
      email: emailError,
      password: passwordError,
      username: usernameError
    }
  };
}; 