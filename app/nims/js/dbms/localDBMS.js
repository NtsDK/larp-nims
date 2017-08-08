/*Copyright 2015 Timofey Rechkalov <ntsdk@yandex.ru>, Maria Sidekhmenova <matilda_@list.ru>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
   limitations under the License. */

/*global
 Utils, Database, Migrator
 */
"use strict";

function makeLocalDBMS(fullVersion){
//    if(!fullVersion){
//        function LocalDBMS(){
//        };
//        return LocalDBMS;
//    }
    
    var opts = {
        Migrator     : Migrator    ,
        CommonUtils  : CommonUtils ,
        EventEmitter : EventEmitter,
        R            : R           ,
        Ajv          : Ajv         ,
        Schema       : Schema      ,
        Errors       : Errors      ,
        listeners    : {}          ,
        Constants    : Constants   ,
        dbmsUtils    : {}          ,
        dateFormat   : dateFormat  ,
    };
    
    function LocalDBMS(){
        this._init(opts.listeners);
    };
    
    LocalDBMS.prototype.getSettings = function(){
        "use strict";
        return this.database.Settings;
    };
    
    var func = (name) => window[name](LocalDBMS, opts);
    
    ["baseAPI"               ,
    "consistencyCheckAPI"   ,
    "statisticsAPI"         ,
    "profilesAPI"           ,
    "profileBindingAPI"     ,
    
    "groupsAPI"             ,
    "groupSchemaAPI"        ,
    "investigationBoardAPI" ,
    "relationsAPI"          ,
    "briefingExportAPI"     ,
    
    "profileConfigurerAPI"  ,
    "entityAPI"             ,
    "storyBaseAPI"          ,
    "storyEventsAPI"        ,
    "storyCharactersAPI"    ,
    
    "storyViewAPI"          ,
    "storyAdaptationsAPI"   ,
    "accessManagerAPI"      ,
    "textSearchAPI"         ,
    "logAPI"].map(func);
    
    Logger.attachLogCalls(LocalDBMS, R, false);
    return LocalDBMS;
};

