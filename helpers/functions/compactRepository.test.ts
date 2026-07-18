import { toast } from 'react-toastify';
import { compactRepository } from '~/helpers/functions/compactRepository';

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('compactRepository', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should POST to the compact endpoint of the given repository', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await compactRepository('abcd1234');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/repositories/abcd1234/compact',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should show a success toast when the response is ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));

    await compactRepository('abcd1234');

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('abcd1234'),
      expect.anything()
    );
  });

  it('should show a warning toast when a compaction is already running (409)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 409 }));

    await compactRepository('abcd1234');

    expect(toast.warning).toHaveBeenCalledWith(
      'A compaction is already running for this repository.',
      expect.anything()
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('should show a warning toast when compaction is disabled (403)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    await compactRepository('abcd1234');

    expect(toast.warning).toHaveBeenCalledWith(
      'Compaction is disabled on this server.',
      expect.anything()
    );
  });

  it('should show an error toast with the server message on other error statuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: { stderr: 'borg exploded' } }),
      })
    );

    await compactRepository('abcd1234');

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('borg exploded'),
      expect.anything()
    );
  });

  it('should show an info toast when the request is aborted (long compaction)', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    await compactRepository('abcd1234');

    expect(toast.info).toHaveBeenCalledWith(
      expect.stringContaining('continues in the background'),
      expect.anything()
    );
  });

  it('should show a generic error toast on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));

    await compactRepository('abcd1234');

    expect(toast.error).toHaveBeenCalledWith('An error has occurred', expect.anything());
  });
});
