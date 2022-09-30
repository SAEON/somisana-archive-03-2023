import path from 'path';
import { homedir } from 'os';
import process from 'process';
import rimraf from 'rimraf';
import makeFetchHappen from 'make-fetch-happen';
import { readFileSync } from 'fs';

var version = "1.0.0-beta.37";

// @ts-ignore
let cacheDir;
if (process.platform === 'darwin') cacheDir = path.join(homedir(), 'Library', 'Caches', 'jspm');
else if (process.platform === 'win32') cacheDir = path.join(process.env.LOCALAPPDATA || path.join(homedir(), 'AppData', 'Local'), 'jspm-cache');
else cacheDir = path.join(process.env.XDG_CACHE_HOME || path.join(homedir(), '.cache'), 'jspm');
function clearCache() {
    rimraf.sync(path.join(cacheDir, 'fetch-cache'));
}
const _fetch = makeFetchHappen.defaults({
    cacheManager: path.join(cacheDir, 'fetch-cache'),
    headers: {
        'User-Agent': `jspm/generator@${version}`
    }
});
function sourceResponse(buffer) {
    return {
        status: 200,
        async text () {
            return buffer.toString();
        },
        async json () {
            return JSON.parse(buffer.toString());
        },
        arrayBuffer () {
            return buffer.buffer || buffer;
        }
    };
}
const dirResponse = {
    status: 200,
    async text () {
        return '';
    },
    async json () {
        throw new Error('Not JSON');
    },
    arrayBuffer () {
        return new ArrayBuffer(0);
    }
};
const fetch = async function(url, opts) {
    if (!opts) throw new Error('Always expect fetch options to be passed');
    const urlString = url.toString();
    const protocol = urlString.slice(0, urlString.indexOf(':') + 1);
    let source;
    switch(protocol){
        case 'ipfs:':
            const { get  } = await import('./ipfs-0723127f.js');
            source = await get(urlString.slice(7), opts.ipfsAPI);
            if (source === null) return dirResponse;
            if (source === undefined) return {
                status: 404
            };
            return sourceResponse(source);
        case 'file:':
            if (urlString.endsWith('/')) {
                try {
                    readFileSync(new URL(urlString));
                    return {
                        status: 404,
                        statusText: 'Directory does not exist'
                    };
                } catch (e) {
                    if (e.code === 'EISDIR') return dirResponse;
                    throw e;
                }
            }
            try {
                return sourceResponse(readFileSync(new URL(urlString)));
            } catch (e1) {
                if (e1.code === 'EISDIR') return dirResponse;
                if (e1.code === 'ENOENT' || e1.code === 'ENOTDIR') return {
                    status: 404,
                    statusText: e1.toString()
                };
                return {
                    status: 500,
                    statusText: e1.toString()
                };
            }
        case 'data:':
            return sourceResponse(decodeURIComponent(urlString.slice(urlString.indexOf(','))));
        case 'node:':
            return sourceResponse('');
        case 'http:':
        case 'https:':
            // @ts-ignore
            return _fetch(url, opts);
    }
};

export { clearCache, fetch };