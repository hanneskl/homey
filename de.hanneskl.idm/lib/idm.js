'use strict';

const DEFAULT_HOST = '192.168.87.84';
const TIMEOUT_MS = 8000;

/**
 * Calls the IDM heatpump API using the device's settings (host, cookie, csfr).
 * Throws on network errors, timeouts and non-2xx responses. GET requests also
 * throw on non-JSON bodies (e.g. the login page returned when cookie/csfr have
 * expired); other methods return the response text.
 */
async function idmRequest(device, { method = 'GET', body } = {}) {
  const settings = device.getSettings();
  const host = (settings.host || DEFAULT_HOST).trim();

  const response = await fetch(`http://${host}/data/heatpump.php`, {
    method,
    headers: {
      "Cookie": settings.cookie,
      "CSRF-Token": settings.csfr
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`IDM at ${host} returned HTTP ${response.status}`);
  }

  // Write requests just get logged, only reads need to be parsed
  if (method !== 'GET') {
    return text;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`IDM at ${host} did not return JSON – cookie/CSFR token probably expired`);
  }
}

/**
 * Polls the IDM every 10 seconds and hands the data to onData.
 * Marks the device unavailable while the IDM can't be reached.
 */
function startPolling(device, onData) {
  const poll = async () => {
    try {
      const data = await idmRequest(device);
      try {
        onData(data);
      } catch (error) {
        // Usually an error object instead of measurements, so show what came back
        throw new Error(`Unexpected response from IDM: ${JSON.stringify(data).slice(0, 300)}`);
      }
      if (!device.getAvailable()) {
        await device.setAvailable();
      }
    } catch (error) {
      device.error('Polling failed:', error.cause || error.message);
      await device.setUnavailable(error.message).catch(device.error);
    }
  };

  poll();
  return device.homey.setInterval(poll, 10000);
}

module.exports = { idmRequest, startPolling, DEFAULT_HOST };
