import * as Memcached from 'memcached';
import { CommandData } from 'memcached';

export function valueForKey(obj: any, key: string): any {
    if (obj === undefined) { return undefined; }
    const keys = Object.keys(obj); // ['foo', 'baz', 'qux']
    const index = keys.indexOf(key); // 1
    return Object.values(obj)[index];
}
export async function getMemcachedSlabs(server: string): Promise<{ slabid: string, count: number }[]> {
    const client = new Memcached(server, {
        retries: 10,
        retry: 10000,
        remove: true
    });

    return new Promise((resolve, reject) => {
        var slabids: { slabid: string, count: number }[] = [];
        client.items((err, data) => {
            client.end();
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            data.forEach(element => {
                var key = Object.keys(element)[0];
                var count = valueForKey(element[key], 'number');
                if (key && count) { slabids.push({ slabid: key, count: count }); }
            });

            resolve(slabids);
        });
    });
}

export async function getMemcachedItems(server: string, slabid: string, count: number): Promise<string[]> {
    const client = new Memcached(server, {
        retries: 10,
        retry: 10000,
        remove: true
    });

    return new Promise((resolve, reject) => {
        var result: string[] = [];

        client.cachedump(server || "", Number(slabid), 0, (e, v) => {
            client.end();
            if (Array.isArray(v)) {
                v.forEach(e => {
                    result.push(valueForKey(e, 'key'));
                });
            } else if (v) {
                result.push(valueForKey(v, 'key'));
            }
            resolve(result);
        });
    });
}

export async function getMemcachedItem(server: string, key: string): Promise<string> {
    const client = new Memcached(server, {
        retries: 10,
        retry: 10000,
        remove: true
    });

    return new Promise((resolve, reject) => {
        client.get(key, (err: any, data: any) => {
            client.end();
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

export async function removeMemcachedItem(server: string, key: string): Promise<boolean> {
    const client = new Memcached(server, {
        retries: 10,
        retry: 10000,
        remove: true
    });

    return new Promise((resolve, reject) => {
        client.del(key, (err: any, result: boolean) => {
            client.end();
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

export async function setMemcachedItem(server: string, key: string, value: string, lifetime: number): Promise<boolean> {
    const client = new Memcached(server, {
        retries: 10,
        retry: 10000,
        remove: true
    });

    // return new Promise((resolve, reject) => {
    //     client.get(key, (err: any, data: any) => {
    //         if (err) {
    //             client.end();
    //             reject(err);
    //         } else {
    //             if(data){
    //                 client.replace(key, value, lifetime, (err: any, result: boolean) => {
    //                     client.end();
    //                     if (err) {
    //                         reject(err);
    //                     } else {
    //                         resolve(result);
    //                     }
    //                 });
    //             }else{
    //                 client.add(key, value, lifetime, (err: any, result: boolean) => {
    //                     client.end();
    //                     if (err) {
    //                         reject(err);
    //                     } else {
    //                         resolve(result);
    //                     }
    //                 });
    //             }
    //         }
    //     });
    // });

    return new Promise((resolve, reject) => {
        client.set(key, value, lifetime, (err: any, result: boolean) => {
            client.end();
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}