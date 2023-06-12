import * as vscode from 'vscode';
import * as path from 'path';
import * as net from 'net';
import * as Memcached from 'memcached';
import { valueForKey } from './Tools';

export namespace MemcachedView {
    export function testConnection(host: string, port: number, onResult?: (result: number) => void): void {
        console.log(`${host}:${port}`);
        const socket = new net.Socket();

        socket.connect(port, host, () => {
            console.log(`Connected to ${host}:${port}`);
            socket.end();
            vscode.window.showInformationMessage('Connection Successed!');

            if (onResult) { onResult(0); }
        });

        socket.on('error', (err) => {
            console.error(err);
            vscode.window.showInformationMessage('Connection Failed!');
            if (onResult) { onResult(-1); }
        });
    }

    export function connectServer(host: string, port: number, username?: string, password?: string, onResult?:(result:number)=>void): void {
        const client = new Memcached(`${host}:${port}`, {
            retries: 10,
            retry: 10000,
            remove: true
          });
          
          client.stats((err, data) => {
            if (err) {
              console.error(err);
              if (onResult) { onResult(-1); }
              return;
            }

            if (onResult) { onResult(data.length); }
          });
    }

    var settingView: vscode.WebviewPanel | undefined;
    export function openSettingsView(context: vscode.ExtensionContext): [vscode.Webview, boolean] {
        if(settingView){
            settingView.reveal();
            return [settingView.webview, false];
        }

        settingView = vscode.window.createWebviewPanel(
            'memcached',
            'Memcached - New Connection Settings',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'html'))
                ],
                retainContextWhenHidden: true
            }
        );

        const webViewPath = vscode.Uri.file(path.join(context.extensionPath, 'html', 'settings.html'));

        vscode.workspace.fs.readFile(webViewPath).then(buffer => (settingView as vscode.WebviewPanel).webview.html = buffer.toString());
        context.subscriptions.push(settingView);

        settingView.onDidDispose(()=>{
            settingView = undefined;
        });
        
        return [settingView.webview, true];
        // myView.webview.onDidReceiveMessage(message=>onDidReceiveMessage(message));
    }

    var dataView: vscode.WebviewPanel | undefined;
    export function openDataView(context: vscode.ExtensionContext): [vscode.Webview, boolean] {
        if(dataView){
            dataView.reveal();
            return [dataView.webview, false];
        }

        dataView = vscode.window.createWebviewPanel(
            'memcached',
            'Memcached - Data',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'html'))
                ],
                retainContextWhenHidden: true
            }
        );
        vscode.window.registerWebviewPanelSerializer
        const webViewPath = vscode.Uri.file(path.join(context.extensionPath, 'html', 'data.html'));

        vscode.workspace.fs.readFile(webViewPath).then(buffer => (dataView as vscode.WebviewPanel).webview.html = buffer.toString());
        context.subscriptions.push(dataView);

        dataView.onDidDispose(()=>{
            dataView = undefined;
        });
        return [dataView.webview, true];
    }
    
}
// function openView(context: vscode.ExtensionContext) {


