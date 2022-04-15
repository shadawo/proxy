//Librairie pour le serveur http
const http = require('http');
const url = require('url');

//Librairie pour le serveur https
const https = require('https');
//Librairie pour lire les fichiers(utilisé pour lire les certificats et clés affin de faire un serveur https avec nos certificats)
const fs = require('fs')
const path = require('path')
//Librairie pour écrire dans la console avec différentes couleurs 
const colors = require('colors/safe');

const PORT = 3000;

//Méthode pour afficher les logs des requêtes
const logger = (requestData) => {
  console.log(`${colors.cyan(requestData.method)} : ${colors.bgBlack('http://')}${colors.bgBlack(requestData.host)}${colors.bgBlack(requestData.path)} - ${requestData.allowed ? colors.green("ALLOWED") : colors.red("BLOCKED")}`);
}


//méthode pour récupérer la requête émise par l'utilisateur
const parseIncomingRequest = (clientRequest, clientResponse) => {
  //On récupere l'url de la requete émise par l'utilisateur 
  const requestToFulfil = url.parse(clientRequest.url);

  // Options et infos utiles pour envoyer la requêtes au site
  const options = {
    method: clientRequest.method,
    headers: clientRequest.headers,
    host: requestToFulfil.hostname,
    port: requestToFulfil.port || 80,
    path: requestToFulfil.path
  }

  //On peut blacklist certaines adresses ou bloquer certaines ressources 
  if (clientRequest.url == "http://www.ens-lyon.fr/") {
    //Si on remarque des ressources que l'on veut bloquer
    //On n'autorise pas la requete
    options.allowed = false;
    logger(options);
    //Et on la termine
    clientResponse.end();
  } else {
    //Sinon on accepte
    options.allowed = true;
    logger(options);

    //on execute la requête 
    executeRequest(options, clientRequest, clientResponse);
  }

}
//méthode qui execute la requête et la renvoie à l'utilisateur 
const executeRequest = (options, clientRequest, clientResponse) => {
  //On utilise la librairie http et sa méthode request pour faire une requête vers un site http
  const externalRequest = http.request(options, (externalResponse) => {

    // On écrit le header  
    clientResponse.writeHead(externalResponse.statusCode, externalResponse.headers);

    //On renvoie les données reçu à l'utilisateur 
    externalResponse.on("data", (chunk) => {
      clientResponse.write(chunk);
    });

    // Quand la le site a fini de renvoyer les données on fini l'envoie des données au client.
    externalResponse.on("end", () => {
      clientResponse.end();
    });
  });

  // Map data coming from client request to the external request being made
  clientRequest.on("data", (chunk) => {

    externalRequest.write(chunk);
  });

  // On termine la requête externe quand la requête du client est aussi fini pour être sûr d'effectuer toutes les requêtes 
  clientRequest.on("end", () => {
    externalRequest.end();
  });
}

// On crée un serveur http qui prend en option la méthode pour effectuer l'interception 
const server = http.createServer(parseIncomingRequest);

// On écoute sur le port 3000
server.listen(PORT, () => {
  console.log(`******************* PROXY STARTED ON http://localhost:${PORT} *******************\n`)
});

//Partie des tests pour le tls 

//On crée un serveur https avec une clé et un certificat qu'on va lire directement grâce à la librairie fs

const sslServer = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
  },
  //On utilise la même méthode que précédemment pour gérer les requêtes 
  parseIncomingRequest
)
//on écoute sur un port différent que celui du http 
sslServer.listen(3443, () => console.log('Secure server 🚀🔑 on port 3443'))