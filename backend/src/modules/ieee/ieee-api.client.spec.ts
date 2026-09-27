import { ConfigService } from '@nestjs/config';
import { IeeeApiClient, IeeeApiError, parseSocietyList, parseStatus } from './ieee-api.client';

describe('parseStatus', () => {
  it('reads a found record', () => {
    expect(
      parseStatus({
        MemberStatus: 'Active',
        Grade: 'Student Member',
        SocietyList: 'UH3001,MEMRA024',
        FirstName: 'S',
        LastName: 'M',
      }),
    ).toEqual({
      found: true,
      memberStatus: 'Active',
      grade: 'Student Member',
      societies: ['UH3001', 'MEMRA024'],
      firstInitial: 'S',
      lastInitial: 'M',
    });
  });

  it('reads "not found", which IEEE sends as a normal 200 body', () => {
    expect(parseStatus({ reasons: [{ message: 'Customer Record Not Found' }] })).toEqual({ found: false });
  });

  it('refuses a body it does not recognise instead of calling it "not a member"', () => {
    expect(() => parseStatus({ reasons: [{ message: 'Invalid request' }] })).toThrow(IeeeApiError);
    expect(() => parseStatus({})).toThrow(IeeeApiError);
    expect(() => parseStatus(null)).toThrow(IeeeApiError);
  });
});

describe('parseSocietyList', () => {
  it.each([
    ['UH3001, MEMRA024', ['UH3001', 'MEMRA024']],
    ['None', []],
    ['', []],
    [undefined, []],
  ])('%p -> %p', (value, societies) => {
    expect(parseSocietyList(value)).toEqual(societies);
  });
});

describe('IeeeApiClient', () => {
  const env: Record<string, string> = {
    IEEE_API_BASE_URL: 'https://ieee.test/RST/',
    IEEE_CLIENT_ID: 'id',
    IEEE_CLIENT_SECRET: 'secret',
  };
  const config = { get: (key: string) => env[key] } as unknown as ConfigService;
  const json = (status: number, body: unknown) =>
    ({ status, ok: status >= 200 && status < 300, json: async () => body }) as Response;
  const token = (value: string) => json(200, { access_token: value, token_type: 'Bearer', expires_in: 3600 });
  const found = json(200, { MemberStatus: 'Active', Grade: 'Member', SocietyList: 'None' });

  let fetchMock: jest.Mock;
  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  it('gets a token once and reuses it', async () => {
    fetchMock.mockResolvedValueOnce(token('t1')).mockResolvedValueOnce(found).mockResolvedValueOnce(found);
    const client = new IeeeApiClient(config);

    await client.getStatus('12345678');
    await client.getStatus('a@b.com');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toBe('https://ieee.test/RST/api/oauth/token');
    expect(fetchMock.mock.calls[1][0]).toBe('https://ieee.test/RST/Customer/getstatus');
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer t1');
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ MemberID: 'a@b.com' });
  });

  it('refreshes the token once on a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(token('old'))
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(token('new'))
      .mockResolvedValueOnce(found);

    await expect(new IeeeApiClient(config).getStatus('12345678')).resolves.toMatchObject({ found: true });
    expect(fetchMock.mock.calls[3][1].headers.Authorization).toBe('Bearer new');
  });

  it('treats a server error or a timeout as "try again later"', async () => {
    fetchMock.mockResolvedValueOnce(token('t')).mockResolvedValueOnce(json(502, {}));
    await expect(new IeeeApiClient(config).getStatus('12345678')).rejects.toThrow(IeeeApiError);

    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(token('t')).mockRejectedValueOnce(Object.assign(new Error('t'), { name: 'TimeoutError' }));
    await expect(new IeeeApiClient(config).getStatus('12345678')).rejects.toThrow(IeeeApiError);
  });
});
