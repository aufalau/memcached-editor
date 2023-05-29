// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { DataProvider } from './DataProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0)) ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	const memcachedProvider = new DataProvider(context);
	vscode.window.registerTreeDataProvider('memcached-list', memcachedProvider);
	vscode.commands.registerCommand('memcached-list.refresh', () => memcachedProvider.refresh());
	// vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
	vscode.commands.registerCommand('memcached-list.add', () => memcachedProvider.addServer());
	// vscode.commands.registerCommand('nodeDependencies.editEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
	// vscode.commands.registerCommand('nodeDependencies.deleteEntry', (node: Dependency) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));

	// const disposable = vscode.commands.registerCommand("memcached-viewer.open", function () {
	// 	vscode.window.showInformationMessage('Welcome Memcached Viewer!');
	// 	openView(context);
	// });

	// context.subscriptions.push(disposable);

	// const treeDataProvider = getTreeDataProvider();
    // const treeView = createTreeView(context);

    // context.subscriptions.push(registerCommands(treeView))
}

// This method is called when your extension is deactivated
export function deactivate() { }
