import 'reflect-metadata';
import {Component} from 'angular2/core';
import {Parties} from '../../../collections/parties';
import {PartiesForm} from '../parties-form/parties-form';
import {RouterLink} from 'angular2/router';
import {LoginButtons} from 'angular2-meteor-accounts-ui/login-buttons';
import {MeteorComponent} from 'angular2-meteor';
 
@Component({
  selector: 'parties-list',
  templateUrl: '/client/imports/parties-list/parties-list.html',
  directives: [PartiesForm, RouterLink, LoginButtons]
})
export class PartiesList extends MeteorComponent{
  parties: Mongo.Cursor<Party>;
 
  constructor() {
      super();
      this.subscribe('parties', () => {
         this.parties = Parties.find();
      }, true);
  }
 
  removeParty(party) {
    Parties.remove(party._id);
  }

  search(value: string) {
    if (value) {
      this.parties = Parties.find({ location: value });
    } else {
      this.parties = Parties.find();
    }
  }

}

