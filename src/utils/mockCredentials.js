/**
 * Mock Credentials for Testing Different User Roles
 * These are test credentials for development and demonstration purposes
 */

const MOCK_CREDENTIALS = [
  {
    email: "viewer@demo.com",
    password: "demo123",
    role: "viewer",
    name: "Demo Viewer",
    status: "active",
  },
  {
    email: "buyer@demo.com",
    password: "demo123",
    role: "buyer",
    name: "Demo Buyer",
    status: "active",
  },
  {
    email: "seller@demo.com",
    password: "demo123",
    role: "seller",
    name: "Demo Seller",
    status: "active",
  },
  {
    email: "editor@demo.com",
    password: "demo123",
    role: "editor",
    name: "Demo Editor",
    status: "active",
  },
  {
    email: "admin@demo.com",
    password: "demo123",
    role: "admin",
    name: "Demo Admin",
    status: "active",
  },
];

/**
 * Check if provided credentials match any mock credentials
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object|null} User data if credentials match, null otherwise
 */
export const validateMockCredentials = (email, password) => {
  const normalized = {
    email: email.trim().toLowerCase(),
    password: password,
  };

  const matchedUser = MOCK_CREDENTIALS.find(
    (cred) =>
      cred.email === normalized.email && cred.password === normalized.password,
  );

  if (matchedUser) {
    // Return a copy without the password
    const { password: _, ...userWithoutPassword } = matchedUser;
    return userWithoutPassword;
  }

  return null;
};

/**
 * Get all available mock credentials (for display purposes)
 * @returns {array} Array of available mock credentials with their roles
 */
export const getMockCredentialsList = () => {
  return MOCK_CREDENTIALS.map(({ email, password, role, name }) => ({
    email,
    password,
    role,
    name,
  }));
};
