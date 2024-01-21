'use strict';

const Homey = require('homey');

class IDMApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('IDMApp has been initialized');
    this.log("Hello World");
  }

}

module.exports = IDMApp;
