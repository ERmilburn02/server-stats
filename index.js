const Settings = require('./Settings.json');
const Discord = require('discord.js');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const client = new Discord.Client();
client.login(Settings.token);

async function updateCounters(gm) {
  let all = gm.guild.memberCount;
  await db
    .get('members')
    .find({ id: gm.guild.id })
    .assign({ users: all })
    .write();
  let g = await db.get('members').find({ id: gm.guild.id }).value();
  if (g.allID == '-1') return;
  let c = await client.channels.fetch(g.allID);
  c.setName(`Member count: ${g.users}`);
}

client.on('guildMemberAdd', (gm) => updateCounters(gm));
client.on('guildMemberRemove', (gm) => updateCounters(gm));
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity(`people leaving and joining`, { type: 'WATCHING' });
});

client.on('message', async (message) => {
  let g = message.guild;
  let _dbCheck = await db.get('members').find({ id: g.id }).value();
  if (_dbCheck == undefined) {
	  db.get('members')
        .push({ id: g.id, allID: '-1', users: g.memberCount })
        .write();
    }
  if (message.content.toLowerCase().startsWith('.setchannel')) {
    if (message.member.hasPermission('MANAGE_CHANNELS', false, true, true)) {
      let id = message.content.substring(12);
      if (!isNaN(id)) {
        client.channels.fetch(id).catch(() => {
          return message.reply('channel not found.');
        });
        let t;
        let n;
        await client.channels.fetch(id).then((channel) => {
          t = channel.type;
          n = channel.name;
        });
        if (t != 'voice')
          return message.reply(
            `please use a valid voice channel id. Recieved type: ${t}`
          );
        await db
          .get('members')
          .find({ id: message.guild.id })
          .assign({ allID: id })
          .write();
        message.channel.send(
          `Set the counter channel to #${n}, now updating counter.`
        );
        updateCounters(message);
      } else return message.reply('An error occurred cause Eliza is a dumbo.');
    } else
      return message.reply("you don't have permission to run that command.");
  } else if (message.content.toLowerCase() == '.update') {
    updateCounters(message)
      .then(message.react('👍'))
      .catch((error) => {
        console.log(error);
        message.reply('an error occurred. Try again later.');
      });
  }
});

client.on('guildCreate', (g) => {
  db.get('members')
    .push({ id: g.id, allID: '-1', users: g.memberCount })
    .write();
});
client.on('guildDelete', (g) => {
  db.get('members').remove({ id: g.id }).write();
});
