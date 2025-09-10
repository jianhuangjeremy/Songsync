// Mock Apple Authentication for web compatibility
export const appleAuth = {
  Operation: {
    LOGIN: 'login'
  },
  Scope: {
    EMAIL: 'email',
    FULL_NAME: 'fullName'
  },
  State: {
    AUTHORIZED: 'authorized'
  },
  performRequest: async () => {
    throw new Error('Apple Authentication not supported on web');
  },
  getCredentialStateForUser: async () => {
    throw new Error('Apple Authentication not supported on web');
  }
};

export default { appleAuth };
