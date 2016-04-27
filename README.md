# angular2-meteor-step.9to10
安裝 Meteor 指令如下:

$ curl https://install.meteor.com/ | sh

下載範例到專案根目錄，以　/usr/src 為例，並變更專案名稱 (以 my-app 為例 )，輸入指令如下 :

$ cd /usr/scr

$ git clone https://github.com/suntan/angular2-meteor-step.9to10.git

$ mv angular2-meteor-step.9to10 my-app

$ cd my-app

$ meteor add angular2-compilers

$ meteor npm install --save angular2-meteor

$ meteor npm install --save meteor-node-stubs

$ meteor remove blaze-html-templates

$ npm install typings -g

$ typings install es6-promise

$ typings install es6-shim --ambient

$ meteor npm install angular2-meteor-auto-bootstrap --save

$ meteor remove insecure

$ meteor add accounts-password

$ meteor npm install --save angular2-meteor-accounts-ui

$ meteor remove autopublish

$ typings install meteor (修正編譯時 Mongo、Meteor . . .Model Not Found 的錯誤訊息)


用自己喜歡的 port 啟動(以下用1688為例)，輸入指令如下:

$ meteor -p  1688

=============================================================================================

執行完成上述指令，如果現在啟動應用並使用瀏覽器測試，會發現所有Data-Bind的資料都不見了，只剩下 View跟功能。

# Meteor.publish – 資料發佈

從client-side訂閱server-side所發布的訊息，其第一步就是我們要告訴Meteor 需要發佈什麼資料訊息。需要了解 Meteor 提供的 publish function ( 詳細資料 : http://docs.meteor.com/#/full/meteor_publish )
。Step7.我們介紹過Meteor專案的目錄結構，發佈資料訊息的地方是在server 資料夾內，client 的應用是無法直接存取到地。

建立server-side發佈 parties資料方法，建立server/parties.ts 檔案，並編寫如下 :

import {Parties} from '../collections/parties.ts'; 

Meteor.publish('parties', function() {

  return Parties.find();
  
});

將上述server/parties.ts檔案引入至server-side主程式 server/main.ts 進行發佈 :

import {loadParties} from './load-parties.ts';

import './parties.ts';

Meteor.startup(loadParties);

# Meteor.subscribe – 資料訂閱
在client-side 訂閱訊息，( subscribe 詳細介紹 : http://docs.meteor.com/#/full/meteor_subscribe ) 在原本的 Meteor + Blaze 應用我通常會在client加入如下程式碼進行資料訂閱 :

Meteor.subscribe('parties');

使用上非常件單，或者將訂閱的資料帶入區域集合物件:

Meteor.subscribe('parties', () => {

  this.parties = Parties.find();
  
});

但還有兩個小問題我們必須解決 :

1.	結束訂閱 ( Ending a subscription. ) :

每一個用戶的訂閱，代表Meteor要不斷的在client-side與server-side之間同步傳輸資料集合。如果此時我們變更使用訂閱資料的實作組件(Component)時，又或者用戶端破壞了Component的結構，那就會造成資料同步的memory leak。

2.	更新到Angular2 畫面上 ( Updating Angular 2's UI ) :

我們必須在收到資料時使Angular2 的UI更新，精確點說，就是要在資料異動時回呼(callback)方法繫結到Angular2的區域偵測API(zone套件)讓它來執行更新畫面的工作。

基於以上兩點原因Angular2-Meteo套件建立了 MeteorComponent類別來處理這些問題，MeteorComponent中有subscribe、 autorun兩個方法可用，只要我們的Component繼承MeteorComponent就可以使用，可以放心有關memory leak清理的問題。

在MeteorComponent中有一個可使用布林參數的方法: autoBind(bool)，可供我們設定是否在subscribe資料以第二參數(true / false)方式來決定變更結束時是否回呼Angular2的zone來更新UI。

觀念釐清了知道了方法，那就動手改code吧! 首先先將列表頁 ( client/imports/parties-list/parties-list.ts ) 修改如下 :

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

現在啟動應用，我們可以看到我們已經成功訂閱了parties資料到列表頁了。

接下來我們要增 public: boolean欄位到 typings/party.d.ts 檔案中增加資料屬性如下 :

interface Party {

  _id?: string;
  
  name: string;
  
  description?: string;
  
  location: string;
  
  owner?: string;
  
  public: boolean;
  
}

於新增party資料時選擇是否(true / false)公開這筆party資料，編輯 client/imports/parties-form/parties-form.html 檔案增加checkbox讓使用者勾選如下:


<div *ngIf="!user">Please, log in to change party</div>


  <label>Location</label>
  
  <input type="text" ngControl="location">
  
  <label>Public:</label>
  
  <input type="checkbox" ngControl="public">
  
  <button>Add</button>
  
</form>

編輯 client/imports/parties-form/parties-form.ts 檔，增加public欄位如下 :

    this.partiesForm = fb.group({
    
      name: ['', Validators.required],
      
      description: [''],
      
      location: ['', Validators.required],
      
      'public': [false]
      
    });
    
  }
 
...some lines skipped...

          name: party.name,
          
          
          description: party.description,
          
          location: party.location,
          
          'public': party.public,
          
          owner: Meteor.userId()
          
        });
 
        (<Control>this.partiesForm.controls['name']).updateValue('');
        
        (<Control>this.partiesForm.controls['description']).updateValue('');
        
        (<Control>this.partiesForm.controls['location']).updateValue('');
        
        (<Control>this.partiesForm.controls['public']).updateValue(false);
        
      } else {
      
        alert('Please log in to add a party');
        
      }

調整 server/load-parties.ts 檔案，增加增加public欄位 ; 隨意設定 true / false 作初始化設定如下 :


export function loadParties() {

  if (Parties.find().count() === 0) {
  
    var parties = [
    
      {
      
        'name': 'Dubstep-Free Zone',
        
        'description': 'Can we please just for an evening not listen to dubstep.',
        
        'location': 'Palo Alto',
        
        'public': true
        
        },{
      
        'name': 'All dubstep all the time',
        
        'description': 'Get it on!',
        
        'location': 'Palo Alto',
        
        'public': false
        
      },

修改資料server/parties.ts 發佈設定，增加or判斷，讓使用者能看到 public : true 的資料以或者自己新增的資料 :

import {Parties} from '../collections/parties.ts'; 

Meteor.publish('parties', function() {

  return Parties.find({
  
    $or: [
    
      { 'public': true },
      
      {
      
        $and: [
        
          { owner: this.userId },
          
          { owner: { $exists: true } }
          
        ]
        
      }
      
    ]
    
  });
  
});

Notes : $or、$and、$exists為 MongoDB 的query syntax設定. 如不熟悉可參考這裡 : https://docs.mongodb.org/manual/reference/operator/query ；這也是NOSQL的特性，可使用 json 格式的設定格式來當作SQL query command。

最後執行如下指令，清除資料；並啟動專案進行測試:

$ meteor reset

$ meteor

我們來巡覽一下這個App ，列表頁只我們初始化時設定public 欄位為true的資料。因為我們已經透過meteor reset指令清空了資料庫，所以可以建立兩個以上的 User並且新增多筆public為true與false的party資料來交叉對照。未登入的client只能看到public 為true的資料，登入的使用者除了可看到public為true的資料外，還包括自己新增的資料。

# Subscribe with Params – 依照參數發佈訂閱資訊

在上述的測試中我們發現資料結果頁發生了錯誤，因為資料模組的自動發佈已經被我們移除，目前僅從server-side發佈 parties集合；並沒有重新編寫從server-side對單一資料結果發佈以及client-side結果頁對資料的接收。

首先我們修改 server/parties.ts ，增加buildQuery方法，使其除了發佈parties集合外，還可接收client傳來的 partyId來發佈單筆資料 :

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

Notes : buildQuery判斷呼叫時是否包含字串參數partyId，來回傳不同的query command設定。如此以來server-side就發佈了 parties集合物件，與需要partyId參數來 subscribe的 party特定資料物件，就看 client-side要subscribe什麼囉.

修改 client/imports/party-details/party-details.ts 檔案，同樣使PartyDetails Component繼承MeteorComponent來進行剛新增的 party特定資料物件訂閱 :


import {MeteorComponent} from 'angular2-meteor';

function checkPermissions(instruction: ComponentInstruction) {

  var partyId = instruction.params['partyId'];
  
  var party = Parties.findOne(partyId);
  
  return (party && party.owner == Meteor.userId());
  
}

@Component({

  selector: 'party-details',
  
  templateUrl: '/client/imports/party-details/party-details.html',
  
  directives: [RouterLink]
  
})

/* @RequireUser() */

@CanActivate(checkPermissions)

export class PartyDetails extends MeteorComponent{

  party: Party;

  constructor(params: RouteParams) {
  
    super();
    
    var partyId = params.get('partyId');
    
    this.subscribe('party', partyId, () => {
    
      this.party = Parties.findOne(partyId);
      
    }, true);
    
    /*  this.party = Parties.findOne(partyId); */
    
  }

修改 client/imports/party-details/party-details.html 檔案，於form標籤加入ngIf 指令告訴Angular2 我們需要party 資料物件callback的zone 在這個區段 :

<form (submit)="saveParty(party)"  *ngIf="party">
  <label>Name</label>
  <input type="text" [(ngModel)]="party.name">

啟動應用進行測試，結果頁的功能又正常了；為了安全性考量，建議養成好習慣，在建立Angular2-Meteor方案時就把autopublish 套件移除；實際開發時的動線當然會與本教學不同，因為這裡是教學，所以比較著重在介紹與引導，期望的是可以使開發者更了解這套方案的概念與結構。

# Search – 加入搜索功能

我們現在要在PartiesList  組件內加入以 party的location欄位進行資料搜索，並將搜索結果的資料集合寫入區域變數 parties，讓Angular2 自動幫我們作Data-Bind。

修改client/imports/parties-list/parties-list.html 檔案，加入input-text與button DOM物件:

<div>

  <parties-form></parties-form>
  
  <login-buttons></login-buttons>
  
  <input type="text" #searchtext placeholder="Search by Location">
  
  <button type="button" (click)="search(searchtext.value)">Search</button>
  <ul>
  
    <li *ngFor="#party of parties">


修改 client/imports/parties-list/parties-list.ts 檔案，加入上述供 (click) 行為呼叫的 search 方法 :


export class PartiesList extends MeteorComponent{

  parties: Mongo.Cursor<Party>;
  
  constructor() {
  
    super();
    
    this.subscribe('parties', () => {
    
      this.parties = Parties.find();
      
    }, true);
    
  }

  search(value: string) {
  
    if (value) {
    
      this.parties = Parties.find({ location: value });
      
    } else {
    
      this.parties = Parties.find();
      
    }
    
  }

  removeParty(party) {


Notes: 我們並不需要作重新訂閱的動作，而是在已載入的資料集合中比對需要的資料結果。

Understanding Publish-Subscribe – 了解發佈與訂閱間的關係
真的了解Meteor資訊的發佈與訂閱，以至於訂閱資訊連結到View之間的工作原理是非常重要的。

客戶端已接收到的訂閱數據是累積的，僅是在不同的View中刪除或者新增、改變資料集合並不會真的對客戶端已接收的資料產生任何改變。

PS: Meteor Pub/Sub 介紹 : http://www.meteorpedia.com/read/Understanding_Meteor_Publish_and_Subscribe

# Summary – 概要說明

本節我們了解了如可將Angular2與Meteor結合，並提升專案的安全性，你應該有發覺，我們的Code都簡單到嚇死人，但卻是基於嚴謹的邏輯來一步一步執行與提升，到目前為止如果你對於TypeScript的語法認識本來就有一定的深度，相信你已經可以運用Angular2-Meteor作出一些不同的應用。

# Step 10 - Deploying your app – 佈署你的應用

不是替Meteor，作廣告；但人家給我們方便的解決方案好歹也介紹一下吧! Meteor Development Group 有個收費服務叫做Galaxy( 不是 Samsung Galaxy喔! ) 可以供我們進行佈署跟多多平台上的APP測試，在使用Galaxy時我們需要用到 MongoDB，可以到這裡 ( https://www.meteor.com/galaxy/signup  ) 申請並開始進行佈署。

當然我們也可以選擇使用 Microsoft Azure、Amazon Web Services ；個人是從2008年開始用AWS EC2，已經習慣了，而且AWS網路解決方案也比 Azure來的多。
