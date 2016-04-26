import {loadParties} from './load-parties.ts';
import './parties.ts';
 
Meteor.startup(loadParties);
