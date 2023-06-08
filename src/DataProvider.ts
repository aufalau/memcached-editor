import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ServerItem, SlabItem, KeyItem, MemcachedItem } from './DataItem';
import { MemcachedView } from './MemcachedView';
import * as Memcached from 'memcached';
import { Key } from 'readline';
import { getMemcachedItem, removeMemcachedItem } from './Tools';
import ConnectionConfigStore from './config';
import { memoryUsage } from 'process';

export class DataProvider implements vscode.TreeDataProvider<MemcachedItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MemcachedItem | undefined | null | void> = new vscode.EventEmitter<MemcachedItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MemcachedItem | undefined | null | void> = this._onDidChangeTreeData.event;


    // onDidChangeTreeData?: vscode.Event<void | DataItem | DataItem[] | null | undefined> | undefined;
    private configStore: ConnectionConfigStore;

    serverList: ServerItem[] = [];

    constructor(readonly context: vscode.ExtensionContext) {
        this.configStore = new ConnectionConfigStore(context);
    }

    getTreeItem(element: MemcachedItem): MemcachedItem {
        return element;
    }

    async getChildren(element?: MemcachedItem | undefined): Promise<MemcachedItem[]> {
        if (!element) {
            this.serverList = Object.entries(this.configStore.all()).map(([id, config]) => new ServerItem(config, vscode.TreeItemCollapsibleState.Collapsed));
            return this.serverList;
        }
        return await element.getChildren();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    addServer(): void {
        const [webview, create] = MemcachedView.openSettingsView(this.context);
        if (create) { webview.onDidReceiveMessage((message) => { this.onSettingsViewMessage(webview, message); }); }

    }

    refreshServer(server: ServerItem): void {
        this._onDidChangeTreeData.fire();
    }

    editServer(server: ServerItem): void {
        const [webview, create] = MemcachedView.openSettingsView(this.context);
        if (create) { webview.onDidReceiveMessage((message) => { this.onSettingsViewMessage(webview, message); }); }

        webview.postMessage({ type: "editConnection", data: server.config, result: 0 });
    }

    async deleteServer(server: ServerItem): Promise<void> {
        const res = await vscode.window.showInformationMessage(
            'Do you really want to delete connection?',
            'Yes', 'No'
        );
        if (res === 'Yes') {
            this.configStore.delete(server.server);
            this.refresh();
        }
    }

    refreshSlab(item: SlabItem) {
        this.refresh();
    }

    openServer(item: ServerItem) {
        const [webview, create] = MemcachedView.openDataView(this.context);
        if (create) { webview.onDidReceiveMessage((message) => { this.onDataViewMessage(webview, message); }); }

        this.onDataViewMessage(webview, { type: 'syncServer', data: { server: item.server } });
    }

    openSlab(item: SlabItem) {
        const [webview, create] = MemcachedView.openDataView(this.context);
        if (create) { webview.onDidReceiveMessage((message) => { this.onDataViewMessage(webview, message); }); }

        this.onDataViewMessage(webview, { type: 'syncSlab', data: { server: item.server.server, slab: item.slab } });
    }

    openKey(item: KeyItem) {
        const [webview, create] = MemcachedView.openDataView(this.context);
        if (create) { webview.onDidReceiveMessage((message) => { this.onDataViewMessage(webview, message); }); }

        this.onDataViewMessage(webview, { type: 'syncData', data: { server: item.server.server, slab: item.slab.slab, key: item.key } });
    }

    onDidChangeSelection(evt: vscode.TreeViewSelectionChangeEvent<MemcachedItem>) {
        if (evt.selection.length > 0) {
            const treeItem = evt.selection[0]; // assumes a single selection
            const command = treeItem.command;

            if (command) {
                vscode.commands.executeCommand(command.command, treeItem);
            }
        }
    }


    onSettingsViewMessage(webview: vscode.Webview, message: any): void {
        if (message.type === "testConnection") {
            MemcachedView.testConnection(message.data.host, message.data.port, (result) => {
                // webview.postMessage({type:"testConnection", result});
                vscode.window.showInformationMessage(result === 0 ? 'Connection Successed!' : 'Connection Failed!');
            });
        } else if (message.type === "connectServer") {
            if (this.serverList.find(elem => elem.server === `${message.data.host}:${message.data.port}`)) { return; }
            MemcachedView.connectServer(message.data.host, message.data.port, message.data.username, message.data.password, (result: number) => {
                if (result >= 0) {
                    vscode.window.showInformationMessage('Connection Successed!');
                    this.configStore.set(message.data);
                    this.refresh();
                } else {
                    vscode.window.showInformationMessage('Connection Failed!');
                }
            });
        }
    }

    onDataViewMessage(webview: vscode.Webview, message: any): void {
        if (message.type === "syncServer") {
            const server = this.serverList.find((v, idx, obj)=>v.server === message.data.server);
            server?.getChildren().then(children=>{
                const slabs:string[] = children.map((child) => (child as SlabItem).slab);
                webview.postMessage({ type: "syncServer", node: { server: message.data.server}, data: slabs, result: 0 });
            }).catch(e=>{
                webview.postMessage({ type: "syncServer", node: { server: message.data.server}, data: [], result: 1 });
            });
        }
        else if (message.type === "syncSlab") {
            const server = this.serverList.find((v, idx, obj)=>v.server === message.data.server);
            server?.getChildren().then(children=>{
                const child = children.find((s, idx, obj)=>(s as SlabItem).slab === message.data.slab) as SlabItem;
                child?.getChildren().then(values=>{
                    const keys: string[] = values.map((k)=>(k as KeyItem).key);
                    webview.postMessage({ type: "syncSlab", node: { server: message.data.server, slab: message.data.slab}, data: keys, result: 0 });
                }).catch(e=>{
                    webview.postMessage({ type: "syncSlab", node: { server: message.data.server, slab: message.data.slab}, data: [], result: 1 });
                });
            }).catch(e=>{
                webview.postMessage({ type: "syncSlab", node: { server: message.data.server, slab: message.data.slab}, data: [], result: 1 });
            });
        }
        else if (message.type === "syncData") {
            getMemcachedItem(message.data.server.name, message.data.slab.name, message.data.key).then((data) => {
                webview.postMessage({ type: "syncData", node: { server: message.data.server, slab: message.data.slab, key: message.data.key }, data: data, result: 0 });
            }).catch((err) => {
                webview.postMessage({ type: "syncData", node: { server: message.data.server, slab: message.data.slab, key: message.data.key }, data: err, result: 1 });
            });
        } else if (message.type === "removeKey") {
            removeMemcachedItem(message.data.server.name, message.data.slab.name, message.data.key).then((data) => {
                webview.postMessage({ type: "removeKey", node: { server: message.data.server, slab: message.data.slab, key: message.data.key }, data: data, result: data ? 0 : 1 });
                if (data) { this.refresh(); }
            }).catch((err) => {
                webview.postMessage({ type: "removeKey", node: { server: message.data.server, slab: message.data.slab, key: message.data.key }, data: err, result: 1 });
            });
        }
    }
}