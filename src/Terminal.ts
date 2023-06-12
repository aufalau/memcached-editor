import * as vscode from 'vscode';
import { ServerItem } from './DataItem';

import { Constant } from './config';

class Pseudo implements vscode.Pseudoterminal {
    private writeEmitter = new vscode.EventEmitter<string>();

    onDidWrite = this.writeEmitter.event;
    onDidOverrideDimensions?: vscode.Event<vscode.TerminalDimensions | undefined> | undefined;
    onDidClose?: vscode.Event<number | void> | undefined;
    onDidChangeName?: vscode.Event<string> | undefined;

    private dbIndex = 0;
    private cursor = 0;
    private input: string[] = [];
    private get name(): string {
        return this.server.server;
    }

    constructor(
        private server: ServerItem,
        private showWelcome: boolean,
        private closeEvent: () => void
    ) { }

    open(initialDimensions: vscode.TerminalDimensions | undefined): void {
        // if (this.showWelcome) {
        //     this.writeEmitter.fire('Welcome to memcached extension!\r\n');
        //     this.writeEmitter.fire(` ⭐ Star:     ${Constant.GITEE_REPO}.\r\n`);
        //     this.writeEmitter.fire(` 💬 Feedback: ${Constant.GITEE_REPO}/issues.\r\n`);
        //     this.writeEmitter.fire('\r\n');
        // }
        // this.writeEmitter.fire(this.name);
        // this.writeEmitter.fire('\r\n');
        // this.writeEmitter.fire(`telnet ${this.server.host} ${this.server.port}`);
        // this.writeEmitter.fire('\r\n');
    }

    close(): void {
        this.closeEvent();
    }
    handleInput?(data: string): void {
        // throw new Error('Method not implemented.');
        this.writeEmitter.fire(data);
    }
    setDimensions?(dimensions: vscode.TerminalDimensions): void {
        throw new Error('Method not implemented.');
    }

}

export class Terminal {
    private terminals = new Map<string, vscode.Terminal>();
    constructor(
        readonly context: vscode.ExtensionContext
    ) { }

    create(element: ServerItem): void {
        const timestamp = this.context.globalState.get<number>(Constant.GLOBAL_STATE_WELCOME_KEY) || Date.now();
        // const pty = new Pseudo(element, timestamp < Date.now(), () => this.close(element.server));
        const name = `${element.server}`;
        const terminal = vscode.window.createTerminal({ name });

        this.terminals.set(element.server, terminal);
    }

    show(element: ServerItem): void {
        if (!element) { return; }
        if (!this.terminals.has(element.server)) {
            this.create(element);
        }
        let terminal = this.terminals.get(element.server);
        terminal?.show(true);
        terminal?.sendText(`telnet ${element.host} ${element.port}`);
    }

    /**
     * Terminal is closed by an act of the user.
     * @param id 
     */
    private close(server: string): void {
        this.terminals.get(server)?.dispose();
        this.terminals.delete(server);
    }
}