# fabric-sdk-practice
Focus on Fabric Node SDK

declare function getChannels() in file: node_modules/fabric-client/types/index.d.ts at line 39:
  public getChannels(): any;

define function  getChannels() in file: node_modules/fabric-client/lib/Clients.js at line 330.

  getChannels(){
   	let channels = Object.keys(this._network_config._network_config.channels);
  	return channels
  }

