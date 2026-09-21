'use strict';

const DEFAULT_HOST = '192.168.87.84';
const TIMEOUT_MS = 8000;

class SessionError extends Error {}

/**
 * Talks to the internal API of the IDM web interface (/data/heatpump.php).
 *
 * The API needs the MYIDM session cookie plus a CSRF token. With a PIN the
 * client logs in by itself (POST /index.php, token is embedded in the returned
 * HTML) and logs in again whenever the IDM answers "invalid csrf token", e.g.
 * after it restarted. Without a PIN the manually copied cookie/csfr are used.
 */
class IdmClient {

  constructor({ log, error }) {
    this.log = log;
    this.error = error;
    this.config = {};
    this.session = null;
  }

  configure({ host, pin, cookie, csfr }) {
    const config = {
      host: (host || DEFAULT_HOST).trim(),
      pin: (pin || '').trim(),
      cookie: (cookie || '').trim(),
      csfr: (csfr || '').trim(),
    };
    if (JSON.stringify(config) !== JSON.stringify(this.config)) {
      this.config = config;
      this.session = null;
    }
  }

  get host() {
    return this.config.host || DEFAULT_HOST;
  }

  /**
   * GET returns the parsed JSON, other methods return the response text.
   * Throws on network errors, timeouts, non-2xx responses and failed logins.
   */
  async request({ method = 'GET', body } = {}) {
    try {
      return await this.requestOnce({ method, body });
    } catch (error) {
      // Session expired (e.g. IDM restarted): log in again and retry once
      if (error instanceof SessionError && this.config.pin) {
        this.log('IDM session expired, logging in again');
        this.session = null;
        return this.requestOnce({ method, body });
      }
      throw error;
    }
  }

  async requestOnce({ method, body }) {
    const session = await this.getSession();

    const response = await fetch(`http://${this.host}/data/heatpump.php`, {
      method,
      headers: {
        "Cookie": session.cookie,
        "CSRF-Token": session.csrf
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`IDM at ${this.host} returned HTTP ${response.status}`);
    }
    if (text.includes('invalid csrf token')) {
      throw new SessionError(this.config.pin
        ? 'IDM rejected the session'
        : 'Cookie/CSFR token expired – enter the PIN in the device settings to log in automatically');
    }

    // Write requests just get logged, only reads need to be parsed
    if (method !== 'GET') {
      return text;
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new SessionError(`IDM at ${this.host} did not return JSON`);
    }
  }

  async getSession() {
    if (this.session) {
      return this.session;
    }
    if (this.config.pin) {
      // Concurrent requests share one login instead of logging each other out
      this.loginPromise = this.loginPromise || this.login().finally(() => {
        this.loginPromise = null;
      });
      this.session = await this.loginPromise;
    } else {
      this.session = { cookie: this.config.cookie, csrf: this.config.csfr };
    }
    return this.session;
  }

  async login() {
    const cookies = new Map();
    const collectCookies = (response) => {
      for (const header of response.headers.getSetCookie()) {
        const [pair] = header.split(';');
        const [name, ...value] = pair.split('=');
        cookies.set(name.trim(), value.join('='));
      }
    };
    const cookieHeader = () => [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');

    let response = await fetch(`http://${this.host}/index.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ pin: this.config.pin }),
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    collectCookies(response);

    // Follow redirects by hand so the session cookie is sent along
    for (let i = 0; i < 3 && response.status >= 300 && response.status < 400; i++) {
      const location = new URL(response.headers.get('location'), `http://${this.host}/`);
      response = await fetch(location, {
        headers: { 'Cookie': cookieHeader() },
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      collectCookies(response);
    }

    const html = await response.text();
    const match = html.match(/csrf_token\s*=\s*"([^"]+)"/);
    if (!match || !cookies.has('MYIDM')) {
      throw new Error(`Login at IDM ${this.host} failed – check the PIN`);
    }

    this.log('Logged in at IDM', this.host);
    return { cookie: cookieHeader(), csrf: match[1] };
  }

}

module.exports = { IdmClient, DEFAULT_HOST };
