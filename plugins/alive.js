const { Index, mode, formatTime } = require('../lib/');

Index({
	pattern: 'ping ?(.*)',
	fromMe: mode,
	desc: 'Bot response in milliseconds.',
	type: 'info'
}, async (message, match, client) => {
	const start = new Date().getTime();
	const msg = await message.reply('*ᴩɪɴɢ...*');
	const end = new Date().getTime();
	const responseTime = end - start;
	await message.reply(`*pong!*\nʟᴀᴛᴇɴᴄʏ: ${responseTime}ms`);
});

Index({
	pattern: 'jid',
	fromMe: mode,
	desc: 'To get remoteJid',
	type: 'whatsapp'
}, async (message) => {
	await message.reply(message.mentionedJid[0] ? message.mentionedJid[0] : message.quoted ? message.quoted.sender : message.chat)
});

Index({
	pattern: 'uptime',
	fromMe: mode,
	desc: 'Get bots runtime',
	type: 'info'
}, async (message, match, client) => {
	await message.reply(formatTime(process.uptime()));
})