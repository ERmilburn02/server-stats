const Discord = require('discord.js');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);
const client = new Discord.Client();
client.login(process.env.test_bot);

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
client.on('ready', () => console.log('running'));

client.on('message', async (message) => {
  if (message.content.toLowerCase().startsWith('.setchannel')) {
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
