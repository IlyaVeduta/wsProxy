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
		this._ws = ws;
		this._from = ws._socket.remoteAddress;
		this._to   = ws.upgradeReq.url.substr(1).replace(/^websocket\//, '');
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
			mes.error(error);
			this.close();
		});
	}

	/**
	 * OnClientData
	 * Client -> Server
	 */
	clientData(data) {
		if (!this._serverSocket || this._serverSocket.readyState !== WebSocket.OPEN) {
			return;
		}

		try {
			this._serverSocket.send(data);
		} catch (e) {
			mes.error(e);
		}
	}

	/**
	 * OnServerData
	 * Server -> Client
	 */
	serverData(data) {
		try {
			this._ws.send(data, (error) => {
				if (error !== undefined) {
					mes.error(error);
					this.close();
				}
			});
		} catch (e) {
			mes.error(e);
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
