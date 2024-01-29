'use strict';

const { Device } = require('homey');
//const fetch = require('node-fetch');

class WaterHeater extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    
    this.log('WaterHeater has been initialized');

    this.registerCapabilityListener("onoff", async (isOn) => {  
      try {
        await fetch("http://192.168.87.97/data/heatpump.php", {
          method: "PUT",
          headers: {
            "Cookie": "MYIDM=e3e6deb750243ca87c1781e1e09d0b9d",
            "CSRF-Token": "65a8cea3c7734"
          },
          body: JSON.stringify({
            "freshwater": {
              "mode": isOn ? 2 : 0,
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

    this.registerCapabilityListener("target_temperature", async (value) => {
      try {
        await fetch("http://192.168.87.97/data/heatpump.php", {
          method: "PUT",
          headers: {
            "Cookie": "MYIDM=e3e6deb750243ca87c1781e1e09d0b9d",
            "CSRF-Token": "65a8cea3c7734"
          },
          body: JSON.stringify({
            "freshwater": {
              "temperatures": {
                "desired": {
                  "value": value
                }
              }
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

    // Get data once
    this.pullData();

    // Then get data every 10 seconds
    setInterval(() => {
      this.pullData();
    }, 10000);
  }

  async pullData() {
    try {
      fetch("http://192.168.87.97/data/heatpump.php", {
        headers: {
          "Cookie": "MYIDM=e3e6deb750243ca87c1781e1e09d0b9d",
          "CSRF-Token": "65a8cea3c7734"
        }
      }).then((response) => response.json())
        .then((data) => {
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
        });
    } catch (error) {
      this.log('Error: ', error)
    }
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
