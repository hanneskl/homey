Adds support for IDM heatpump.

### Installation

```
cd de.hanneskl.idm
homey login
homey app install
```

### Settings

Enter the PIN of the IDM web interface in the device settings. The app then
logs in by itself (POST /index.php, CSRF token from the returned HTML) and logs
in again whenever the IDM answers "invalid csrf token", e.g. after a restart.
All devices share one connection, so use the same settings on all of them.

Without a PIN, cookie and csfr can still be entered manually:

1. Open the IDM web interface (default http://192.168.87.84)
2. Login with your PIN
3. Open console and get the cookie and csfr from the request headers.
4. Add them to the settings. They need to be updated whenever the IDM restarts.

If the IDM gets a new IP address, update "IDM address" in the device settings.
Give it a fixed DHCP reservation in the router to avoid this. While the IDM
can't be reached, the devices show as unavailable and the app polls less often
(10s, 20s, 40s, ... up to 5 min) until it is back.