import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class DataItem extends vscode.TreeItem{

    constructor(
        public label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public itemType: ItemType,
        public children?: DataItem[],
        public command?: vscode.Command
    ) {
        super(label, collapsibleState);

        this.tooltip = undefined;
        this.description = undefined;
        if(this.itemType === ItemType.itemServer)
        {
            this.iconPath = {
                light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
                dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
            };
        }
        else{
            this.iconPath = {
                light: path.join(__filename, '..', '..', 'resources', 'light', 'document.svg'),
                dark: path.join(__filename, '..', '..', 'resources', 'dark', 'document.svg')
            };
        }
    }
}

export enum ItemType{
    itemServer = 0,
    itemKey = 1,
}