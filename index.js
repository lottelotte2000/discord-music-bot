const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { Player } = require('discord-player');

// ใช้ token จาก Environment Variables
const token = process.env.TOKEN;

// สร้าง Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ตั้งค่า Player
const player = new Player(client);

// เมื่อ Player พร้อมใช้งาน
player.events.on('playerStart', (queue, track) => {
  const channel = queue.metadata.channel;
  channel.send(`🎵 กำลังเล่นเพลง: **${track.title}**`);
});

// เมื่อ Bot พร้อมใช้งาน
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// จัดการคำสั่งต่างๆ
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const prefix = '!'; // คำนำหน้าคำสั่ง เช่น !play

  // ตรวจสอบว่าข้อความเริ่มต้นด้วย prefix หรือไม่
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // คำสั่งเล่นเพลง !play [URL หรือ ชื่อเพลง]
  if (command === 'play') {
    if (!args[0]) return message.reply('กรุณาระบุชื่อเพลงหรือ URL');
    
    // ตรวจสอบว่าผู้ใช้อยู่ในห้องเสียงหรือไม่
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('คุณต้องอยู่ในห้องเสียงก่อนใช้คำสั่งนี้');
    }

    try {
      const { track } = await player.play(voiceChannel, args.join(' '), {
        nodeOptions: {
          metadata: {
            channel: message.channel,
          }
        }
      });

      const embed = new EmbedBuilder()
        .setTitle('เพิ่มเพลงเข้าคิว')
        .setDescription(`**${track.title}**`)
        .setThumbnail(track.thumbnail)
        .addFields(
          { name: 'ระยะเวลา', value: track.duration, inline: true },
          { name: 'ขอโดย', value: `${message.author}`, inline: true }
        )
        .setColor('#00FF00');

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return message.reply('เกิดข้อผิดพลาดในการเล่นเพลง');
    }
  }

  // คำสั่งข้ามเพลง !skip
  if (command === 'skip') {
    const queue = player.nodes.get(message.guild.id);
    if (!queue) return message.reply('ไม่มีเพลงที่กำลังเล่นอยู่');

    queue.node.skip();
    return message.reply('⏭️ ข้ามเพลงแล้ว');
  }

  // คำสั่งหยุดเพลง !stop
  if (command === 'stop') {
    const queue = player.nodes.get(message.guild.id);
    if (!queue) return message.reply('ไม่มีเพลงที่กำลังเล่นอยู่');

    queue.delete();
    return message.reply('⏹️ หยุดเล่นเพลงและออกจากห้องเสียงแล้ว');
  }

  // คำสั่งดูคิว !queue
  if (command === 'queue') {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || !queue.node.isPlaying()) return message.reply('ไม่มีเพลงที่กำลังเล่นอยู่');

    const currentTrack = queue.currentTrack;
    const tracks = queue.tracks.data;

    const embed = new EmbedBuilder()
      .setTitle('คิวเพลง')
      .setDescription(`กำลังเล่น: **${currentTrack.title}**\n\n${
        tracks.length ? 
        tracks.map((track, i) => `${i + 1}. **${track.title}**`).join('\n') : 
        'ไม่มีเพลงในคิว'
      }`)
      .setColor('#00FF00');

    return message.reply({ embeds: [embed] });
  }
});

// ล็อกอินด้วย token จาก Environment Variables
client.login(token);