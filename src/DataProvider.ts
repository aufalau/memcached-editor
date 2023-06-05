import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ServerItem, SlabItem, KeyItem, MemcachedItem } from './DataItem';
import { SettingsView } from './SettingsView';
import * as Memcached from 'memcached';

export class DataProvider implements vscode.TreeDataProvider<MemcachedItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MemcachedItem | undefined | null | void> = new vscode.EventEmitter<MemcachedItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MemcachedItem | undefined | null | void> = this._onDidChangeTreeData.event;


    // onDidChangeTreeData?: vscode.Event<void | DataItem | DataItem[] | null | undefined> | undefined;

    serverList: MemcachedItem[] = [];

    constructor(readonly context: vscode.ExtensionContext) {
    }

    getTreeItem(element: MemcachedItem): MemcachedItem {
        return element;
    }

    async getChildren(element?: MemcachedItem | undefined): Promise<MemcachedItem[]> {
        if (!element) {
            return this.serverList;
        }
        return await element.getChildren();
    }

    // getParent?(element: MemcachedItem): vscode.ProviderResult<MemcachedItem> {
    //     throw new Error('Method not implemented.');
    // }

    // resolveTreeItem?(item: vscode.TreeItem, element: MemcachedItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
    //     throw new Error('Method not implemented.');
    // }

    refresh(): void {
        vscode.window.showInformationMessage(`Successfully called refresh entry.`);
    }

    addServer(): void {
        vscode.window.showInformationMessage(`Successfully called addServer entry.`);
        const webview = SettingsView.openView(this.context);
        // vscode.window.createWebviewPanel()
        webview.onDidReceiveMessage((message) => { this.onDidReceiveMessage(webview, message); });

    }

    refreshServer(server: ServerItem): void {
        vscode.window.showInformationMessage(`Successfully called refreshServer entry.${server}`);
    }

    editServer(server: ServerItem): void {
        vscode.window.showInformationMessage(`Successfully called editServer entry.${server}`);
    }

    deleteServer(server: ServerItem): void {
        vscode.window.showInformationMessage(`Successfully called deleteServer entry.${server}`);

        this.serverList = this.serverList.filter(s => s.label !== server.label);
        this._onDidChangeTreeData.fire();
    }

    onDidReceiveMessage(webView: vscode.Webview, message: any): void {
        if (message.type === "testConnection") {
            SettingsView.testConnection(message.data.host, message.data.port, (result) => {
                // webView.postMessage({type:"testConnection", result});
                vscode.window.showInformationMessage(result === 0 ? 'Connection Successed!' : 'Connection Failed!');
            });
        } else if (message.type === "connectServer") {
            if (this.serverList.find(elem => elem.label === `${message.data.host}:${message.data.port}`)) { return; }
            SettingsView.connectServer(message.data.host, message.data.port, message.data.username, message.data.password, (result: number) => {
                if (result >= 0) {
                    vscode.window.showInformationMessage('Connection Successed!');
                    this.serverList.push(new ServerItem(`${message.data.host}:${message.data.port}`, vscode.TreeItemCollapsibleState.Collapsed, undefined));
                    this._onDidChangeTreeData.fire();
                } else {
                    vscode.window.showInformationMessage('Connection Failed!');
                }
            });

        }
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
}