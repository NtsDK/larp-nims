
import ReactDOM from 'react-dom';
import { getRoleGridTemplate } from "./RoleGridTemplate.jsx";
import { makeProfileTable } from "../commons/uiCommons";
import { UI, U, L10n } from 'nims-app-core';

const root = '.role-grid-tab ';

export class RoleGrid {

    groupingOrder;
    profilesData;
    buttons;
    content;

    constructor({L10n, DBMS}) {
        this.renderGroupStructure = this.renderGroupStructure.bind(this);
        this.calcSize = this.calcSize.bind(this);
        this.L10nObj = L10n;
        this.DBMSObj = DBMS;
        this.l10n = L10n.get('role-grid');
    }

    getContent(){
        return this.content;
    }

    init(){
        this.content = U.makeEl('div');
        U.addEl(U.qe('.tab-container'), this.content);
        ReactDOM.render(getRoleGridTemplate(), this.content);
        this.L10nObj.localizeStatic(this.content);
        this.content = U.queryEl(root);
    };

    refresh(){
        this.DBMSObj.getRoleGridInfo().then((data2) => {
            this.groupingOrder = [];
            this.buttons = [];

            U.showEl(U.qe(`${root} .alert.no-character-profile`), data2.characterProfileStructure.length === 0);
            U.showEl(U.qe(`${root} .alert.no-characters`), data2.profileData.length === 0);

            U.showEl(U.qe(`${root} > .container-fluid`), data2.profileData.length !== 0 && data2.characterProfileStructure.length !== 0);

            // hack - dynamically replace checkbox with enum
            const checkboxes = data2.characterProfileStructure.filter(el => el.type === 'checkbox').map(R.prop('name'));
            data2.characterProfileStructure = data2.characterProfileStructure.map((el) => {
                if (el.type === 'checkbox') {
                    return {
                        doExport: el.doExport,
                        name: el.name,
                        playerAccess: el.playerAccess,
                        showInRoleGrid: el.showInRoleGrid,
                        type: 'enum',
                        value: [this.L10nObj.get('constant', 'yes'), this.L10nObj.get('constant', 'no')].join(','),
                    };
                }
                return el;
            });
            this.profilesData = data2;
            data2.profileData.forEach((el) => {
                checkboxes.forEach((name) => {
                    el.character[name] = this.L10nObj.get('constant', el.character[name] === true ? 'yes' : 'no');
                });
            });

            const sorter = CU.charOrdAFactory(a => a.toLowerCase());
            const filter = el => el.type === 'enum';
            const groupingItems = this.profilesData.characterProfileStructure.filter(filter).map(R.prop('name')).sort(sorter);

            U.addEls(U.clearEl(U.queryEl(`${root}.button-container`)), groupingItems.map((item, i) => {
                const button = U.addEl(U.makeEl('a'), U.makeText(item));
                button.item = item;
                U.setAttr(button, 'draggable', 'true');
                U.setAttr(button, 'role', 'button');
                U.setAttr(button, 'href', '#');
                U.setAttr(button, 'order', i + 1);
                U.setStyle(button, 'order', i + 1);
                U.addClasses(button, ['btn', 'btn-default']);
                U.listen(button, 'dragstart', this.onDragStart);
                U.listen(button, 'drop', this.onDrop(this));
                U.listen(button, 'dragover', this.allowDrop);
                U.listen(button, 'dragenter', this.handleDragEnter);
                U.listen(button, 'dragleave', this.handleDragLeave);
                U.listen(button, 'click', () => {
                    U.toggleClass(button, 'btn-primary');
                    this.drawList();
                });
                this.buttons.push(button);
                return button;
            }));

            this.drawList();
            //            drawPlainPanelList();
        }).catch(UI.handleError);
    };

    // eslint-disable-next-line no-var,vars-on-top
    onDragStart(event) {
        console.log(`onDragStart ${this.item}`);
        event.dataTransfer.setData('data', JSON.stringify({ item: this.item, order: U.getAttr(this, 'order') }));
        event.dataTransfer.effectAllowed = 'move';
    };

    // eslint-disable-next-line no-var,vars-on-top
    onDrop(that) {
        return function(event) {
            console.log(`onDrop ${this.item}${event.dataTransfer.getData('data')}`);
            if (event.stopPropagation) {
                event.stopPropagation(); // stops the browser from redirecting.
            }
            that.updateButtons(JSON.parse(event.dataTransfer.getData('data')), { item: this.item, order: U.getAttr(this, 'order') });
        }
    };

    // eslint-disable-next-line no-var,vars-on-top
    allowDrop(event) {
        console.log(`allowDrop ${this.item}`);
        event.preventDefault();
    };

    handleDragEnter(event) {
        U.addClass(this, 'over');
    }

    handleDragLeave(event) {
        U.removeClass(this, 'over');
    }

    // eslint-disable-next-line no-var,vars-on-top
    updateButtons(dragStarter, dragReceiver){
        const startOrder = Number(dragStarter.order) - 1;
        const receiveOrder = Number(dragReceiver.order) - 1;
        const button = this.buttons.splice(startOrder, 1)[0];
        this.buttons = R.insert(receiveOrder, button, this.buttons);
        this.buttons.forEach((button2, i) => {
            U.setAttr(button2, 'order', i + 1);
            U.setStyle(button2, 'order', i + 1);
        });
        this.drawList();
    };

    // eslint-disable-next-line no-var,vars-on-top
    drawList(){
        this.groupingOrder = this.buttons.filter(U.hasClass(R.__, 'btn-primary')).map(R.prop('item'));
        this.drawGroupedList((this.groupingOrder.length > 0) ? this.getTreeByUserSelect() : this.getTreeByAlphabet());
        //        (this.groupingOrder.length > 0) ? this.drawGroupedList() : drawPlainPanelList();
    };

    // eslint-disable-next-line no-var,vars-on-top
    //        var groups = R.groupBy((profile) => {
    //            return profile.characterName[0];
    //        }, this.profilesData.profileData);
    //
    //        var structures = R.toPairs(groups).map(pair => ({
    //            key: pair[0],
    //            lastKeyPart: pair[0],
    //            groups: pair[1]
    //        }));
    //
    //        structures.sort(CU.charOrdAFactory(R.prop('key')));
    //        return structures;
    // eslint-disable-next-line no-var,vars-on-top
    getTreeByAlphabet(){
        return [{
            key: this.l10n('all-characters'),
            lastKeyPart: this.l10n('all-characters'),
            groups: this.profilesData.profileData
        }];
    }

    // eslint-disable-next-line no-var,vars-on-top
    getTreeByUserSelect(){
        const groups = R.groupBy(profile => this.groupingOrder.map(name => profile.character[name]).join('/'), this.profilesData.profileData);

        const groupingItemInfo = R.indexBy(R.prop('name'), this.profilesData.characterProfileStructure.filter(el => R.contains(el.name, this.groupingOrder)));

        return [{
            key: this.l10n('all-characters'),
            lastKeyPart: this.l10n('all-characters'),
            children: this.makeGroupTree(groups, groupingItemInfo, 0, [])
        }];
    };

    //            var filter = el => el.type === 'enum' || el.type === 'checkbox';

    // eslint-disable-next-line no-var,vars-on-top
    drawGroupedList(structures){
        //        structures = [{
        //            "key": this.l10n('all-characters'),
        //            "lastKeyPart": this.l10n('all-characters'),
        //            "children": structures
        //        }];
        //        console.log(JSON.stringify(structures));

        structures.forEach(this.calcSize);

        // U.addEl(U.queryEl(root + '.group-content'), U.addEls(U.addClasses(U.makeEl('ul'), ['remove-ul-dots', 'zero-padding']),
        // this.makeGroupTree(groups, groupingItemInfo, 0, [])));
        U.addEl(U.clearEl(U.queryEl(`${root}.group-content`)), U.addEls(U.addClasses(
            U.makeEl('ul'),
            ['remove-ul-dots', 'zero-padding']
        ), R.flatten(structures.map(this.renderGroupStructure))));
    };

    makeHeader(text, characterNum, playerNum){
        const characterBadge = U.addEl(U.addClass(U.makeEl('span'), 'badge'), U.makeText(`${characterNum} / ${playerNum}`));
        U.setAttr(characterBadge, 'title', this.L10nObj.format('role-grid', 'badge-title', [characterNum, playerNum]));
        //        const playerBadge = U.addEl(U.addClass(U.makeEl('span'), 'badge'), U.makeText(playerNum));

        const h3 = U.addEls(U.addClass(U.makeEl('h3'), 'panel-title'), [U.makeText(` ${text} `), characterBadge]);
        const a = U.setAttr(U.makeEl('a'), 'href', '#/');
        U.setAttr(a, 'tree-panel-toggler', '');
        const heading = U.addEl(U.addClass(U.makeEl('div'), 'panel-heading'), U.addEls(a, [h3]));
        return U.addEl(U.addClasses(U.makeEl('div'), ['panel', 'panel-default', 'inline-panel']), heading);
        // var heading = U.addEl(U.addClass(U.makeEl('div'), 'panel-heading'),
        //      U.addEl(U.addClass(U.makeEl('h3'), 'panel-title'), U.makeText(text)));
        // return U.addEl(U.addClasses(U.makeEl('div'), ['panel', 'panel-default']), heading);
    };

    // eslint-disable-next-line no-var,vars-on-top
    calcSize(el){
        if (el.children) {
            el.children.forEach(this.calcSize);
            el.characterNum = R.sum(el.children.map(R.prop('characterNum')));
            el.playerNum = R.sum(el.children.map(R.prop('playerNum')));
        } else { // groups
            el.characterNum = el.groups.length;
            el.playerNum = el.groups.filter(R.pipe(R.prop('playerName'), R.isNil, R.not)).length;
        }
    };

    // eslint-disable-next-line no-var,vars-on-top
    renderGroupStructure(el){
        //        return R.flatten(structure.map(el => {
        let domChildren, header;
        if (el.children) {
            domChildren = U.addEls(U.addClass(U.makeEl('ul'), 'remove-ul-dots'), R.flatten(el.children.map(this.renderGroupStructure)));
            header = this.makeHeader(el.lastKeyPart, el.characterNum, el.playerNum);
            UI.attachPanelToggler(U.queryElEl(header, 'a'), domChildren);
            return R.concat([U.addEl(U.makeEl('li'), header)], [domChildren]);
        } // groups
        //            var panelList = this.makePanelList(el.groups).map(U.addClasses(R.__,['inline-panel']));
        const panelList = this.makePanelList(el.groups).map(U.addClasses(R.__, ['inline-panel', 'col-xs-6']));
        //            var panelList = this.makePanelList(el.groups).map(U.addClasses(R.__,['inline-panel', 'col-xs-4']));
        const row = U.addClass(U.makeEl('div'), 'row');
        const container = U.addEl(U.addClass(U.makeEl('div'), 'list-content-padding container-fluid'), row);
        domChildren = U.addEls(row, panelList);
        header = this.makeHeader(el.key, el.characterNum, el.playerNum);
        UI.attachPanelToggler(U.queryElEl(header, 'a'), container);
        return R.concat([U.addEl(U.makeEl('li'), header)], [container]);
        // var container = U.addClass(U.makeEl('div'), 'list-content-padding container-fluid');
        // domChildren = U.addEls(container, panelList);
        // return R.concat([U.addEl(U.makeEl('li'), this.makeHeader(el.key, el.characterNum, el.playerNum))], [domChildren]);


        //        }));
    };

    // eslint-disable-next-line no-var,vars-on-top
    makeGroupTree(groups, groupingItemInfo, index, key){
        const arr = groupingItemInfo[this.groupingOrder[index]].value.split(',').map((name) => {
            const nextKey = R.concat(key, [name]);
            //            var nextKey = R.concat(key, [this.groupingOrder[index] + ': ' + name]);
            const lastKeyPart = `${this.groupingOrder[index]}: ${name}`;
            //            var domChildren;
            if (this.groupingOrder.length !== index + 1) {
                const children = this.makeGroupTree(groups, groupingItemInfo, index + 1, nextKey);
                if (children === null) {
                    return null;
                }
                //                domChildren = [U.addEls(U.addClass(U.makeEl('ul'), 'remove-ul-dots'), children)];
                return {
                    key: nextKey.join(' / '),
                    lastKeyPart,
                    children
                };
            }
            const fullKey = nextKey.join('/');
            if (groups[fullKey] === undefined) {
                return null;
            }
            // domChildren = [U.addEls(U.addClass(U.makeEl('div'), 'list-content-padding'), this.makePanelList(groups[fullKey]))];
            return {
                key: nextKey.join(' / '),
                lastKeyPart,
                groups: groups[fullKey]
            };

            //            return R.concat([U.addEl(U.makeEl('li'), this.makeHeader(name))], domChildren);
            //            return R.concat([U.addEl(U.makeEl('li'), this.makeHeader(nextKey.join(' / ')))], domChildren);
            //            return {
            //                name: nextKey.join(' / '),
            //                children:
            //            }
        }).filter(el => el !== null);
        return arr.length === 0 ? null : arr;
        //        if(arr.length === 0){
        //            return null;
        //        } else {
        //            return R.flatten(arr);
        //        }
    };

    drawPlainPanelList(){
        U.addEls(U.clearEl(U.queryEl(`${root}.group-content`)), this.makePanelList(this.profilesData.profileData));
    };

    // eslint-disable-next-line no-var,vars-on-top
    makePanelList(profileArray){
        return profileArray.sort(CU.charOrdAFactory(a => a.characterName.toLowerCase())).map((profileData) => {
            const tables = [makeProfileTable(Constants, this.profilesData.characterProfileStructure, profileData.character)];
            let title = profileData.characterName;
            if (profileData.playerName !== undefined) {
                tables.push(makeProfileTable(Constants, this.profilesData.playerProfileStructure, profileData.player));
                title += `/${profileData.playerName}`;
            }

            const panelInfo = UI.makePanelCore(U.makeText(title), U.addEls(U.makeEl('div'), tables));
            UI.attachPanelToggler(panelInfo.a, panelInfo.contentDiv, (event, togglePanel) => {
                U.queryEls(`${root}.group-content .expanded[panel-toggler]`).filter(el => !el.contains(event.target)).forEach(el => el.click());
                togglePanel();
            });
            panelInfo.a.click();

            return panelInfo.panel;
        });
    }
}
// export default {
//     init, refresh, getContent
// }