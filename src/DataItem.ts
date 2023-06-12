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
    abstract getParent(): MemcachedItem | null;
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

    children: SlabItem[] = [];

    get host(): string{
        return this.config.host;
    }

    get port(): string{
        return this.config.port;
    }

    get server(): string {
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

    findChild(label: string): SlabItem | undefined {
        return this.children.find((v, idx, arr) => v.label === label);
    }

    async getChildren(): Promise<SlabItem[]> {
        const items = await getMemcachedSlabs(this.server);

        this.children = [];
        items.forEach(item => {
            this.children.push(new SlabItem(item.slabid, vscode.TreeItemCollapsibleState.Collapsed, this, item.count));
        });

        console.log(this.children);
        return this.children;
    }

    getParent(): MemcachedItem | null {
        return null;
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

    children: KeyItem[] = [];

    get server(): string {
        return this.parent.server;
    }

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

    findChild(label: string): KeyItem | undefined {
        return this.children.find((v, idx, arr) => v.label === label);
    }

    async getChildren(): Promise<KeyItem[]> {
        const items = await getMemcachedItems(this.parent.server, this.slab, this.childCount);

        this.children = [];
        items.forEach(item => {
            this.children.push(new KeyItem(item, vscode.TreeItemCollapsibleState.None, this));
        });

        this.children = this.children.sort((a, b) => a.key > b.key ? 1 : (a.key < b.key ? -1 : 0));

        console.log(this.children);
        
        return this.children;
    }

    getParent(): MemcachedItem | null {
        return this.parent;
    }
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

    get server(): string {
        return this.parent.server;
    }

    get slab(): string {
        return this.parent.slab;
    }

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

    getParent(): MemcachedItem | null {
        return this.parent;
    }
}

export enum ItemType {
    itemServer = "server",
    itemSlab = "slab",
    itemKey = "key",
}
