import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosGetMock = vi.fn();
const cognitoSendMock = vi.fn();
const canvasAccessoryCtorMock = vi.fn();

vi.mock('axios', () => ({
  default: {
    get: axiosGetMock,
  },
}));

vi.mock('axios-retry', () => {
  const axiosRetryMock = Object.assign(vi.fn(), {
    exponentialDelay: vi.fn(),
  });
  return { default: axiosRetryMock };
});

vi.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: class {
    send = cognitoSendMock;
  },
  InitiateAuthCommand: class {
    constructor(public readonly input: unknown) {}
  },
}));

vi.mock('../src/platformAccessory', () => ({
  CanvasAccessory: canvasAccessoryCtorMock,
}));

import { CanvasPlatform } from '../src/platform';
import { APIEvent } from 'homebridge';

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

type MockAccessory = {
  UUID: string;
  displayName: string;
  context: {
    devices: Array<{ id: number; serialNumber: string; productKey: string; localIp: string; alias: string }>;
    controlCenterRemote?: boolean;
  };
};

function createMockApi() {
  class MockPlatformAccessory {
    public context: MockAccessory['context'] = { devices: [] };

    constructor(
      public readonly displayName: string,
      public readonly UUID: string,
    ) {}
  }

  return {
    hap: {
      Service: {},
      Characteristic: {},
      uuid: {
        generate: vi.fn((value: string) => `uuid-${value}`),
      },
    },
    on: vi.fn(),
    unregisterPlatformAccessories: vi.fn(),
    publishExternalAccessories: vi.fn(),
    platformAccessory: MockPlatformAccessory,
  };
}

function createPlatform() {
  const api = createMockApi();
  const log = {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  };

  const platform = new CanvasPlatform(
    log as any,
    {
      platform: 'MeuralCanvas',
      account_email: 'me@example.com',
      account_password: 'secret',
      exclude_devices: [],
      control_center_remote: true,
    } as any,
    api as any,
  );

  return { platform, api, log };
}

describe('CanvasPlatform', () => {
  beforeEach(() => {
    axiosGetMock.mockReset();
    cognitoSendMock.mockReset();
    canvasAccessoryCtorMock.mockReset();
  });

  it('registers discovery callback when Homebridge finishes launching', () => {
    const { api } = createPlatform();

    expect(api.on).toHaveBeenCalledWith(APIEvent.DID_FINISH_LAUNCHING, expect.any(Function));
  });

  it('returns cached token without refreshing', async () => {
    const { platform } = createPlatform();
    platform.token = 'Token cached';
    const refreshSpy = vi.spyOn(platform, 'refreshToken');

    const token = await platform.getToken();

    expect(token).toBe('Token cached');
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('refreshes token when cache is empty', async () => {
    const { platform } = createPlatform();
    cognitoSendMock.mockResolvedValueOnce({
      AuthenticationResult: {
        AccessToken: 'abc123',
      },
    });

    const token = await platform.getToken();

    expect(token).toBe('Token abc123');
    expect(platform.token).toBe('Token abc123');
    expect(cognitoSendMock).toHaveBeenCalledTimes(1);
  });

  it('unregisters cached accessories whose devices are no longer present', () => {
    const { platform, api } = createPlatform();
    const cachedAccessory = {
      UUID: 'uuid-1',
      displayName: 'Canvas',
      context: {
        devices: [
          { id: 1, serialNumber: 'S1', productKey: 'PK1', localIp: '10.0.0.1', alias: 'Canvas 1' },
          { id: 2, serialNumber: 'S2', productKey: 'PK2', localIp: '10.0.0.2', alias: 'Canvas 2' },
        ],
      },
    };

    platform.accessories.push(cachedAccessory as any);

    platform.unregisterRemoved([{ id: 1 }]);

    expect(api.unregisterPlatformAccessories).toHaveBeenCalledWith('homebridge-meural', 'MeuralCanvas', [cachedAccessory]);
  });

  it('discovers devices, filters excluded serials, and publishes new accessories', async () => {
    const { platform, api } = createPlatform();
    platform.config.exclude_devices = ['SERIAL-2'];
    vi.spyOn(platform, 'getToken').mockResolvedValue('Token abc');

    axiosGetMock.mockResolvedValueOnce({
      data: {
        data: [
          { id: 1, serialNumber: 'SERIAL-1', productKey: 'KEY-1', localIp: '10.0.0.1', alias: 'Canvas A' },
          { id: 2, serialNumber: 'SERIAL-2', productKey: 'KEY-2', localIp: '10.0.0.2', alias: 'Canvas B' },
        ],
      },
    });

    platform.discoverDevices();
    await flushPromises();

    expect(api.publishExternalAccessories).toHaveBeenCalledTimes(1);
    const publishedAccessories = (api.publishExternalAccessories as any).mock.calls[0][1] as MockAccessory[];
    expect(publishedAccessories).toHaveLength(1);
    expect(publishedAccessories[0].context.devices[0].id).toBe(1);
    expect(publishedAccessories[0].context.controlCenterRemote).toBe(true);
    expect(canvasAccessoryCtorMock).toHaveBeenCalledTimes(1);
  });

  it('memoizeTimeout caches values per argument for the timeout window', () => {
    vi.useFakeTimers();

    const { platform } = createPlatform();
    const fnSpy = vi.fn().mockReturnValue(42);
    const wrapped = platform.memoizeTimeout(fnSpy, 1000);

    expect(wrapped('same')).toBe(42);
    expect(wrapped('same')).toBe(42);
    expect(fnSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1001);

    expect(wrapped('same')).toBe(42);
    expect(fnSpy).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
