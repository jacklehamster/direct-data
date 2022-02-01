(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
class FileUtils {
    constructor(XMLHttpRequest) {
        this.XMLHttpRequest = XMLHttpRequest || globalThis.XMLHttpRequest;
        this.fileStock = {};
    }

    async preload(...urls) {
        return Promise.all(urls.map(async url => {
            return await this.load(url);
        }));
    }

    async load(url, responseType) {
        return !url ? Promise.resolve(null) : new Promise((resolve, reject) => {
            if (this.fileStock[url]) {
                const { data, loaded, onLoadListeners } = this.fileStock[url];
                if (!loaded) {
                    onLoadListeners.push(resolve);
                } else {
                    resolve(data);
                }
            } else {
                const req = new this.XMLHttpRequest();
                this.fileStock[url] = {
                    data: null,
                    url,
                    progress: 0,
                    onLoadListeners: [],
                };
                req.open('GET', url);
                req.responseType = responseType || (url.match(/.(json)$/i) ? "json" : 'blob');

                req.addEventListener('load', e => {
                    if (req.status === 200) {
                        const data = req.response;
                        this.fileStock[url].progress = 1;
                        this.fileStock[url].loaded = true;
                        this.fileStock[url].data = data;
                        this.fileStock[url].onLoadListeners.forEach(callback => callback(data));
                        delete this.fileStock[url].onLoadListeners;
                        resolve(data);
                    }
                    else {
                        reject(new Error(`Url could not load: ${url}`));
                    }
                });
                req.addEventListener('error', e => {
                    reject(new Error("Network Error"));
                });
                req.addEventListener('progress', e => {
                    this.fileStock[url].progress = e.loaded / e.total;
                });
                req.send();
            }
        });
    }
}

if (typeof module !== "undefined") {
    module.exports = {
        FileUtils,
    };
}

},{}],2:[function(require,module,exports){
class ImageLoader {
	constructor(preserve, XMLHttpRequest, Image) {
		this.preserve = preserve || {};
		this.XMLHttpRequest = XMLHttpRequest || globalThis.XMLHttpRequest;
		this.Image = Image || globalThis.Image;
		this.imageStock = {};
	}

	async getBlobUrl(url) {
		await this.loadImage(url);
		return this.preserve[url] ? this.imageStock[url]?.img.src : null; 
	}

	async preloadImages(...urls) {
		return Promise.all(urls.map(async url => {
			return await this.loadImage(url);
		}));
	}

	async loadImage(url) {
		return !url ? Promise.resolve(null) : new Promise((resolve, reject) => {
			if (this.imageStock[url]) {
				const { img, loaded, onLoadListeners } = this.imageStock[url];
				if (!loaded) {
					onLoadListeners.push(resolve);
				} else {
					resolve(img);
				}
			} else {
			    const req = new this.XMLHttpRequest();
			    const img = new this.Image();
			    this.imageStock[url] = {
			    	img,
			    	url,
			    	progress: 0,
			    	onLoadListeners: [],
			    };
			    req.open('GET', url);
		        req.responseType = 'blob';

			    req.addEventListener('load', e => {
			    	if (req.status === 200) {
						if (url.match(/.(jpg|jpeg|png|gif)$/i)) {
							const imageURL = URL.createObjectURL(req.response);
							const { img } = this.imageStock[url];
							img.addEventListener("load", () => {
								if (!this.preserve[url]) {
									URL.revokeObjectURL(imageURL);
								}
								this.imageStock[url].progress = 1;
								this.imageStock[url].loaded = true;
								const listeners = this.imageStock[url].onLoadListeners;
								delete this.imageStock[url].onLoadListeners;
								resolve(img);
								listeners.forEach(callback => callback(img));
							});
							img.src = imageURL;
						} else {
							reject(new Error("Invalid image."));
						}
					}
					else {
						reject(new Error(`Url could not load: ${url}`));
					}
			    });
			    req.addEventListener('error', e => {
			    	reject(new Error("Network Error"));
			    });
			    req.addEventListener('progress', e => {
			    	this.imageStock[url].progress = e.loaded / e.total;
			    });
				req.send();
			}
		});
	}
}

if (typeof module !== "undefined") {
	module.exports = {
    	ImageLoader,
	};
}

},{}],3:[function(require,module,exports){
const { FileUtils } = require("./file-utils");
const { ImageLoader } = require("./image-loader");

module.exports = {
    FileUtils,
    ImageLoader,
};

},{"./file-utils":1,"./image-loader":2}],4:[function(require,module,exports){
const { FileUtils } = require("dok-file-utils");

class DataReader {
	constructor(fileUtils, dataEndPoint) {
		this.dataEndPoint = dataEndPoint || "data";
		this.fileUtils = fileUtils || new FileUtils();
	}

	async canWrite() {
		try {
			return JSON.parse(await this.fileUtils.load(`${this.dataEndPoint}/can-write.json`));
		} catch(e) {

		}
		return 0;
	}

	async read(path) {
		try {
			return (await this.fileUtils.load(`${this.dataEndPoint}/${path}`)) || {};
		} catch (e) {
			console.warn("Path: " + path + " unavailable.")
		}
		return {};
	}
}

module.exports = {
	DataReader,
};

},{"dok-file-utils":3}],5:[function(require,module,exports){
class DataWriter {
	constructor(dataEndPoint) {
		this.dataEndPoint = dataEndPoint || "/data";
	}

	async write(data) {
		const response = await fetch("/data", {
		    method: 'POST',
		    cache: 'no-cache',
		    headers: {
		      'Content-Type': 'application/json',
		    },
		    body: JSON.stringify(data),
		});	
		return response.text();
	}
}

module.exports = {
	DataWriter,
};

},{}],6:[function(require,module,exports){
const { DataWriter } = require("./base/data-writer");
const { DataReader } = require("./base/data-reader");

class DirectData {
	constructor(parameters) {
		const { fileUtils, dataReader, dataWriter, dataEndPoint, saveAfterMillis, onSave } = parameters || {};
		this.dataStore = {};
		this.pendingSave = new Set();
		this.dataEndPoint = dataEndPoint || "/data";
		this.dataWriter = dataWriter || new DataWriter(this.dataEndPoint);
		this.dataReader = dataReader || new DataReader(fileUtils, this.dataEndPoint);
		this.saveAfterMillis = saveAfterMillis || 3000;
		this.onSave = onSave;
	}

	async getData(path) {
		if (!this.dataStore[path]) {
			this.dataStore[path] = {};
			try {
				this.dataStore[path] = await this.dataReader.read(path);
			} catch (e) {
				console.warn("Path: " + path + " unavailable.")
			}
		}
		return this.dataStore[path];
	}

	didChange(path) {
		clearTimeout(this.timeout);
		this.pendingSave.add(path);
		this.timeout = setTimeout(() => this.performSave(), this.saveAfterMillis);
	}

	async performSave() {
		const canWrite = await this.dataReader.canWrite();

		if (!canWrite) {
			return;
		}
		const response = await this.save();
		console.info(`Save performed. response: ${response}`);
		if (this.onSave) {
			this.onSave();
		}
	}

	async save() {
		const body = {};
		for (let path of this.pendingSave) {
			const data = this.dataStore[path];
			body[path] = data;
		}
		return Object.keys(body).length ? this.dataWriter.write(body) : null;
	}
}

module.exports = {
	DirectData,
};

globalThis.DirectData = DirectData;
},{"./base/data-reader":4,"./base/data-writer":5}]},{},[6]);
