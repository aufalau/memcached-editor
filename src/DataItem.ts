import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getMemcachedItems, getMemcachedSlabs } from './Tools';

export abstract class MemcachedItem extends vscode.TreeItem {
    constructor(
        public label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public extra: any,
        public children?: MemcachedItem[],
        public command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = undefined;
        this.description = undefined;
    }

    abstract getChildren(): Promise<MemcachedItem[]>;
}

export class ServerItem extends MemcachedItem {
    contextValue = ItemType.itemServer;
    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'icon.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'icon.svg')
    };

    constructor(
        public label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public extra: any,
        public children?: MemcachedItem[]
    ) {
        super(label, collapsibleState, extra, children);
    }
    async getChildren(): Promise<MemcachedItem[]> {
        const items = await getMemcachedSlabs(this.label);

        var children: MemcachedItem[] = [];
        items.forEach(item => {
            children.push(new SlabItem(item.slabid, vscode.TreeItemCollapsibleState.Collapsed, { server: this.label, count: item.count }));
        });
        return children;
    }
}

export class SlabItem extends MemcachedItem {
    contextValue = ItemType.itemSlab;
    iconPath = new vscode.ThemeIcon('database');

    constructor(
        public label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public extra: any,
        public children?: MemcachedItem[]
    ) {
        super(label, collapsibleState, extra, children);
    }
    async getChildren(): Promise<MemcachedItem[]> {
        const items = await getMemcachedItems(this.extra.server, this.label, this.extra.count);

        var children: MemcachedItem[] = [];
        items.forEach(item => {
            children.push(new KeyItem(item, vscode.TreeItemCollapsibleState.None, { server: this.extra.server } ));
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

    constructor(
        public label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public extra: any,
        public children?: MemcachedItem[]
    ) {
        super(label, collapsibleState, extra, children, undefined);
    }
    async getChildren(): Promise<MemcachedItem[]> {
        return [];
    }

    onClick(){
        vscode.window.showInformationMessage(`memcached.key.operator ${this.label}`);
    }
}

export enum ItemType {
    itemServer = "server",
    itemSlab = "slab",
    itemKey = "key",
}
