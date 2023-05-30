import * as vscode from 'vscode';
import * as path from 'path';
import * as net from 'net';
import * as Memcached from 'memcached';
import { valueForKey } from './Tools';

export namespace SettingsView {
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
          
          // Test connection to Memcached server
          client.stats((err, data) => {
            if (err) {
              console.error(err);
              if (onResult) { onResult(-1); }
              return;
            }

            if (onResult) { onResult(data.length); }
            // console.log(data);
          });

          // client.slabs((err, data) => {
          //   if (err) {
          //     console.error(err);
          //     if (onResult) { onResult(-1); }
          //     return;
          //   }
          //   // console.log(data);
          // });

          // client.items((err, data) => {
          //   if (err) {
          //     console.error(err);
          //     if (onResult) { onResult(-1); }
          //     return;
          //   }
          //   data.forEach(element => {
          //       var key = Object.keys(element)[0];
          //       // var number = valueForKey(element[key], 'number');

          //       if (onResult) { onResult(Number(key)); }
          //       // client.cachedump(element.server || "", Number(key), val, (e, v)=>{
          //       //     console.log(`${e}, ${v}`);
          //       // });
          //   });

            //console.log(data);
          // });

        // console.log(`${host}:${port}${username}${password}`);
    }

    export function openView(context: vscode.ExtensionContext): vscode.Webview {
        const myView = vscode.window.createWebviewPanel(
            'memcached',
            'Memcached - New Connection Settings',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'html'))
                ]
            }
        );

        const webViewPath = vscode.Uri.file(path.join(context.extensionPath, 'html', 'settings.html'));

        vscode.workspace.fs.readFile(webViewPath).then(buffer => myView.webview.html = buffer.toString());
        context.subscriptions.push(myView);

        return myView.webview;
        // myView.webview.onDidReceiveMessage(message=>onDidReceiveMessage(message));
    }

}
// function openView(context: vscode.ExtensionContext) {


