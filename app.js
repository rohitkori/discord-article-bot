const token = require("./token.json");
const Discord = require("discord.js");
var fs = require("fs");
var _ = require("lodash");
const schedule = require("node-schedule");
var data = fs.readFileSync("data.json");

// parsing data.json
data = JSON.parse(data);

// creating client
const client = new Discord.Client({
  intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
});

// categories
categories = [
  "WILDCARD",
  "LIVING BETTER",
  "BUSINESS TECH",
  "HISTORY CULTURE",
  "SCIENCE NATURE",
];

// command message
var command =
  "1. **For getting a random article**: ```get article [category]``` " +
  "\n" +
  "ex: `get article wildcard`, this will fetch a random article form wildcard category" +
  "\n" +
  "\n" +
  "2. **For setting time of daily message**:" +
  "\n" +
  "\n" +
  "> 1. for days(in integers from 0-6): ```set article days [startDay] [endDay]```" +
  "\n" +
  "ex: `set article days 0 6`, this will set the days as SUN-SAT" +
  "\n" +
  "\n" +
  "> 2. for hours(in 24hr format): ```set article time  hour [hour]```" +
  "\n" +
  "ex: `set article time hour 14`, this will give the daily article at 2pm" +
  "\n" +
  "\n" +
  "> 3. For minutes: ```set article time mins [minutes]```" +
  "\n" +
  "ex: `set article time mins 25`, this will set the min as 25 like 2:25pm";

// embed command message
const exampleEmbed = new Discord.MessageEmbed()
  .setColor("#FF3F3F")
  .setTitle("readsomethinggreat")
  .setURL("https://www.readsomethinggreat.com/")
  .setDescription(
    "A bot that gives a random article from readsomethinggreat.com"
  )
  .setThumbnail("https://i.imgur.com/vugPtoT.png")
  .addFields(
    {
      name: "Categories",
      value:
        "Wildcard, Living Better, Business & Tech, History & Culture, Science & Nature",
    },
    { name: "\u200B", value: "\u200B" },
    {
      name: "Commands",
      value: command,
      inline: true,
    }
  )
  .setTimestamp()
  .setFooter("Happy Reading", "https://i.imgur.com/vugPtoT.png");

const rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(0, 6)];
rule.hour = 10;
rule.minute = 00;

// fetching random article
function fetchRandomArticle(category) {
  lengthOfArticle = data[category].length;
  randomArticlePosition = Math.floor(Math.random() * lengthOfArticle);
  article = data[category][randomArticlePosition];
  if (category == "WILDCARD") {
    articleLink = article["Link to Article (from Article List)"][0];
  } else {
    articleLink = article["Link to Article"];
  }
  data[category] =
    data[category][(0, randomArticlePosition)] +
    data[category][(randomArticlePosition + 1, lengthOfArticle)];
  data[category] =
    _.slice(data[category], 0, randomArticlePosition) +
    _.slice(data[category], randomArticlePosition + 1, lengthOfArticle);
  return articleLink;
}

// resetting schedule after changing timings
function resetScheduler() {
  const job = schedule.scheduleJob(rule, function () {
    client.channels.cache
      .get("token.channelId")
      .send(fetchRandomArticle("WILDCARD"));
  });
}

//Playing Message
client.on("ready", async () => {
  console.log(
    `${client.user.username} is online on ${client.guilds.cache.size} servers!`
  );

  client.user.setActivity("Article", { type: "PLAYING" });

  resetScheduler();
});

// handling on message events
client.on("message", (msg) => {
  if (msg.author.bot) return;

  if (msg.content === "get help") {
    msg.channel.send({ embeds: [exampleEmbed] });
  }

  if (
    msg.content.startsWith("get article") ||
    msg.content.startsWith("Get article")
  ) {
    category = _.upperCase(msg.content.split("get article ")[1]);
    if (categories.includes(category)) {
      msg.channel.send(fetchRandomArticle(category)).catch((err) => {
        console.log(err);
        msg.channel.send("coudn't fetch the article at the moment :( ");
      });
    } else {
      msg.channel.send(
        "The specified category doesn't exists. The available categories are Wildcard, Living Better, Business & Tech, History & Culture, Science & Nature"
      );
    }
  }

  if (msg.content.startsWith("set article ")) {
    setTimeCommand = msg.content.split(" ");
    console.log(setTimeCommand);
    if (setTimeCommand[2] == "days") {
      startDay = setTimeCommand[3];
      endDay = setTimeCommand[4];
      rule.dayOfWeek = [0, new schedule.Range(startDay, endDay)];
    }
    if (setTimeCommand[3] == "hour") {
      rule.hour = setTimeCommand[4];
    }
    if (setTimeCommand[3] == "mins") {
      rule.minute = setTimeCommand[4];
    }

    resetScheduler();
  }
});

//Token need in token.json
client.login(token.token);
