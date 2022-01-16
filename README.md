# ![https://www.flaticon.com/free-icon/download-circular-button_54993](icon.png) direct-data
Component for reading/saving data directly into source code.

## Setup

### Directly in web page

Include the scripts in html as follow:
```
<script src="https://unpkg.com/config-template-merger/public/direct-data.js"></script>
```


### Through NPM


Add to `package.json`:
```
  "dependencies": {
  	...
    "direct-data": "^1.0.0",
    ...
  }
```


Use Browserify to make classes available in browser

In `package.json`:
```
  "scripts": {
  	...
    "browserify": "browserify browserify/main.js -s dok-lib -o public/gen/compact.js",
    ...
  },

```

In `browserify/main.js`:
```
const { DirectData } = require('direct-data');

module.exports = {
  DirectData,
};
```

## Components

### DirectData

#### Description
DirectData is used for reading and saving data. It's meant to read from JSON file, with an option to save if the current app is ran from Node.js.

#### Usage

```javascript
const directData = new DirectData();
directData.onSave = () => console.log("Data saved.");

const data = await directData.getData("pathToData");

//	manipulate data
data.field1 = 123;
data.field2 = 456;
directData.didChange("pathToData");

//	after 3 sec, the updated data gets saved. Typically, it's used to save directly into the code base.

//	Note: If directData is used outside of Node.js (or without a proper dataWriter), then it can be used to just read data.

```

### ServerHandler

#### Description
ServerHandler is used on Node.js side. Attached to an express app, it exposes API to load and save to the local source.

#### Usage

This gives access to save and load, through the "/data" endpoint.
```javascript
const app = express();
new ServerHandler(app);
```
The second parameter (optional) is "readOnly", to disable all write.

A folder can be passed as 3rd parameter to specify the folder to save to. Ex:
```javascript
const app = express();
new ServerHandler(app, false, `${__dirname}/public/database`);
```


### Demo

[demo](https://jacklehamster.github.io/direct-data/)