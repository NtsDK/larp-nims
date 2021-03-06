/*Copyright 2017 Timofey Rechkalov <ntsdk@yandex.ru>, Maria Sidekhmenova <matilda_@list.ru>

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


//const R = require('ramda');
const ProfileEditorCore = require('../profiles2/profileEditorCore');

// ((exports) => {
const root = '.player-tab ';
const characterProfileDiv = `${root}.character-profile-div`;
const playerProfileDiv = `${root}.player-profile-div`;
const playerHeader = `${root}.player-profile-header`;
const characterHeader = `${root}.character-profile-header`;

let profileEditorCore;

exports.init = () => {
    profileEditorCore = ProfileEditorCore.makeProfileEditorCore();
    exports.content = U.queryEl(root);
};

exports.refresh = () => {
    Promise.all([
        DBMS.getWelcomeText(),
        DBMS.getPlayerProfileInfo(),
        DBMS.getPlayersOptions(),
    ]).then((results) => {
        const [text, profileInfo, playersOptions] = results;
        buildInterface(text, profileInfo, playersOptions);
    }).catch(UI.handleError);
};

function isEditable(profileName, profileStructure) {
    return R.find(R.propEq('name', profileName), profileStructure).playerAccess === 'write';
}

function buildInterface(text, profileInfo, playersOptions) {
    profileEditorCore.initProfileStructure(playerProfileDiv, 'player', profileInfo.player.profileStructure);
    profileEditorCore.fillProfileInformation(playerProfileDiv, 'player', profileInfo.player.profile, isEditable);
    U.addEl(U.clearEl(U.queryEl(playerHeader)), U.makeText(CU.strFormat(L10n.getValue('briefings-player-profile'), [profileInfo.player.profile.name])));

    if (profileInfo.character === undefined) {
        U.addEl(U.clearEl(U.queryEl(characterHeader)), U.makeText(CU.strFormat(L10n.getValue('briefings-character-profile'), [''])));
        const el = U.clearEl(U.queryEl(characterProfileDiv));
        if (playersOptions.allowCharacterCreation) {
            const label = U.addEl(U.makeEl('div'), U.makeText(L10n.getValue('profiles-player-has-no-character-and-can-create-it')));
            U.addClass(label, 'margin-bottom-8');
            const input = U.setAttr(U.makeEl('input'), 'placeholder', L10n.getValue('profiles-character-name'));
            U.addClass(input, 'form-control margin-bottom-8');
            const button = U.addEl(U.makeEl('button'), U.makeText(L10n.getValue('common-create')));
            U.addClass(button, 'btn btn-default');
            U.listen(button, 'click', () => {
                DBMS.createCharacterByPlayer({ characterName: input.value.trim() }).then(exports.refresh, UI.handleError);
            });
            U.addEls(el, [label, input, button]);
        } else {
            U.addEl(el, U.addEl(U.makeEl('span'), U.makeText(L10n.getValue('profiles-player-has-no-character-and-cant-create-it'))));
        }
    } else {
        profileEditorCore.initProfileStructure(characterProfileDiv, 'character', profileInfo.character.profileStructure);
        profileEditorCore.fillProfileInformation(characterProfileDiv, 'character', profileInfo.character.profile, isEditable);
        U.addEl(U.clearEl(U.queryEl(characterHeader)), U.makeText(CU.strFormat(L10n.getValue('briefings-character-profile'), [profileInfo.character.profile.name])));
    }

    U.queryEl(`${root}.welcome-text-area`).value = text;
}
// })(window.Player = {});
