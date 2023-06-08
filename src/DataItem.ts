import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getMemcachedItem, getMemcachedItems, getMemcachedSlabs } from './Tools';
import { ConnectionConfig } from './config';

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

    command: vscode.Command = {
        title: 'View',
        tooltip: 'Click',
        command: 'memcached.server.operator',
        arguments: []
    };

    get server():string{
        return `${this.config.host}:${this.config.port}`;
    }

    constructor(
        public config: ConnectionConfig,
        public collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(`${config.host}:${config.port}`, collapsibleState);
        this.tooltip = undefined;
        this.description = undefined;
    }
    async getChildren(): Promise<MemcachedItem[]> {
        const items = await getMemcachedSlabs(this.server);

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

    command: vscode.Command = {
        title: 'View',
        tooltip: 'Click',
        command: 'memcached.slab.operator',
        arguments: []
    };

    get server():ServerItem{
        return this.parent;
    }

    // get slab():string{
    //     return this.slabid;
    // }

    constructor(
        public slab: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public parent: ServerItem,
        public childCount: number
    ) {
        super(slab, collapsibleState);
        this.tooltip = undefined;
        this.description = undefined;
    }
    async getChildren(): Promise<MemcachedItem[]> {
        const items = await getMemcachedItems(this.parent.server, this.slab, this.childCount);

        var children: KeyItem[] = [];
        items.forEach(item => {
            children.push(new KeyItem(item, vscode.TreeItemCollapsibleState.None, this ));
        });

        children = children.sort((a, b)=>a.key>b.key?1:(a.key<b.key?-1:0));
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

    get server():ServerItem{
        return this.parent.server;
    }

    get slab():SlabItem{
        return this.parent;
    }

    // get key():string{
    //     return this.key;
    // }

    constructor(
        public key: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public parent: SlabItem
    ) {
        super(key, collapsibleState);

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
