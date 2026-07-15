import { apiClient, ApiError } from './api-client';

const mockFetch = jest.fn();

/** Resposta bem-sucedida, envelopada como o backend real responde: { success, data, message, timestamp }. */
function okResponse<T>(data: T) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: async () => ({ success: true, data, message: '', timestamp: new Date().toISOString() }),
  } as unknown as Response;
}

/** Resposta de erro, envelopada como o AllExceptionsFilter real responde: { success: false, error }. */
function errorResponse(statusCode: number, statusText: string, error: Record<string, unknown>) {
  return {
    ok: false,
    status: statusCode,
    statusText,
    headers: { get: () => null },
    json: async () => ({ success: false, error, timestamp: new Date().toISOString() }),
  } as unknown as Response;
}

describe('apiClient', () => {
  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve with data on successful GET request', async () => {
    const mockData = { id: '1', name: 'Doc' };
    mockFetch.mockResolvedValue(okResponse(mockData));

    const result = await apiClient.get<typeof mockData>('/documents/1');

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/documents/1'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('should throw ApiError with statusCode and message on non-ok response', async () => {
    mockFetch.mockResolvedValue(
      errorResponse(401, 'Unauthorized', { message: 'Unauthorized', statusCode: 401, code: 'UNAUTHORIZED' }),
    );

    await expect(apiClient.get('/protected')).rejects.toThrow(ApiError);
    await expect(apiClient.get('/protected')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Unauthorized',
      code: 'UNAUTHORIZED',
    });
  });

  it('should send JSON body on POST request', async () => {
    const payload = { email: 'user@test.com', password: 'password123' };
    mockFetch.mockResolvedValue(okResponse({ accessToken: 'tok' }));

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
    mockFetch.mockResolvedValue(okResponse({}));

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
