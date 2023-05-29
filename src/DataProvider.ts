import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ItemType, DataItem } from './DataItem';
import { SettingsView } from './SettingsView';

export class DataProvider implements vscode.TreeDataProvider<DataItem> {
    onDidChangeTreeData?: vscode.Event<void | DataItem | DataItem[] | null | undefined> | undefined;

    serverList = [
        new DataItem('Server 1', vscode.TreeItemCollapsibleState.Collapsed, ItemType.itemServer),
        new DataItem('Server 2', vscode.TreeItemCollapsibleState.Collapsed, ItemType.itemServer, [new DataItem('Data 1', vscode.TreeItemCollapsibleState.None, ItemType.itemKey)])
    ];

    constructor(readonly context: vscode.ExtensionContext) {
    }

    getTreeItem(element: DataItem): DataItem{
        return element;
    }

    getChildren(element?: DataItem | undefined): DataItem[]{
        if (!element) {
            return this.serverList;
        }
        return element.children || [];
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

    addServer(): void{
        vscode.window.showInformationMessage(`Successfully called add entry.`);
        const webview = SettingsView.openView(this.context);
        // vscode.window.createWebviewPanel()
        webview.onDidReceiveMessage(this.onDidReceiveMessage);
    }

    onDidReceiveMessage(message:any):void{
        if (message.type === "testConnection"){
            SettingsView.testConnection(message.data.ip, message.data.port);
        }else if(message.type === "connectServer"){
            SettingsView.connectServer(message.data.ip, message.data.port, message.data.username, message.data.password );
        }
    }
}
