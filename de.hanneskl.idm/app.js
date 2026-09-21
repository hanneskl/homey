'use strict';

const Homey = require('homey');
const { IdmClient } = require('./lib/idm');

const POLL_INTERVAL_MS = 10 * 1000;
const MAX_BACKOFF_MS = 5 * 60 * 1000;

class IDMApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.client = new IdmClient({
      log: (...args) => this.log(...args),
      error: (...args) => this.error(...args),
    });
    this.devices = new Map();
    this.failures = 0;
    this.pollTimeout = null;

    this.log('IDM app has been initialized');
  }

  /**
   * Devices register here to receive the data of the shared poll.
   * All devices share one connection, so the settings saved last win.
   */
  registerDevice(device, onData) {
    this.devices.set(device, onData);
    this.client.configure(device.getSettings());
    this.schedulePoll(0);
  }

  unregisterDevice(device) {
    this.devices.delete(device);
    if (this.devices.size === 0) {
      this.homey.clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
  }

  onDeviceSettingsChanged(settings) {
    this.client.configure(settings);
    this.failures = 0;
    this.schedulePoll(0);
  }

  schedulePoll(delay) {
    this.homey.clearTimeout(this.pollTimeout);
    this.pollTimeout = this.homey.setTimeout(() => this.poll(), delay);
  }

  async poll() {
    if (this.devices.size === 0 || this.polling) {
      return;
    }
    this.polling = true;

    try {
      const data = await this.client.request();
      if (this.failures > 0) {
        this.log(`IDM reachable again after ${this.failures} failed attempt(s)`);
      }
      this.failures = 0;

      for (const [device, onData] of this.devices) {
        try {
          onData(data);
          if (!device.getAvailable()) {
            await device.setAvailable();
          }
        } catch (error) {
          device.error('Unexpected response from IDM:', JSON.stringify(data).slice(0, 300));
        }
      }
    } catch (error) {
      this.failures++;
      this.error(`Polling IDM failed (attempt ${this.failures}):`, error.cause || error.message);
      for (const device of this.devices.keys()) {
        await device.setUnavailable(error.message).catch(this.error);
      }
    } finally {
      this.polling = false;
    }

    // Back off while the IDM is unreachable: 10s, 20s, 40s, ... up to 5 min
    const delay = Math.min(POLL_INTERVAL_MS * 2 ** this.failures, MAX_BACKOFF_MS);
    this.schedulePoll(delay);
  }

}

module.exports = IDMApp;
