'use strict';

const { Driver } = require('homey');

class WaterHeaterDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('WaterHeaterDriver has been initialized');
  }

  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    this.log("onPairListDevices called");
    return [
      {
      name: 'Water heater',
      data: {
           id: 'my-water-heater',
         },
      }
    ];
  }

}

module.exports = WaterHeaterDriver;
