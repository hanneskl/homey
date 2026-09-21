'use strict';

const { Device } = require('homey');
const { idmRequest, startPolling } = require('../../lib/idm');

class WaterHeater extends Device {

  /**
  * onInit is called when the device is initialized.
  */
  async onInit() {

    this.log('WaterHeater has been initialized');

    // Errors are thrown on purpose so Homey shows that the change failed
    this.registerCapabilityListener("onoff", async (isOn) => {
      const text = await idmRequest(this, {
        method: "PUT",
        body: {
          "freshwater": {
            "mode": isOn ? 2 : 0,
          }
        }
      });
      this.log('Response: ', text);
    });

    this.registerCapabilityListener("target_temperature", async (value) => {
      const text = await idmRequest(this, {
        method: "PUT",
        body: {
          "freshwater": {
            "temperatures": {
              "desired": {
                "value": value
              }
            }
          }
        }
      });
      this.log('Response: ', text);
    });

    // Get data now and then every 10 seconds
    startPolling(this, (data) => this.updateCapabilities(data));
  }

  updateCapabilities(data) {
    const isOn = data.system.sysmode == 4;
    const measure_power = isOn ? parseFloat(data.pv.hp) * 1000 : 0;
    const measure_power_produced = isOn && data.system.q ? parseFloat(data.system.q.value) * 1000 : 0;
    const measure_efficiency = measure_power > 1000 && measure_power_produced > 1000 ? measure_power_produced / measure_power * 100 : null;
    const measure_temperature_top = parseFloat(data.freshwater.temperatures.frwa2);
    const measure_temperature_bottom = parseFloat(data.freshwater.temperatures.frwa1);
    const measure_temperature = measure_temperature_top;
    const target_temperature = parseFloat(data.freshwater.temperatures.desired.value);

    this.setCapabilityValue('onoff', isOn).catch(this.error);
    this.setCapabilityValue('measure_power', measure_power).catch(this.error);
    this.setCapabilityValue('measure_power_produced', measure_power_produced).catch(this.error);
    this.setCapabilityValue('target_temperature', target_temperature).catch(this.error);
    this.setCapabilityValue('measure_temperature', measure_temperature).catch(this.error);
    this.setCapabilityValue('measure_temperature_bottom', measure_temperature_bottom).catch(this.error);
    this.setCapabilityValue('measure_temperature_top', measure_temperature_top).catch(this.error);
    this.setCapabilityValue('measure_efficiency', measure_efficiency).catch(this.error);
  }
  
  /**
  * onAdded is called when the user adds the device, called just after pairing.
  */
  async onAdded() {
    this.log('WaterHeater has been added');
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
    this.log('WaterHeater settings where changed');
  }
  
  /**
  * onRenamed is called when the user updates the device's name.
  * This method can be used this to synchronise the name to the device.
  * @param {string} name The new name
  */
  async onRenamed(name) {
    this.log('WaterHeater was renamed');
  }
  
  /**
  * onDeleted is called when the user deleted the device.
  */
  async onDeleted() {
    this.log('WaterHeater has been deleted');
  }
  
}

module.exports = WaterHeater;
