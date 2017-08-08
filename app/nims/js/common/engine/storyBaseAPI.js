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

"use strict";

(function(callback){

    function storyBaseAPI(LocalDBMS, opts) {
        
        var R             = opts.R           ;
        var CU            = opts.CommonUtils ;
        var Errors        = opts.Errors      ;
        
        // stories, timeline
        LocalDBMS.prototype.getStoryNamesArray = function (callback) {
            callback(null, Object.keys(this.database.Stories).sort(CU.charOrdA));
        };
        // social network
        LocalDBMS.prototype.getAllStories = function(callback) {
            callback(null, CU.clone(this.database.Stories));
        };
        
        //stories
        LocalDBMS.prototype.getMasterStory = function(storyName, callback){
            CU.precondition(CU.entityExistsCheck(storyName, R.keys(this.database.Stories)), callback, () => {
                callback(null, this.database.Stories[storyName].story);
            });
        };
        //stories
        LocalDBMS.prototype.setMasterStory = function(storyName, value, callback){
            var chain = [CU.entityExistsCheck(storyName, R.keys(this.database.Stories)), CU.isString(value)];
            CU.precondition(CU.chainCheck(chain), callback, () => {
                this.database.Stories[storyName].story = value;
                callback();
            });
        };
    
        // stories
        LocalDBMS.prototype.createStory = function(storyName, callback){
            CU.precondition(CU.createEntityCheck(storyName, R.keys(this.database.Stories)), callback, () => {
                this.database.Stories[storyName] = {
                        name : storyName,
                        story : "",
                        characters : {},
                        events : []
                };
                this.ee.trigger("createStory", arguments);
                callback();
            });
        };
        // stories
        LocalDBMS.prototype.renameStory = function(fromName, toName, callback){
            CU.precondition(CU.renameEntityCheck(fromName, toName, R.keys(this.database.Stories)), callback, () => {
                var data = this.database.Stories[fromName];
                data.name = toName;
                this.database.Stories[toName] = data;
                delete this.database.Stories[fromName];
                this.ee.trigger("renameStory", arguments);
                callback();
            });
        };
    
        // stories
        LocalDBMS.prototype.removeStory = function(storyName, callback){
            CU.precondition(CU.removeEntityCheck(storyName, R.keys(this.database.Stories)), callback, () => {
                delete this.database.Stories[storyName];
                this.ee.trigger("removeStory", arguments);
                callback();
            });
        };
    
    };
    callback(storyBaseAPI);

})(function(api){
    typeof exports === 'undefined'? this['storyBaseAPI'] = api: module.exports = api;
}.bind(this));
