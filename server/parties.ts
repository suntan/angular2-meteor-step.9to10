import {Parties} from '../collections/parties.ts';


function buildQuery(partyId?: string): Object {
     var isAvailable = {
        $or: [
         { 'public': true },
         {
           $and: [
             { owner: this.userId },
             { owner: { $exists: true } }
           ]
         }
       ]
     };
    
     if (partyId) {
       return { $and: [{ _id: partyId }, isAvailable] };
     }
 
     return isAvailable;
}

Meteor.publish('parties', function() {
  return Parties.find(buildQuery.call(this));
});
 
Meteor.publish('party', function(partyId: string) {
  return Parties.find(buildQuery.call(this, partyId));
});
