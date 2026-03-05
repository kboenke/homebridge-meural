import { describe, expect, it, vi } from 'vitest';

const axiosGetMock = vi.fn();

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

import { CanvasAccessory } from '../src/platformAccessory';

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('CanvasAccessory', () => {
  it('setBrightnessOn restores brightness to 100 when previously off', () => {
    const accessory = Object.create(CanvasAccessory.prototype) as any;
    accessory.platform = {
      log: { debug: vi.fn() },
      Characteristic: {
        Brightness: 'Brightness',
      },
    };
    accessory.state = {
      WasBrightnessZero: true,
    };
    accessory.service = {
      updateCharacteristic: vi.fn(),
    };
    accessory.brightnessService = {
      updateCharacteristic: vi.fn(),
    };
    accessory.setBrightness = vi.fn((value: number, callback: (error: Error | null) => void) => callback(null));

    const callback = vi.fn();
    accessory.setBrightnessOn(true, callback);

    expect(accessory.service.updateCharacteristic).toHaveBeenCalledWith('Brightness', 100);
    expect(accessory.brightnessService.updateCharacteristic).toHaveBeenCalledWith('Brightness', 100);
    expect(accessory.setBrightness).toHaveBeenCalledWith(100, callback);
    expect(callback).toHaveBeenCalledWith(null);
  });

  it('setRemoteKey sends mapped key command to all known device IPs', async () => {
    const accessory = Object.create(CanvasAccessory.prototype) as any;
    accessory.platform = {
      log: { debug: vi.fn() },
      Characteristic: {
        RemoteKey: {
          ARROW_UP: 0,
          ARROW_DOWN: 1,
          ARROW_LEFT: 2,
          ARROW_RIGHT: 3,
          BACK: 4,
          INFORMATION: 5,
          PLAY_PAUSE: 6,
        },
      },
    };
    accessory.state = {
      RemoteKey: 0,
    };
    accessory.headers = { headers: {} };
    accessory.ips = ['10.0.0.1', '10.0.0.2'];

    axiosGetMock.mockResolvedValue({ data: {} });

    const callback = vi.fn();
    accessory.setRemoteKey(3, callback);
    await flushPromises();

    expect(axiosGetMock).toHaveBeenCalledTimes(2);
    expect(axiosGetMock).toHaveBeenCalledWith('http://10.0.0.1/remote/control_command/set_key/right', { headers: {} });
    expect(axiosGetMock).toHaveBeenCalledWith('http://10.0.0.2/remote/control_command/set_key/right', { headers: {} });
    expect(callback).toHaveBeenCalledWith(null);
  });
});
