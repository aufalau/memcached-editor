// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { DataProvider } from './DataProvider';
import { ServerItem, SlabItem, KeyItem } from './DataItem';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const memcachedProvider = new DataProvider(context);
	// vscode.window.registerTreeDataProvider('memcached-list', memcachedProvider);
	const treeView = vscode.window.createTreeView('memcached-list', {treeDataProvider:memcachedProvider});
	treeView.onDidChangeSelection(evt => memcachedProvider.onDidChangeSelection(evt));

	vscode.commands.registerCommand('memcached.list.add', () => memcachedProvider.addServer());
	vscode.commands.registerCommand('memcached.list.refresh', () => memcachedProvider.refresh());

	vscode.commands.registerCommand('memcached.server.reload', (element: ServerItem) => memcachedProvider.refreshServer(element));
	vscode.commands.registerCommand('memcached.server.edit', (element: ServerItem) => memcachedProvider.editServer(element));
	vscode.commands.registerCommand('memcached.server.delete', (element: ServerItem) => memcachedProvider.deleteServer(element));

	vscode.commands.registerCommand('memcached.slab.filter', (element: SlabItem) => {
		vscode.window.showInformationMessage(`Memcached.Slab.Filter ${element.label}`);
	});
	vscode.commands.registerCommand('memcached.slab.reload', (element: SlabItem) => memcachedProvider.refreshSlab(element));

	vscode.commands.registerCommand('memcached.key.operator', (element: KeyItem) => memcachedProvider.openKey(element));
}

// This method is called when your extension is deactivated
export function deactivate() { }
