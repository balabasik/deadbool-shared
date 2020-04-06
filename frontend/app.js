var express = require("express");
var fs = require("fs");
var https = require("https");
var http = require("http");
var app = express();
var read = fs.readFileSync;

// This is required to set the build location.
app.use(express.static("react/build_full"));

// Environment variable to enable/disable ssl.
// Should be in sync across frontend/operator/backend.
const USE_SSL = (process.env.USE_SSL || 0) == 1;
console.log("USE_SSL", USE_SSL);

var KEY_LOCATION = process.env.KEY_LOCATION || "key.pem";
var CERT_LOCATION = process.env.CERT_LOCATION || "cert.pem";
var CHAIN_LOCATION = process.env.CHAIN_LOCATION || "ca.pem";

var privateKey;
var certificate;
var chainLines = [];

try {
  privateKey = read(KEY_LOCATION, "utf8");
} catch {
  err => {
    console.log("key is not found");
  };
}

try {
  certificate = read(CERT_LOCATION, "utf8");
} catch {
  err => {
    console.log("cert is not found");
  };
}

try {
  chainLines = read(CHAIN_LOCATION, "utf8").split("\n");
} catch {
  err => {
    console.log("chain is not found");
  };
}
var cert = [];
var ca = [];
chainLines.forEach(function(line) {
  cert.push(line);
  if (line.match(/-END CERTIFICATE-/)) {
    ca.push(cert.join("\n"));
    cert = [];
  }
});
var credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};

// NOTE: Some systems do not let explicitely creating servers on 80 and 443 ports.
// Therefore requests from ports 443 and 80 are remapped using iptables to 8443 and 8080.
if (USE_SSL) {
  https.createServer(credentials, app).listen(8443, function() {
    console.log("HTTPS port 8443.");
  });
} else {
  http.createServer(credentials, app).listen(8080, function() {
    console.log("HTTP port 8080.");
  });
}
