const http = require('http');
const https = require('https');
const url = require('url');
const { blockResources } = require('./middleware');
const { imageExists, cssExists } = require('./plugins');
const { logger } = require('./util');
const path = require('path')
const fs = require('fs')

const PORT = 3000;

const parseIncomingRequest = (clientRequest, clientResponse) => {
  const requestToFulfil = url.parse(clientRequest.url);

  // Frame the request to be forwarded via Backend to External Source
  const options = {
    method: clientRequest.method,
    headers: clientRequest.headers,
    host: requestToFulfil.hostname,
    port: requestToFulfil.port || 80,
    path: requestToFulfil.path
  }

  // PLUGINS
  if (blockResources(options)) {
    options.allowed = false;
    logger(options);

    // Don't allow the request to proceed and terminate here itself
    clientResponse.end();
  } else {
    options.allowed = true;
    logger(options);

    // Execute the Request
    executeRequest(options, clientRequest, clientResponse);
  }

}

const executeRequest = (options, clientRequest, clientResponse) => {
  const externalRequest = http.request(options, (externalResponse) => {

    // Write Headers to clientResponse
    clientResponse.writeHead(externalResponse.statusCode, externalResponse.headers);

    // Forward the data being received from external source back to client
    externalResponse.on("data", (chunk) => {
      clientResponse.write(chunk);
    });

    // End the client response when the request from external source has completed
    externalResponse.on("end", () => {
      clientResponse.end();
    });
  });

  // Map data coming from client request to the external request being made
  clientRequest.on("data", (chunk) => {

    externalRequest.write(chunk);
  });

  // Map the end of client request to the external request being made
  clientRequest.on("end", () => {
    externalRequest.end();
  });
}

// Create a HTTP server
const server = http.createServer(parseIncomingRequest);

// Listen to PORT 
server.listen(PORT, () => {
  console.log(`******************* PROXY STARTED ON http://localhost:${PORT} *******************\n`)
});

const sslServer = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, 'cert', 'cakey.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cacert.pem')),
  },
  parseIncomingRequest
)

sslServer.listen(3443, () => console.log('Secure server 🚀🔑 on port 3443'))