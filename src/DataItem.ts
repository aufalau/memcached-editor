import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getMemcachedItem, getMemcachedItems, getMemcachedSlabs } from './Tools';

export abstract class MemcachedItem extends vscode.TreeItem {
    // constructor(
    //     public label: string,
    //     public collapsibleState: vscode.TreeItemCollapsibleState,
    //     public extra: any,
    //     public children?: MemcachedItem[],
    //     public command?: vscode.Command
    // ) {
    //     super(label, collapsibleState);
    // }

    abstract getChildren(): Promise<MemcachedItem[]>;
}

export class ServerItem extends MemcachedItem {
    contextValue = ItemType.itemServer;
    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'icon.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'icon.svg')
    };
    get server():string{
        return this.label;
    }

    constructor(
        public label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = undefined;
        this.description = undefined;
    }
    async getChildren(): Promise<MemcachedItem[]> {
        const items = await getMemcachedSlabs(this.label);

        var children: MemcachedItem[] = [];
        items.forEach(item => {
            children.push(new SlabItem(item.slabid, vscode.TreeItemCollapsibleState.Collapsed, this, item.count));
        });
        return children;
    }
}

export class SlabItem extends MemcachedItem {
    contextValue = ItemType.itemSlab;
    iconPath = new vscode.ThemeIcon('database');

    get server():string{
        return this.parent.server;
    }

    get slab():string{
        return this.label;
    }

    constructor(
        public label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public parent: ServerItem,
        public childCount: number
    ) {
        super(label, collapsibleState);
        this.tooltip = undefined;
        this.description = undefined;
    }
    async getChildren(): Promise<MemcachedItem[]> {
        const items = await getMemcachedItems(this.parent.label, this.label, this.childCount);

        var children: MemcachedItem[] = [];
        items.forEach(item => {
            children.push(new KeyItem(item, vscode.TreeItemCollapsibleState.None, this ));
        });
        return children;
    }

    // onKeys(key: string) {
    //     if (!this.children) {
    //         this.children = [];
    //     }
    //     const child = this.children.find(c => c.label === key);
    //     if (!child) {
    //         this.children.push(new KeyItem(key, vscode.TreeItemCollapsibleState.None, undefined));
    //     }
    // }
}

export class KeyItem extends MemcachedItem {
    contextValue = ItemType.itemKey;
    iconPath = new vscode.ThemeIcon('key');

    command: vscode.Command = {
        title: 'View',
        tooltip: 'Click',
        command: 'memcached.key.operator',
        arguments: []
    };

    get server():string{
        return this.parent.server;
    }

    get slab():string{
        return this.parent.slab;
    }

    get key():string{
        return this.label;
    }

    constructor(
        public label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public parent: SlabItem
    ) {
        super(label, collapsibleState);

        this.tooltip = undefined;
        this.description = undefined;
    }
    async getChildren(): Promise<MemcachedItem[]> {
        return [];
    }
}

export enum ItemType {
    itemServer = "server",
    itemSlab = "slab",
    itemKey = "key",
}
