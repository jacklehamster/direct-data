const { DataWriter } = require("./base/data-writer");
const { DataReader } = require("./base/data-reader");

class DirectData {
	constructor(parameters) {
		const { fileUtils, dataReader, dataWriter, dataEndPoint, saveAfterMillis, onSave } = parameters || {};
		this.dataStore = {};
		this.pendingSave = new Set();
		this.dataEndPoint = dataEndPoint || "data";
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