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
