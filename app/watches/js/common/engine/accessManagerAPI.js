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

    function accessManagerAPI(LocalDBMS, opts) {
        
        var R             = opts.R           ;
        var CU            = opts.CommonUtils ;
        var PC            = opts.Precondition;
        var listeners     = opts.listeners   ;
        var Errors        = opts.Errors      ;
        var Constants     = opts.Constants   ;
        
        LocalDBMS.prototype.getManagementInfo = function(callback){
            var ManagementInfo = this.database.ManagementInfo;
            var usersInfo = CU.clone(R.keys(ManagementInfo.UsersInfo).reduce(function(result, user){
                result[user] = R.pick(['characters', 'groups','stories','players'], ManagementInfo.UsersInfo[user]);
                return result;
            }, {}));
            callback(null, {
                usersInfo : usersInfo,
                admin : ManagementInfo.admin,
                editor : ManagementInfo.editor,
                adaptationRights : ManagementInfo.adaptationRights
            });
        };
        
        LocalDBMS.prototype.assignAdmin = function(name, callback){
            PC.precondition(PC.entityExistsCheck(name, R.keys(this.database.ManagementInfo.UsersInfo)), callback, () => {
                this.database.ManagementInfo.admin = name;
                this.publishPermissionsUpdate();
                callback();
            });
        };
        LocalDBMS.prototype.assignEditor = function(name, callback){
            PC.precondition(PC.entityExistsCheck(name, R.keys(this.database.ManagementInfo.UsersInfo)), callback, () => {
                this.database.ManagementInfo.editor = name;
                this.publishPermissionsUpdate();
                callback();
            });
        };
        LocalDBMS.prototype.removeEditor = function(callback){
            this.database.ManagementInfo.editor = null;
            this.publishPermissionsUpdate();
            callback();
        };
        LocalDBMS.prototype.changeAdaptationRightsMode = function(mode, callback){
            var chain = [PC.isString(mode), PC.elementFromEnum(mode, ['ByStory','ByCharacter'])];
            PC.precondition(PC.chainCheck(chain), callback, () => {
                this.database.ManagementInfo.adaptationRights = mode;
                this.publishPermissionsUpdate();
                callback();
            });
        };
        
        LocalDBMS.prototype.removeMaster = function(name, callback){
            PC.precondition(PC.entityExistsCheck(name, R.keys(this.database.ManagementInfo.UsersInfo)), callback, () => {
                delete this.database.ManagementInfo.UsersInfo[name];
                this.publishPermissionsUpdate();
                callback();
            });
        };
        
        LocalDBMS.prototype.removePermission = function(userName, names, callback){
            var ManagementInfo = this.database.ManagementInfo;
            
            for(var entity in names){
                if(names[entity].length != 0){
                    ManagementInfo.UsersInfo[userName][entity] = ManagementInfo.UsersInfo[userName][entity].filter(function(charName){
                        return names[entity].indexOf(charName) === -1;
                    });
                }
            }
            this.publishPermissionsUpdate();
            callback();
        };
        
        LocalDBMS.prototype.assignPermission = function(userName, names, callback){
            var ManagementInfo = this.database.ManagementInfo;
            for(var entity in names){
                if(names[entity].length != 0){
                    names[entity].forEach(function(charName){
                        if(ManagementInfo.UsersInfo[userName][entity].indexOf(charName) === -1){
                            ManagementInfo.UsersInfo[userName][entity].push(charName);
                        }
                    });
                    
                    Object.keys(ManagementInfo.UsersInfo).forEach(function(name){
                        if(name === userName){
                            return;
                        }
                        
                        ManagementInfo.UsersInfo[name][entity] = ManagementInfo.UsersInfo[name][entity].filter(function(charName){
                            return names[entity].indexOf(charName) === -1;
                        });
                    });
                }
            }
            this.publishPermissionsUpdate();
            callback();
        };
        
        LocalDBMS.prototype.getPlayerLoginsArray = function(callback) {
            callback(null, R.keys(this.database.ManagementInfo.PlayersInfo));
        };
        
        LocalDBMS.prototype.removePlayerLogin = function(userName, callback) {
            PC.precondition(PC.entityExistsCheck(userName, R.keys(this.database.ManagementInfo.PlayersInfo)), callback, () => {
                delete this.database.ManagementInfo.PlayersInfo[userName];
                if(callback) callback();
            });
        };
        
        LocalDBMS.prototype.getWelcomeText = function(callback){
            callback(null, this.database.ManagementInfo.WelcomeText);
        };

        LocalDBMS.prototype.setWelcomeText = function(text, callback){
            PC.precondition(PC.isString(text), callback, () => {
                this.database.ManagementInfo.WelcomeText = text;
                if(callback) callback();
            });
        };
        
        LocalDBMS.prototype.getPlayersOptions = function(callback){
            callback(null, CU.clone(this.database.ManagementInfo.PlayersOptions));
        };
        
        LocalDBMS.prototype.setPlayerOption = function(name, value, callback){
            var chain = [PC.isString(name), PC.elementFromEnum(name, Constants.playersOptionTypes), PC.isBoolean(value)];
            PC.precondition(PC.chainCheck(chain), callback, () => {
                this.database.ManagementInfo.PlayersOptions[name] = value;
                if(callback) callback();
            });
        };
        
        LocalDBMS.prototype.createMaster = function(name, password, callback){
            callback(new Errors.ValidationError('admins-function-must-be-overriden-on-server', ['createMaster']));
        };
        
        LocalDBMS.prototype.changeMasterPassword = function(userName, newPassword, callback){
            callback(new Errors.ValidationError('admins-function-must-be-overriden-on-server', ['changeMasterPassword']));
        };
        
        LocalDBMS.prototype.publishPermissionsUpdate = function(callback) {
            callback(new Errors.ValidationError('admins-function-must-be-overriden-on-server', ['publishPermissionsUpdate']));
        };
        
        LocalDBMS.prototype.createPlayer = function(userName, password, callback) {
            callback(new Errors.ValidationError('admins-function-must-be-overriden-on-server', ['createPlayer']));
        };
        
        LocalDBMS.prototype.createPlayerLogin = function(userName, password, callback) {
            callback(new Errors.ValidationError('admins-function-must-be-overriden-on-server', ['createPlayerLogin']));
        };
        
        LocalDBMS.prototype.changePlayerPassword = function(userName, password, callback) {
            callback(new Errors.ValidationError('admins-function-must-be-overriden-on-server', ['changePlayerPassword']));
        };
        
        LocalDBMS.prototype.getPlayerProfileInfo = function(callback){
            callback(new Errors.ValidationError('admins-function-must-be-overriden-on-server', ['getPlayerProfileInfo']));
        };
        
        LocalDBMS.prototype.createCharacterByPlayer = function(characterName, callback) {
            callback(new Errors.ValidationError('admins-function-must-be-overriden-on-server', ['createCharacterByPlayer']));
        };
        
        var _renameProfile = function(type, fromName, toName){
            if(type === 'character') return;
            var playersInfo = this.database.ManagementInfo.PlayersInfo;
            if(playersInfo[fromName] !== undefined){
                playersInfo[toName] = playersInfo[fromName];  
                playersInfo[toName].name = toName;
                delete playersInfo[fromName];
            }
        };
        
        listeners.renameProfile = listeners.renameProfile || [];
        listeners.renameProfile.push(_renameProfile);
        
        var _removeProfile = function(type, characterName){
            if(type === 'character') return;
            var playersInfo = this.database.ManagementInfo.PlayersInfo;
            if(playersInfo[characterName] !== undefined){
                delete playersInfo[characterName];
            }
        };
        
        listeners.removeProfile = listeners.removeProfile || [];
        listeners.removeProfile.push(_removeProfile);    
    };
    
    callback(accessManagerAPI);

})(function(api){
    typeof exports === 'undefined'? this['accessManagerAPI'] = api: module.exports = api;
}.bind(this));