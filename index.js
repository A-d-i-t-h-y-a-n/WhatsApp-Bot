const {
	default: makeWASocket,
	useMultiFileAuthState,
	DisconnectReason,
	Browsers,
	makeInMemoryStore,
	fetchLatestBaileysVersion,
	delay,
	makeCacheableSignalKeyStore
} = require('@adiwajshing/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const config = require('./config');
const { Message, commands, numToJid, sudoIds, PREFIX } = require('./lib/index');
const axios = require('axios');

/* async function saveJsonToFile(folder, id) {
	try {
		const session = {};
		const fixFileName = (file) => file?.replace(/\//g, '__')?.replace(/:/g, '-');
		for (const objectName in session) {
			if (session.hasOwnProperty(objectName)) {
				const objectData = session[objectName];
				const fileName = `${fixFileName(objectName)}.json`;
				const serializedData = JSON.stringify(objectData);
				fs.writeFileSync(`${folder}/${fileName}`, serializedData);
			}
		}
	} catch (error) {}
} */

const connect = async () => {
	fs.readdirSync('./plugins').forEach(plugin => {
		if (path.extname(plugin).toLowerCase() == '.js') {
			require('./plugins/' + plugin);
		}
	});

	const { state, saveCreds } = await useMultiFileAuthState('auth');
	const { version, isLatest } = await fetchLatestBaileysVersion();
	const logger = pino({ level: 'silent' });
const connectToWhatsApp = async () => {
	const client = makeWASocket({
		logger,
		printQRInTerminal: true,
		downloadHistory: false,
		syncFullHistory: false,
		browser: Browsers.macOS('Desktop'),
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
		version,
	});
	
	client.ev.on('connection.update', async (node) => {
		const { connection, lastDisconnect } = node;
		if (connection == 'open') {
			console.log("Connecting to Whatsapp...");
			console.log('connected');
			await delay(5000);
			const sudo = numToJid(config.SUDO.split(',')[0]) || client.user.id;
			await client.sendMessage(sudo, { text: '*BOT CONNECTED*\n\n```PREFIX : ' + PREFIX + '\nPLUGINS : ' + commands.filter(command => command.pattern).length + '\nVERISON : ' + require('./package.json').version + '```'});
		}
		if (connection === 'close') {
			// const { error, message } = lastDisconnect.error?.output.payload;
			if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
				await delay(300);
				connectToWhatsApp();
				console.log('reconnecting...');
				console.log(node)
			} else {
				console.log('connection closed');
				await delay(3000);
				process.exit(0);
			}
		}
	});
	
	client.ev.on('creds.update', saveCreds);

	client.ev.on('messages.upsert', async (upsert) => {
		if (!upsert.type === 'notify') return;
		msg = upsert.messages[0];
		if (!msg.message) return;
		const message = new Message(client, msg);
		if (config.LOG_MSG && !message.data.key.fromMe) console.log(`[MESSAGE] [${message.pushName || message.sender.split('@')[0]}] : ${message.text || message.type || null}`);
		if (config.READ_MSG == true && message.data.key.remoteJid !== 'status@broadcast') await client.readMessages([message.data.key]);
		commands.map(async (command) => {
			const messageType = {
				image: 'imageMessage',
				sticker: 'stickerMessage',
				audio: 'audioMessage',
				video: 'videoMessage',
			};

			const isMatch =
				(command.on && messageType[command.on] && message.msg && message.msg[messageType[command.on]] !== null) ||
				(!command.pattern || command.pattern.test(message.text)) ||
				(command.on === 'text' && message.text) ||
				(command.on && !messageType[command.on] && !message.msg[command.on]);

			if (isMatch) {
				if (command.pattern && config.READ_CMD == true) await client.readMessages([message.data.key]);
				const match = message.text?.match(command.pattern) || '';

				try {
					await command.function(message, match.length === 6 ? (match[3] ?? match[4]) : (match[2] ?? match[3]), client);
				} catch (e) {
					if (config.ERROR_MSG) {
						console.log(e)
						const sudo = numToJid(config.SUDO.split(',')[0]) || client.user.id;
						await client.sendMessage(sudo, { text: '```─━❲ ERROR REPORT ❳━─\n\nMessage : ' + message.text + '\nError : ' + e.message + '\nJid : ' + message.jid + '```'}, { quoted: message.data });
					}
				}
			}
		});
	});
	return client;
};

connectToWhatsApp()
};

connect()