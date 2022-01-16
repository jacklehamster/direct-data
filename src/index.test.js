const expect = require('chai').expect;

const { DirectData } = require('./index.js');
const { DataReader } = require('./base/data-reader.js');
const { FileUtils } = require("dok-file-utils");

const MockXMLHttpRequest = require('mock-xmlhttprequest');
const MockXhr = MockXMLHttpRequest.newMockXhr();

// Mock JSON response
MockXhr.onSend = (xhr) => {
  const responseHeaders = { 'Content-Type': 'application/json' };
  let response;
  switch (xhr.url) {
    case "/test/db1":
      response = {};
      break;
    case "/test/can-write.json":
      response = 1;
      break;
    default:
  }
  xhr.respond(200, responseHeaders, response);
};

describe('DirectData', function() {
  it('should save data', function(done) {
  	const fileUtils = new FileUtils(MockXhr);
  	const directData = new DirectData({
        fileUtils,
        dataWriter: {
          write: async body => {
            expect(body.db1.test).to.equal(123);
            return '{"success": true}';
          },
        },
        dataEndPoint: "/test",
        saveAfterMillis: 10,
        onSave: () => done(),
      });

    directData.getData("db1").then(data1 => {
      data1.test = 123;
      directData.didChange("db1");
    });
  });
});