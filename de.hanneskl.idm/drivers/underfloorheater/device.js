'use strict';

const { Device } = require('homey');
//const fetch = require('node-fetch');

class UnderfloorHeater extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {

    this.log('UnderfloorHeater has been initialized');

    // Get data once
    this.pullData();

    // Then get data every 10 seconds
    setInterval(() => {
      this.pullData();
    }, 10000);

    const settings = this.getSettings();

    this.registerCapabilityListener("onoff", async (isOn) => {  
      try {
        await fetch("http://192.168.87.97/data/heatpump.php", {
          method: "PUT",
          headers: {
            "Cookie": settings.cookie,
            "CSRF-Token": settings.csfr
          },
          body: JSON.stringify({
            "system": {
              "sysmode": isOn ? 1 : 0,
            }
          })
        }).then((response) => response.text())
          .then((text) => {
            this.log('Response: ', text);
          });
      } catch (error) {
        this.log('Error: ', error)
      }
    });
  }

  async pullData() {

    const settings = this.getSettings();
    
    try {
      fetch("http://192.168.87.97/data/heatpump.php", {
        headers: {
          "Cookie": settings.cookie,
          "CSRF-Token": settings.csfr
        }
      }).then((response) => response.json())
        .then((data) => {
          this.log(data);
          const isOn = data.system.sysmode == 1;
          const measure_power = isOn ? parseFloat(data.pv.hp) * 1000 : 0;
          const measure_power_produced = isOn && data.system.q ? parseFloat(data.system.q.value) * 1000 : 0;
          const measure_efficiency = measure_power > 1000 && measure_power_produced > 1000 ? measure_power_produced / measure_power * 100 : null;

          const measure_temperature = parseFloat(data.system.temperatures.heat);
          const measure_temperature_outside = parseFloat(data.system.temperatures.srcin);
          const measure_temperature_feed_in = parseFloat(data.system.temperatures.hpin);
          const measure_temperature_feed_out = parseFloat(data.system.temperatures.hpout);

          this.setCapabilityValue('onoff', isOn).catch(this.error);
          this.setCapabilityValue('measure_power', measure_power).catch(this.error);
          this.setCapabilityValue('measure_power_produced', measure_power_produced).catch(this.error);
          this.setCapabilityValue('measure_efficiency', measure_efficiency).catch(this.error);

          this.setCapabilityValue('measure_temperature', measure_temperature).catch(this.error);
          this.setCapabilityValue('measure_temperature_outside', measure_temperature_outside).catch(this.error);
          this.setCapabilityValue('measure_temperature_feed_in', measure_temperature_feed_in).catch(this.error);
          this.setCapabilityValue('measure_temperature_feed_out', measure_temperature_feed_out).catch(this.error);

        });
    } catch (error) {
      this.log('Error: ', error)
    }
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('UnderfloorHeater has been added');
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
    this.log('UnderfloorHeater settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('UnderfloorHeater was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('UnderfloorHeater has been deleted');
  }

}

module.exports = UnderfloorHeater;
