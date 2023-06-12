import { ExtensionContext } from 'vscode';
export enum Constant {
    GLOBAL_STATE_MEMCACHED_CONFIG_KEY = 'vscode-memcached-connection-config',
    GLOBAL_STATE_WELCOME_KEY = 'welcome-timestamp',
    GITEE_REPO = 'https://gitee.com/aufalau/memcached-viewer.git'
}

export class ConnectionConfig {
    host!: string;
    port!: string;
    password!: string;
    username!: string;

    constructor(options: {host?:string, port?:string, password?:string, username?:string}) {
        this.host = options.host || "localhost";
        this.port = options.port || "11211";
        this.password = options.password || "";
        this.username = options.username || "";
      }

      
    get id(): string {
        return `${this.host}:${this.port}`;
    }
}

export class ConnectionConfigStore {
    constructor(private context: ExtensionContext) { }

    all(): { [id: string]: ConnectionConfig } {
        return this.context.globalState.get<{ [id: string]: ConnectionConfig }>(Constant.GLOBAL_STATE_MEMCACHED_CONFIG_KEY) || {};
    }

    get(id: string): ConnectionConfig | undefined {
        const configs = this.all();
        return configs[id];
    }

    set(config: ConnectionConfig): void {
        const configs = this.all();
        configs[config.id] = config;
        this.context.globalState.update(Constant.GLOBAL_STATE_MEMCACHED_CONFIG_KEY, configs);
    }

    delete(id: string): void {
        const configs = this.all();
        delete configs[id];
        this.context.globalState.update(Constant.GLOBAL_STATE_MEMCACHED_CONFIG_KEY, configs);
    }
}