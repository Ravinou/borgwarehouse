import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/account/sendTestEmail';
import { getServerSession } from 'next-auth/next';

jest.mock('next-auth', () => {
  return jest.fn(() => {
    return {
      auth: { session: {} },
      GET: jest.fn(),
      POST: jest.fn(),
    };
  });
});

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('~/helpers/functions/nodemailerSMTP', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'fake-message-id' }),
  })),
}));

describe('Email API', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 401 if not authenticated', async () => {
    // Mock unauthenticated session
    (getServerSession as jest.Mock).mockResolvedValue(null);

    // Simulate a POST request
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);

    // Expect 401 unauthorized
    expect(res._getStatusCode()).toBe(401);
  });

  it('should send an email if authenticated', async () => {
    // Mock unauthenticated session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'ada-lovelace@example.com', name: 'Lovelace' },
    });

    // Simulate a POST request
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);

    // Expect 200 and a success message
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Mail successfully sent' });
  });
});
