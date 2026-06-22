import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/v1/notif/email/test';
import { getSession } from '~/helpers/getServerSession';
import { ConfigService, NotifService } from '~/services';

vi.mock('~/helpers/getServerSession');
vi.mock('~/services');

describe('Email API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // ~/services is auto-mocked, so nodemailerSMTP() returns undefined by default.
    // Provide a transporter whose sendMail resolves successfully.
    vi.mocked(NotifService.nodemailerSMTP).mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'fake-message-id' }),
    } as unknown as ReturnType<typeof NotifService.nodemailerSMTP>);
  });

  it('should return 401 if not authenticated', async () => {
    // Mock unauthenticated session
    vi.mocked(getSession).mockResolvedValue(null);

    // Simulate a POST request
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);

    // Expect 401 unauthorized
    expect(res._getStatusCode()).toBe(401);
  });

  it('should send an email if authenticated', async () => {
    // Mock authenticated session (id is the authoritative key used to resolve the user)
    vi.mocked(getSession).mockResolvedValue({
      user: { id: '1', email: 'ada-lovelace@example.com', name: 'Lovelace' },
    });

    // The handler resolves the real BorgWarehouse user from the config users list,
    // then sends the test email to user.email using user.username.
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      {
        id: 1,
        username: 'ada',
        email: 'ada-lovelace@example.com',
        password: 'xxx',
        roles: ['user'],
      },
    ]);

    // Simulate a POST request
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);

    // Expect 200 and a success message
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Mail successfully sent' });
  });
});
