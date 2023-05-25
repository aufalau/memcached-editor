// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand("memcached-viewer.open", function () {
		openView(context);
        vscode.window.showInformationMessage('Welcome Memcached Viewer!');
    });

	context.subscriptions.push(disposable);

}

// This method is called when your extension is deactivated
export function deactivate() {}

function openView(context: vscode.ExtensionContext){

    // const myView = vscode.window.createWebviewPanel(
    //     'memcached',
    //     'Memcached View',
    //     vscode.ViewColumn.One,
    //     {
    //         enableScripts: true,
    //         localResourceRoots: [
    //             vscode.Uri.file(path.join(context.extensionPath, 'html'))
    //         ]
    //     }
    // );

	// const webViewPath = vscode.Uri.file(path.join(context.extensionPath, 'html', 'memcached.html'));

	// vscode.workspace.fs.readFile(webViewPath).then(buffer => myView.webview.html = buffer.toString());
    // context.subscriptions.push(myView);

	const treeData = [
        {id: 1, label: 'Item 1', children: []},
        {id: 2, label: 'Item 2', children: [
            {id: 3, label: 'Subitem 1'},
            {id: 4, label: 'Subitem 2'}
        ]}
    ];

    // create the tree view
    const treeDataProvider = new MyTreeDataProvider(treeData);
    const treeView = vscode.window.createTreeView('tree', { treeDataProvider });

    context.subscriptions.push(treeView);
}

class MyTreeDataProvider {
	treeData: any;
    constructor(treeData : any) {
        this.treeData = treeData;
    }

    getChildren(element: any) {
        if (!element) {
            return this.treeData;
        }
        return element.children || [];
    }

    getTreeItem(element: any) {
        return {
            id: String(element.id),
            label: element.label,
            collapsibleState: element.children ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None
        };
    }
}