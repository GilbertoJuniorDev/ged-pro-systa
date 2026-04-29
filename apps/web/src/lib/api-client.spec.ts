import { apiClient, ApiError } from './api-client';

const mockFetch = jest.fn();

describe('apiClient', () => {
  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve with data on successful GET request', async () => {
    const mockData = { id: '1', name: 'Doc' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const result = await apiClient.get<typeof mockData>('/documents/1');

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/documents/1'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('should throw ApiError with statusCode and message on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Unauthorized', statusCode: 401, code: 'UNAUTHORIZED' }),
    } as Response);

    await expect(apiClient.get('/protected')).rejects.toThrow(ApiError);
    await expect(apiClient.get('/protected')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Unauthorized',
      code: 'UNAUTHORIZED',
    });
  });

  it('should send JSON body on POST request', async () => {
    const payload = { email: 'user@test.com', password: 'password123' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'tok' }),
    } as Response);

    await apiClient.post('/auth/login', payload);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    );
  });

  it('should include Authorization header when token is provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    await apiClient.get('/me', { token: 'my-secret-token' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-secret-token',
        }),
      }),
    );
  });
});
