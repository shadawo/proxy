# HTTP Proxy en js et début de celui en HTTPS
    Pour celui en https les certificats ont été généré avec openssl :
    openssl genrsa -out key.pem
    openssl req -new -key key.pem -out csr.pem
    openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem

# TUTO
    Prérequis : node js, npm
    cd proxy
    npm install pour installer les dependances 
    node proxy.js
    setup le proxy sur le navigateur : 
    port 3000 pour le http (fonctionnel) 
    port 3443 pour le https(non fonctionnel) ajouter le certificat cert.pem dans le navigateur.
