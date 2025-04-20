import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/v1/notif/email/test';
import { getServerSession } from 'next-auth/next';

vi.mock('next-auth/next');
vi.mock('~/services', () => ({
  NotifService: {
    nodemailerSMTP: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'fake-message-id' }),
    })),
  },
}));

describe('Email API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 401 if not authenticated', async () => {
    // Mock unauthenticated session
    vi.mocked(getServerSession).mockResolvedValue(null);

    // Simulate a POST request
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);

    // Expect 401 unauthorized
    expect(res._getStatusCode()).toBe(401);
  });

  it('should send an email if authenticated', async () => {
    // Mock unauthenticated session
    vi.mocked(getServerSession).mockResolvedValue({
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
