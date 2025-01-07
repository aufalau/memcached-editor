// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { DataProvider } from './DataProvider';
import { ServerItem, SlabItem, KeyItem } from './DataItem';
import { Terminal } from './Terminal';
import { Constant } from './config';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const provider = new DataProvider(context);
	const terminal = new Terminal(context);
	// vscode.window.registerTreeDataProvider('memcached-list', memcachedProvider);
	provider.treeView = vscode.window.createTreeView('memcached-list', { treeDataProvider: provider });

	provider.treeView.onDidChangeSelection(evt => provider.onDidChangeSelection(evt));

	vscode.commands.registerCommand('memcached.list.add', () => provider.addServer());
	vscode.commands.registerCommand('memcached.list.refresh', () => provider.refresh());

	vscode.commands.registerCommand('memcached.server.operator', (element: ServerItem) => provider.openServer(element));
	vscode.commands.registerCommand('memcached.server.terminal', (element: ServerItem) => terminal.show(element));
	vscode.commands.registerCommand('memcached.server.reload', (element: ServerItem) => provider.refreshServer(element));
	vscode.commands.registerCommand('memcached.server.edit', (element: ServerItem) => provider.editServer(element));
	vscode.commands.registerCommand('memcached.server.delete', (element: ServerItem) => provider.deleteServer(element));
	vscode.commands.registerCommand('memcached.repo.git', () => {
		const url = vscode.Uri.parse(Constant.GITHUB_REPO);
        vscode.env.openExternal(url);
	});

	vscode.commands.registerCommand('memcached.slab.operator', (element: SlabItem) => provider.openSlab(element));
	vscode.commands.registerCommand('memcached.slab.filter', (element: SlabItem) => {
		vscode.window.showInformationMessage(`Memcached.Slab.Filter ${element.label}`);
	});
	vscode.commands.registerCommand('memcached.slab.reload', (element: SlabItem) => provider.refreshSlab(element));

	vscode.commands.registerCommand('memcached.key.operator', (element: KeyItem) => provider.openKey(element));
	vscode.commands.registerCommand('memcached.key.remove', (element: KeyItem) => provider.removeKey(element));
}

// This method is called when your extension is deactivated
export function deactivate() { }
