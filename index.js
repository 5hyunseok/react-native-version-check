import { NativeModules, Platform } from 'react-native';

const { RNVersionCheck } = NativeModules;

const PACKAGE_NAME = RNVersionCheck.packageName;
const CURRENT_BUILD_NUMBER = RNVersionCheck.currentBuildNumber;
const CURRENT_VERSION = RNVersionCheck.currentVersion;
const getLatestVersionNative = RNVersionCheck.getLatestVersion;

let latestVersion;

const getLatestVersion = () => {
    if(latestVersion) {
        return Promise.resolve(latestVersion);
    } else {
        return getLatestVersionNative()
            .then((version) => {
                latestVersion = version;
            })
            .catch(() => fetch("https://play.google.com/store/apps/details?id=" + PACKAGE_NAME, { timeout: 5000 }))
            .then(res => res.text())
            .then((text) => {
                const startToken = "softwareVersion\">";
                const endToken = "<";

                const indexStart = text.indexOf(startToken);

                if (indexStart == -1) {
                    return Promise.reject();
                } else {
                    text = text.substr(indexStart + startToken.length);
                    text = text.substr(0, text.indexOf(endToken));

                    latestVersion = text.trim();
                    return Promise.resolve(latestVersion);
                }
            });
    }
};


function getVersionNumberArray(version, depth, delimiter) {
    version = String(version);

    if(version.indexOf(delimiter) == -1) {
        return version;
    } else {
        version = version.split(delimiter);

        let result = [];
        for(let i = 0, d = Math.min(depth, version.length); i < d; i++) {
            result.push(version[i]);
        }

        return result;
    }
}

export default {
    getPackageName: () => PACKAGE_NAME,
    getCurrentBuildNumber: () =>CURRENT_BUILD_NUMBER,
    getCurrentVersion: () => CURRENT_VERSION,
    getLatestVersion: getLatestVersion,
    needUpdate: (depth = Infinity, delimiter = '.') => {
        if(typeof depth === 'string') {
            delimiter = depth;
            depth = Infinity;
        }

        let currentVersion = CURRENT_VERSION;

        return Promise.resolve()
            .then(() => getLatestVersion())
            .then((latestVersion) => {
                currentVersion = getVersionNumberArray(currentVersion, depth, delimiter);
                latestVersion = getVersionNumberArray(latestVersion, depth, delimiter);

                for(let i = 0; i < depth; i++) {
                    if(!latestVersion[i] && !currentVersion[i]) {
                        return Promise.resolve(false);
                    }
                    if(!currentVersion[i]) {
                        return Promise.resolve(true);
                    }
                    if(latestVersion[i] > currentVersion[i]) {
                        return Promise.resolve(true);
                    }
                }
                return Promise.resolve(false);
            });
    }
};