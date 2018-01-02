/*Copyright 2017 Timofey Rechkalov <ntsdk@yandex.ru>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
    limitations under the License. */

'use strict';

((callback2) => {
    function logAPI(LocalDBMS, opts) {
        const { R } = opts;
        const CU = opts.CommonUtils;
        const PC = opts.Precondition;

        // eslint-disable-next-line func-names
        LocalDBMS.prototype.log = function (userName, funcName, rewrite, params, callback) {
            const chain = PC.chainCheck([PC.isString(userName), PC.isString(funcName),
                PC.isBoolean(rewrite), PC.isArray(params)]);
            PC.precondition(chain, err => console.error(err), () => {
                const info = [userName, new Date().toString(), funcName, JSON.stringify(params)];
                if (this.database) {
                    if (rewrite && this.database.Log[this.database.Log.length - 1] !== undefined) {
                        if (this.database.Log[this.database.Log.length - 1][2] === funcName) {
                            this.database.Log[this.database.Log.length - 1] = info;
                        }
                    } else {
                        this.database.Log.push(info);
                        if (this.database.Log.length > 2000) {
                            this.database.Log.splice(0, 1000);
                        }
                    }
                }
                console.log(CU.strFormat('{0},{1},{2},{3}', info));
                if (callback) callback();
            });
        };

        // eslint-disable-next-line func-names
        LocalDBMS.prototype.getLog = function (pageNumber, callback) {
            PC.precondition(PC.isNumber(pageNumber), callback, () => {
                const requestedLog = [];
                const max = this.database.Log.length;
                for (let i = max - (pageNumber * 100); i > max - ((pageNumber + 1) * 100); i--) {
                    if (this.database.Log[i]) {
                        requestedLog.push([i + 1].concat(this.database.Log[i]));
                    }
                }

                callback(null, {
                    requestedLog,
                    logSize: Math.ceil(this.database.Log.length / 100)
                });
            });
        };
    }

    callback2(logAPI);
})(api => (typeof exports === 'undefined' ? (this.logAPI = api) : (module.exports = api)));