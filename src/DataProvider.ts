import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ItemType, DataItem } from './DataItem';
import { SettingsView } from './SettingsView';
import * as Memcached from 'memcached';

export class DataProvider implements vscode.TreeDataProvider<DataItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DataItem | undefined | null | void> = new vscode.EventEmitter<DataItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DataItem | undefined | null | void> = this._onDidChangeTreeData.event;


    // onDidChangeTreeData?: vscode.Event<void | DataItem | DataItem[] | null | undefined> | undefined;

    serverList:DataItem[] = [];

    constructor(readonly context: vscode.ExtensionContext) {
    }

    getTreeItem(element: DataItem): DataItem{
        return element;
    }

    async getChildren(element?: DataItem | undefined): Promise<DataItem[]>{
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

    addServer(): void{
        vscode.window.showInformationMessage(`Successfully called add entry.`);
        const webview = SettingsView.openView(this.context);
        // vscode.window.createWebviewPanel()
        webview.onDidReceiveMessage((message)=>{this.onDidReceiveMessage(webview, message);});
    }

    onDidReceiveMessage(webView: vscode.Webview, message:any):void{
        if (message.type === "testConnection"){
            SettingsView.testConnection(message.data.host, message.data.port, (result)=>{
                // webView.postMessage({type:"testConnection", result});
                vscode.window.showInformationMessage(result === 0 ? 'Connection Successed!':'Connection Failed!');
            });
        }else if(message.type === "connectServer"){
            if(this.serverList.find(elem=>elem.label === `${message.data.host}:${message.data.port}`)) {return;}
            SettingsView.connectServer(message.data.host, message.data.port, message.data.username, message.data.password, (result:number)=>{
                if(result >= 0){
                    vscode.window.showInformationMessage('Connection Successed!');
                    this.serverList.push(new DataItem(`${message.data.host}:${message.data.port}` , vscode.TreeItemCollapsibleState.Collapsed, ItemType.itemServer, undefined));
                    this._onDidChangeTreeData.fire();
                }else{
                    vscode.window.showInformationMessage('Connection Failed!');
                }
            } );
            
        }
    }
}
