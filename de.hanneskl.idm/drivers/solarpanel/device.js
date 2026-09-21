'use strict';

const { Device } = require('homey');

class SolarPanel extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {

    this.log('SolarPanel has been initialized');

    // Receive data from the app's shared poll
    this.homey.app.registerDevice(this, (data) => this.updateCapabilities(data));
  }

  updateCapabilities(data) {
    const measure_power = data.pv.act ? 1000 * parseFloat(data.pv.act) : 0;
    const measure_power_battery = data.pv.batt ? 1000 * parseFloat(data.pv.batt) * (data.pv.battdir == 1 ? 1 : -1) : 0;
    const measure_battery = parseFloat(data.pv.battload);
    const measure_power_grid = 1000 * parseFloat(data.pv.evu) * (data.pv.evudir == 1 ? 1 : -1);
    const measure_power_house = 1000 * parseFloat(data.pv.house);
    const measure_power_heatpump = 1000 * parseFloat(data.pv.hp);

    this.setCapabilityValue('measure_power', measure_power).catch(this.error);
    this.setCapabilityValue('measure_power.battery', measure_power_battery).catch(this.error);
    this.setCapabilityValue('measure_battery', measure_battery).catch(this.error);
    this.setCapabilityValue('measure_power_grid', measure_power_grid).catch(this.error);
    this.setCapabilityValue('measure_power_house', measure_power_house).catch(this.error);
    this.setCapabilityValue('measure_power_heatpump', measure_power_heatpump).catch(this.error);
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('SolarPanel has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('SolarPanel settings where changed');
    this.homey.app.onDeviceSettingsChanged(newSettings);
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('SolarPanel was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('SolarPanel has been deleted');
    this.homey.app.unregisterDevice(this);
  }

}

module.exports = SolarPanel;
