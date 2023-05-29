import * as vscode from 'vscode';
import * as path from 'path';

export namespace SettingsView {
    export function testConnection(ip: string, port: number): void {
        console.log(`${ip}:${port}`);
    }

    export function connectServer(ip: string, port: number, username?: string, password?: string): void {
        console.log(`${ip}:${port}${username}${password}`);
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


