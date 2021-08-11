const token = require("./token.json");
const Discord = require("discord.js");
var fs = require("fs");
var _ = require("lodash");
var cronstrue = require("cronstrue");
const schedule = require("node-schedule");
const { time } = require("console");
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
  "Tip: `get article`, this will give you the list of categories available" +
  "\n" +
  "\n" +
  "Tip: `get article time`, this will give you the time at which you get the daily article" +
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
  "> 2. for time(in 24hr format): ```set article time [hour]:[mins]```" +
  "\n" +
  "ex: `set article time hour 14:20`, this will give the daily article at 2:20 pm";

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
var startDay = 0;
var endDay = 6;

//creating a empty cron expression
var cronExpression = `${rule.minute} ${rule.hour} * * ${startDay}-${endDay}`;

var dailyUpdatesChannel = null;

// fetching random article
function fetchRandomArticle(category) {
  lengthOfArticle = data[category].length;
  randomArticlePosition = Math.floor(Math.random() * lengthOfArticle);
  article = data[category][randomArticlePosition];
  if (category == "WILDCARD") {
    try {
      articleLink = article["Link to Article (from Article List)"][0];
    } catch (error) {
      console.log(error);
      dailyUpdatesChannel.send("An error occured, could you please try again");
    }
  } else {
    try {
      articleLink = article["Link to Article"];
    } catch (error) {
      console.log(error);
      dailyUpdatesChannel.send("An error occured, could you please try again");
    }
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
    dailyUpdatesChannel.send(fetchRandomArticle("WILDCARD"));
    cronExpression = `${rule.minute} ${rule.hour} * * ${startDay}-${endDay}`;
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
  dailyUpdatesChannel = msg.guild.channels.cache.find(
    (channel) => channel.name === "readsomethinggreat"
  );
  cronExpression = `${rule.minute} ${rule.hour} * * ${startDay}-${endDay}`;

  if (msg.author.bot) return;

  if (msg.content === "get help") {
    msg.channel.send({ embeds: [exampleEmbed] });
  }

  if (
    msg.content.startsWith("get article") ||
    msg.content.startsWith("Get article")
  ) {
    msgRecievied = msg.content.split(" ");
    if (msgRecievied.length == 2) {
      msg.channel.send(
        "```Here are the categories to read upon:" +
          "\n" +
          "1. Wildcard" +
          "\n" +
          "2. Living Better" +
          "\n" +
          "3. Business & Tech" +
          "\n" +
          "4. History & Culture" +
          "\n" +
          "5. Science & Nature```"
      );
    } else {
      if (msgRecievied.length == 3) {
        category = _.upperCase(msgRecievied[2]);
      } else {
        category = msgRecievied.slice(2);
        category = _.upperCase(category.join(" "));
      }
      if (categories.includes(category)) {
        msg.channel.send(fetchRandomArticle(category)).catch((err) => {
          console.log(err);
          msg.channel.send("```coudn't fetch the article at the moment :( ```");
        });
      } else {
        if (msgRecievied[2] == "time") {
          msg.channel.send(
            "The daily article will be coming " +
              cronstrue.toString(cronExpression)
          );
        } else {
          msg.channel.send(
            "```The specified category doesn't exists. The available categories are Wildcard, Living Better, Business & Tech, History & Culture, Science & Nature```"
          );
        }
      }
    }
  }

  if (msg.content.startsWith("set article ")) {
    setTimeCommand = msg.content.split(" ");
    if (setTimeCommand[2] == "days") {
      startDay = setTimeCommand[3];
      endDay = setTimeCommand[4];
      rule.dayOfWeek = [0, new schedule.Range(startDay, endDay)];
    }
    if (setTimeCommand[2] == "time") {
      var time = setTimeCommand[3].split(":");
      rule.hour = time[0];
      rule.minute = time[1];
      console.log(cronExpression);
      console.log(rule.dayOfWeek, rule.hour, rule.minute);
    }

    var cronExpression = `${rule.minute} ${rule.hour} * * ${startDay}-${endDay}`;
    msg.channel.send(
      "From now the daily article will be coming " +
        cronstrue.toString(cronExpression)
    );
    resetScheduler();
  }
});

//Token need in token.json
client.login(token.token);
