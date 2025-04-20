export const ShellService = {
  deleteRepo: vi.fn(),
  updateRepo: vi.fn(),
  createRepo: vi.fn(),
  getLastSaveList: vi.fn(),
  getStorageUsed: vi.fn(),
};

export const ConfigService = {
  getUsersList: vi.fn(),
  getRepoList: vi.fn(),
  updateUsersList: vi.fn(),
  updateRepoList: vi.fn(),
};

export const AuthService = {
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
  tokenController: vi.fn(),
};

export const NotifService = {
  nodemailerSMTP: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'fake-message-id' }),
  })),
};
