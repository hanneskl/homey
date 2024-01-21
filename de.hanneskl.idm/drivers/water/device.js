'use strict';

const { Device } = require('homey');
const fetch = require('node-fetch');

class WaterHeater extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('WaterHeater has been initialized');

    this.registerCapabilityListener("target_temperature", async (value) => {
      try {
        const response = await fetch("http://192.168.87.97/data/heatpump.php", {
          method: "PUT",
          headers: {
            "Cookie": "MYIDM=e3e6deb750243ca87c1781e1e09d0b9d",
            "CSRF-Token": "65a8cea3c7734"
          },
          body: JSON.stringify({
            "freshwater": {
              "mode": 2,
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
