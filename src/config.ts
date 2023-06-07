import { ExtensionContext } from 'vscode';
enum Constant {
    GLOBAL_STATE_MEMCACHED_CONFIG_KEY = 'vscode-redis-connection-config',
    GLOBAL_STATE_WELCOME_KEY = 'welcome-timestamp',
    GITEE_REPO = 'https://gitee.com/aufalau/memcached-viewer.git'
}

export class ConnectionConfig {
    host!: string;
    port!: string;
    password!: string;
    username!: string;

    get id(): string {
        return `${this.host}:${this.port}`;
    }
}

export default class ConnectionConfigStore {
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
        config.host = config.host;
        config.port = config.port;
        config.username = config.username;
        configs[config.id] = config;
        this.context.globalState.update(Constant.GLOBAL_STATE_MEMCACHED_CONFIG_KEY, configs);
    }

    delete(id: string): void {
        const configs = this.all();
        delete configs[id];
        this.context.globalState.update(Constant.GLOBAL_STATE_MEMCACHED_CONFIG_KEY, configs);
    }
}