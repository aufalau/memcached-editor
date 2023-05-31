import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getMemcachedItems, getMemcachedSlabs } from './Tools';
import { ThemeIcon } from 'vscode';

export class DataItem extends vscode.TreeItem {

    constructor(
        public label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public itemType: ItemType,
        public extra:any,
        public children?: DataItem[],
        public command?: vscode.Command
    ) {
        super(label, collapsibleState);

        this.tooltip = undefined;
        this.description = undefined;
        if (this.itemType === ItemType.itemServer) {
            this.iconPath = {
                light: path.join(__filename, '..', '..', 'resources', 'icon.svg'),
                dark: path.join(__filename, '..', '..', 'resources', 'icon.svg')
            };
        }
        else if(this.itemType === ItemType.itemSlab){
            this.iconPath = new ThemeIcon('database');
        }
        else {
            this.iconPath = new ThemeIcon('key');
        }
    }

    onKeys(key: string) {
        if (!this.children) {
            this.children = [];
        }
        const child = this.children.find(c => c.label === key);
        if (!child) {
            this.children.push(new DataItem(key, vscode.TreeItemCollapsibleState.None, ItemType.itemKey, undefined));
        }
    }

    async getChildren(): Promise<DataItem[]> {
        if (this.itemType === ItemType.itemServer) {
            const items = await getMemcachedSlabs(this.label);

            var children: DataItem[] = [];
            items.forEach(item => {
                children.push(new DataItem(item.slabid, vscode.TreeItemCollapsibleState.Collapsed, ItemType.itemSlab, {server:this.label, count:item.count}));
            });
            return children;
        } else if (this.itemType === ItemType.itemSlab) {
            const items = await getMemcachedItems(this.extra.server, this.label, this.extra.count);

            var children: DataItem[] = [];
            items.forEach(item => {
                children.push(new DataItem(item, vscode.TreeItemCollapsibleState.None, ItemType.itemKey, {server:this.extra.server}));
            });
            return children;
        }
        return [];
    }
}

export enum ItemType {
    itemServer = 0,
    itemSlab = 1,
    itemKey = 2,
}