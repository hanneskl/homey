Adds support for IDM heatpump.

### Installation

```
cd de.hanneskl.idm
homey login
homey app install
```

### Get the credentials

1. Open the IDM web interface (default http://192.168.87.84)
2. Login with your password
3. Open console and get the cookie and csfr from the request headers.
4. Add them to the settings.

Note: This needs to be updated whenever the IDM restarts.

If the IDM gets a new IP address, update "IDM address" in the device settings.
Give it a fixed DHCP reservation in the router to avoid this. While the IDM
can't be reached (or cookie/csfr have expired), the devices show as unavailable.