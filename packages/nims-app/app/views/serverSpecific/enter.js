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
 Utils, DBMS
 */


// ((exports) => {
const root = '.enter-tab ';

exports.init = () => {
    $(document.forms['login-form']).on('submit', submit);
    exports.content = U.queryEl(root);
};

exports.refresh = () => {

};

function submit() {
    const form = $(this);

    $('.error', form).html('');
    //        $(":submit", form).button("loading");

    const request = $.ajax({
        url: '/login',
        method: 'POST',
        data: form.serialize(),
        complete() {
            $(':submit', form).button('reset');
        },
        //             statusCode : {
        //                 200 : function() {
        //                 },
        //                 403 : function(jqXHR) {
        //                     var error = JSON.parse(jqXHR.responseText);
        //                     $('.error', form).html(error.message);
        //                 }
        //             }
    });
    request.done((data) => {
        //             //window.location.href = "/chat";
        //             window.location.href = "/nims.html";
        window.location.href = '/page.html';
    });

    request.fail((errorInfo, textStatus, errorThrown) => {
        let msg;
        try {
            msg = UI.handleErrorMsg(JSON.parse(errorInfo.responseText));
        } catch (err) {
            msg = UI.handleErrorMsg(errorInfo.responseText || textStatus || 'error');
        }
        //             var error = JSON.parse(jqXHR.responseText);
        //             $('.error', form).html(error.message);
        //            $('.error', form).html(textStatus);
        $('.error', form).html(msg);
    });

    return false;
}
// })(window.Enter = {});
