'use strict';

const Homey = require('homey');

class IDMApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('IDM app has been initialized');
  }

}

module.exports = IDMApp;
