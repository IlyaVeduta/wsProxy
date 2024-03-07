/**
 * Dependencies
 */
const WebSocket = require('ws');
const mes = require('./message');

/**
 * Constructor
 */
class Proxy {
	constructor(ws) {
		mes.log("request: " + ws.upgradeReq.url.substr(1))
		this._ws = ws;
		this._from = ws._socket.remoteAddress;
		this._to   = ws.upgradeReq.url.substr(1);
		// Bind data
		this._ws.on('message', this.clientData.bind(this));
		this._ws.on('close', this.close.bind(this));
		this._ws.on('error', this.close.bind(this));

		// Create a WebSocket connection to the server
		this._serverSocket = new WebSocket("wss://" + this._to);

		this._serverSocket.on('message', this.serverData.bind(this));

		this._serverSocket.on('open', () => {
			this.connectAccept();
		});

		this._serverSocket.on('close', () => {
			this.close();
		});

		this._serverSocket.on('error', (error) => {
			console.error(error);
			this.close();
		});
	}

	/**
	 * OnClientData
	 * Client -> Server
	 */
	clientData(data) {
		if (!this._serverSocket || this._serverSocket.readyState !== WebSocket.OPEN) {
			// WebSocket not initialized yet or not open
			return;
		}

		try {
			this._serverSocket.send(data);
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * OnServerData
	 * Server -> Client
	 */
	serverData(data) {
		try {
			this._ws.send(data, (error) => {
				if (error !== null) {
					this.close();
				}
			});
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * OnClose
	 * Clean up events/sockets
	 */
	close() {
		if (this._serverSocket) {
			mes.info(`Connection closed from '${this._to}'.`);
			this._serverSocket.close();
		}

		if (this._ws) {
			mes.info(`Connection closed from '${this._from}'.`);
			this._ws.close();
		}
	}

	/**
	 * On server accepts connection
	 */
	connectAccept() {
		mes.status(`Connection accepted from '${this._from}'.`);
	}
}

module.exports = Proxy;
