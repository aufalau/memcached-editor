import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ServerItem, SlabItem, KeyItem, MemcachedItem } from './DataItem';
import { MemcachedView } from './MemcachedView';
import * as Memcached from 'memcached';
import { Key } from 'readline';
import { getMemcachedItem, getMemcachedItems, getMemcachedSlabs, removeMemcachedItem, setMemcachedItem } from './Tools';
import { ConnectionConfig, ConnectionConfigStore } from './config';
import { memoryUsage } from 'process';
import { Server } from 'http';

export class DataProvider implements vscode.TreeDataProvider<MemcachedItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MemcachedItem | undefined | null | void> = new vscode.EventEmitter<MemcachedItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MemcachedItem | undefined | null | void> = this._onDidChangeTreeData.event;


    // onDidChangeTreeData?: vscode.Event<void | DataItem | DataItem[] | null | undefined> | undefined;
    private configStore: ConnectionConfigStore;

    serverList: ServerItem[] = [];
    treeView: vscode.TreeView<MemcachedItem> | undefined = undefined;

    constructor(readonly context: vscode.ExtensionContext) {
        this.configStore = new ConnectionConfigStore(context);
    }

    getTreeItem(element: MemcachedItem): MemcachedItem {
        return element;
    }

    async getChildren(element?: MemcachedItem | undefined): Promise<MemcachedItem[]> {
        if (!element) {
            this.serverList = Object.entries(this.configStore.all()).map(([id, config]) => new ServerItem(config, vscode.TreeItemCollapsibleState.Collapsed));
            console.log(this.serverList);
            return this.serverList;
        }
        return await element.getChildren();
    }

    getParent(element: MemcachedItem): vscode.ProviderResult<MemcachedItem> {
        if (!element) { return null; }
        return element.getParent();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    addServer(): void {
        const [webview, create] = MemcachedView.openSettingsView(this.context);
        if (create) { webview.onDidReceiveMessage((message) => { this.onSettingsViewMessage(webview, message); }); }
    }

    refreshServer(server: ServerItem): void {
        this.refresh();
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

    pickItem(server?: string, slab?: string, key?: string) {
        let item: MemcachedItem | undefined = undefined;
        if (server) {
            item = this.serverList.find((v, idx, obj) => v.server === server);
            if (slab) {
                item = (item as ServerItem)?.findChild(slab);
                if (key) {
                    item = (item as SlabItem)?.findChild(key);
                }
            }
        }

        if (this.treeView && item) {
            const command = item.command;

            if (command) {
                vscode.commands.executeCommand(command.command, item);
            }

            this.treeView.reveal(item, { select: true, focus: true, expand: true });
        }
    }

    openServer(item: ServerItem | undefined) {
        if (!item) { return; }
        const [webview, create] = MemcachedView.openDataView(this.context);
        if (create) {
            webview.onDidReceiveMessage((message) => {
                this.onDataViewMessage(webview, message);
            });
        }

        this.onDataViewMessage(webview, { type: 'syncServer', data: { server: item.server } });
    }

    openSlab(item: SlabItem | undefined) {
        if (!item) { return; }
        const [webview, create] = MemcachedView.openDataView(this.context);
        if (create) {
            webview.onDidReceiveMessage((message) => {
                this.onDataViewMessage(webview, message);
            });
        }

        this.onDataViewMessage(webview, { type: 'syncSlab', data: { server: item.server, slab: item.slab } });
    }

    openKey(item: KeyItem | undefined) {
        if (!item) { return; }
        const [webview, create] = MemcachedView.openDataView(this.context);
        if (create) {
            webview.onDidReceiveMessage((message) => {
                this.onDataViewMessage(webview, message);
            });
        }

        this.onDataViewMessage(webview, { type: 'syncKey', data: { server: item.server, slab: item.slab, key: item.key } });
    }

    removeKey(item: KeyItem | undefined) {
        if (!item) { return; }
        const [webview, create] = MemcachedView.openDataView(this.context);
        if (create) {
            webview.onDidReceiveMessage((message) => {
                this.onDataViewMessage(webview, message);
            });
        }

        this.onDataViewMessage(webview, { type: 'removeKey', data: { server: item.server, slab: item.slab, key: item.key } });
    }

    onDidChangeSelection(evt: vscode.TreeViewSelectionChangeEvent<MemcachedItem>) {
        if (evt.selection.length > 0) {
            const treeItem = evt.selection[0]; // assumes a single selection
            const command = treeItem.command;

            if (command) {
                vscode.commands.executeCommand(command.command, treeItem);
            }

            if (this.treeView) {
                this.treeView.reveal(treeItem, { select: true, focus: true, expand: true });
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
                    this.configStore.set(new ConnectionConfig(message.data));
                    this.refresh();
                } else {
                    vscode.window.showInformationMessage('Connection Failed!');
                }
            });
        }
    }

    onDataViewMessage(webview: vscode.Webview, message: any): void {
        console.log(message);
        if (message.type === "pickItem") {
            this.pickItem(message.data.server, message.data.slab, message.data.key);
        }
        else if (message.type === "syncServer") {
            getMemcachedSlabs(message.data.server).then(slabids => {
                const slabs = slabids.map((slab) => slab.slabid);
                webview.postMessage({ type: "syncServer", node: { server: message.data.server }, data: slabs.sort(), result: 0 });
            }).catch((err) => {
                webview.postMessage({ type: "syncServer", node: { server: message.data.server }, err: err.message, result: 1 });
            });
        }
        else if (message.type === "syncSlab") {
            getMemcachedItems(message.data.server, message.data.slab, 0).then(keys => {
                webview.postMessage({ type: "syncSlab", node: { server: message.data.server, slab: message.data.slab }, data: keys.sort(), result: 0 });
            }).catch((err) => {
                webview.postMessage({ type: "syncSlab", node: { server: message.data.server, slab: message.data.slab }, err: err.message, result: 1 });
            });
        }
        else if (message.type === "syncKey") {
            getMemcachedItem(message.data.server, message.data.key).then((data) => {
                webview.postMessage({ type: "syncKey", node: { server: message.data.server, slab: message.data.slab, key: message.data.key }, data: data, result: 0 });
            }).catch((err) => {
                webview.postMessage({ type: "syncKey", node: { server: message.data.server, slab: message.data.slab, key: message.data.key }, err: err.message, result: 1 });
            });
        }
        else if (message.type === "removeKey") {
            removeMemcachedItem(message.data.server, message.data.key).then((data) => {
                setTimeout(() => {
                    webview.postMessage({ type: "removeKey", node: { server: message.data.server, slab: message.data.slab, key: message.data.key }, data: data, result: data ? 0 : 1 });
                    if (data) { this.refresh(); }
                }, 1000);
            }).catch((err) => {
                webview.postMessage({ type: "removeKey", node: { server: message.data.server, slab: message.data.slab, key: message.data.key }, err: err.message, result: 1 });
            });
        }
        else if (message.type === "setKey") {
            setMemcachedItem(message.data.server, message.data.key, message.data.value, 0).then((data) => {
                var slab: string = "-1";
                this.serverList.forEach(s => s.children.forEach(l => { if (l.findChild(message.data.key)) { slab = l.slab; } }));
                setTimeout(() => {
                    webview.postMessage({ type: "setKey", node: { server: message.data.server, slab, key: message.data.key }, data: message.data.value, result: data ? 0 : 1 });
                    if (data) { this.refresh(); }
                }, 1000);
            }).catch((err) => {
                var slab: string = "-1";
                this.serverList.forEach(s => s.children.forEach(l => { if (l.findChild(message.data.key)) { slab = l.slab; } }));
                webview.postMessage({ type: "setKey", node: { server: message.data.server, slab, key: message.data.key }, err: err.message, result: 1 });
            });
        }
        else if (message.type === "searchKey") {
            var slab: string = "-1";
            this.serverList.forEach(s => s.children.forEach(l => { if (l.findChild(message.data.key)) { slab = l.slab; } }));
            getMemcachedItem(message.data.server, message.data.key).then((data) => {
                webview.postMessage({ type: "syncKey", node: { server: message.data.server, slab, key: message.data.key }, data: data, result: 0 });
            }).catch((err) => {
                webview.postMessage({ type: "syncKey", node: { server: message.data.server, slab, key: message.data.key }, err: err.message, result: 1 });
            });
        }
    }
}