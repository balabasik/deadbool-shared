// Worker code reuses Physics react components, using es6.
// So we need to transcode the code to be able to reuse it in node backend.
require = require("esm")(module);
// Import the rest of our application.
module.exports = require("./worker.js");
