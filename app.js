const Discord = require("discord.js");
var fs = require("fs");
var _ = require("lodash");
var cronstrue = require("cronstrue");
const schedule = require("node-schedule");
var articles = fs.readFileSync("articles.json");
const dotenv = require('dotenv').config();
const { scheduleJob } = require("node-schedule");

// parsing articles.json
articles = JSON.parse(articles);

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

categoryNames = [
  "1. Wildcard",
  "2. Living Better",
  "2. Business & Tech",
  "3. History & Culture",
  "4. Science & Nature",
];

const prefix = dotenv.parsed.PREFIX;
// command message
var command =
  "1. **For getting a random article**:" + "```" + prefix + "get article[category]``` " +
  "\n" +
  "ex: " + "`" + prefix + "get article wildcard`, this will fetch a random article form wildcard category" +
  "\n" +
  "\n" +
  "Tip: " + "`" + prefix + "get article`, this will give you the list of categories available" +
  "\n" +
  "\n" +
  "Tip: " + "`" + prefix + "get article time`, this will give you the time at which you get the daily article" +
  "\n" +
  "\n" +
  "2. **For setting time of daily message**:" +
  "\n" +
  "\n" +
  "> 1. for days(in integers from 0-6): " + "```" + prefix + "set article days[startDay][endDay]```" +
  "\n" +
  "ex: " + "`" + prefix + "set article days 0 6`, this will set the days as SUN-SAT" +
  "\n" +
  "\n" +
  "> 2. for time(in 24hr format): " + "```" + prefix + "set article time[hour]: [mins]```" +
  "\n" +
  "ex: " + "`" + prefix + "set article time 14: 20`, this will give the daily article at 2:20 pm";

// embed command message
const exampleEmbed = new Discord.MessageEmbed()
  .setColor("#FF3F3F")
  .setTitle("readsomethinggreat")
  .setURL("https://www.readsomethinggreat.com/")
  .setAuthor(
    "Buy me a coffee",
    "https://i.imgur.com/vugPtoT.png",
    "https://www.buymeacoffee.com/rahulgopathi"
  )
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

const ruleForBMC = new schedule.RecurrenceRule();
ruleForBMC.dayOfWeek = [0, new schedule.Range(dotenv.parsed.daysofWeek_BMCLink)];
ruleForBMC.hour = dotenv.parsed.hour_BMCLink;
ruleForBMC.minute = dotenv.parsed.minute_BMCLink;
ruleForBMC.second = dotenv.parsed.second_BMCLink;

//creating a empty cron expression
var cronExpression = `${rule.minute} ${rule.hour} * * ${startDay}-${endDay} `;
var dailyUpdatesChannel = null;

// fetching random article
function fetchRandomArticle(category) {
  var numberofArticles = articles[category].length;
  var randomArticlePosition = Math.floor(Math.random() * numberofArticles);
  article = articles[category][randomArticlePosition];
  if (category == "WILDCARD") {
    try {
      articleLink = article["Link to Article"][0];
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
  articles[category].splice(randomArticlePosition, 1);
  console.log("Generated random article succesfully");
  return articleLink;
}
//bmc link schedule
function BMCLinkScheduler() {
  const job = schedule.scheduleJob(ruleForBMC, function () {
    client.guilds.cache.each((guild) => {
      try {
        const channel =
          guild.channels.cache.find(
            (channel) => channel.name === "readsomethinggreat"
          ) || guild.channel.cache.first();
        if (channel) {
          channel.send("**Buy me a Coffee link**- " + dotenv.parsed.BMC_Link);
          console.log("link send");
        } else {
          console.log("link not send");
        }
      } catch (err) {
        console.log('error is there');
      }
    });
  });
}

// resetting schedule after changing timings
function resetScheduler() {
  // if (rule.minute < 30) {
  //   rule.hour = rule.hour - 1;
  //   rule.minute = parseInt(rule.minute) + 30;
  // } else {
  //   rule.hour = rule.hour;
  //   rule.minute = parseInt(rule.minute) - 30;
  // }
  console.log(rule);
  const job = schedule.scheduleJob(rule, function () {
    articleLink = fetchRandomArticle("WILDCARD");
    client.guilds.cache.each((guild) => {
      try {
        const channel =
          guild.channels.cache.find(
            (channel) => channel.name === "readsomethinggreat"
          ) || guild.channels.cache.first();
        if (channel) {
          channel.send(articleLink);
          console.log("sent the daily article to channels");
        } else {
          console.log("The server " + guild.name + " has no channels.");
        }
      } catch (err) {
        console.log("Could not send message to " + guild.name + ".");
      }
    });
    cronExpression = `${rule.minute} ${rule.hour} * * ${startDay}-${endDay} `;
  });
}

// const request = require('request');
// const { url } = require("inspector");
// const base64Credentials = Buffer.from('kori.1@iitj.ac.in:mgrz0ws0av6OQ5ZSJzVZ').toString('base64')
// const options = {
//   url: 'https://api.urlmeta.org/?url=https://theprofile.substack.com/p/why-the-worlds-most-confident-people',
//   headers: {
//     'Authorization': 'Basic ' + base64Credentials
//   }
// }

// function callback(error, response, body) {
//   if (!error && response.statusCode === 200) {
//     let data = JSON.parse(body)

//     if (data.result.status == 'OK') {
//       console.log(data.meta)
//       image = data.meta["image"];
//     } else {
//       console.log(data.result.reason)
//     }
//   } else {
//     console.log(error, body)
//   }
// }

// request(options, callback)

//Playing Message
client.on("ready", async () => {
  console.log(
    `${client.user.username} is online on ${client.guilds.cache.size} servers!`
  );

  client.user.setActivity("Article", { type: "PLAYING" });

  resetScheduler();
  BMCLinkScheduler();
});

// handling on message events
client.on("message", (msg) => {
  cronExpression = `${rule.minute} ${rule.hour} * * ${startDay}-${endDay} `;

  if (msg.author.bot) return;

  if (msg.content === prefix + "get help") {
    msg.channel.send({ embeds: [exampleEmbed] })
  }

  if (
    msg.content.startsWith(prefix + "get article") ||
    msg.content.startsWith(prefix + "Get article")
  ) {
    msgRecievied = msg.content.split(" ");
    if (msgRecievied.length == 2) {
      msg.channel.send(
        "```" +
        `Here are the  article categories to read upon:\n${categoryNames.join(
          "\n"
        )}` +

        "```"
      );
    } else {
      if (msgRecievied.length == 3) {
        category = _.upperCase(msgRecievied[2]);
      } else {
        category = msgRecievied.slice(2);
        category = _.upperCase(category.join(" "));
      }
      if (categories.includes(category)) {

        msg.channel.send(fetchRandomArticle(category))
          .then((embed) => {
            embed.react('⬆'),
              embed.react("⬇️")
          })
          .catch((err) => {
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
            "```The specified category doesn't exists. The available categories are:\n" +
            `${categoryNames.join("\n")}` +
            "```"
          );
        }
      }
    }
  }

  if (msg.content.startsWith(prefix + "set article ")) {
    correctTimeProvided = false;
    setTimeCommand = msg.content.split(" ");
    if (setTimeCommand[2] == "days") {
      try {
        if (
          // setTimeCommand.lenght != 5
          // setTimeCommand[3] == "" ||
          // setTimeCommand[4] == ""
          setTimeCommand.length === 5 &&
          setTimeCommand[3] != "" &&
          setTimeCommand[4] != ""
        ) {
          if (setTimeCommand[3] < 7 && setTimeCommand[4] < 7 && setTimeCommand[3] >= 0 && setTimeCommand[4] >= 0) {
            startDay = setTimeCommand[3];
            endDay = setTimeCommand[4];
            rule.dayOfWeek = [0, new schedule.Range(startDay, endDay)];
            correctTimeProvided = true;
          } else {
            msg.channel.send(
              "```Please sepecify Days from 0 to 6.\nEx: " + prefix + "set article days 0 6```"
            )
          }
        } else if (setTimeCommand.length != 5) {
          msg.channel.send(
            "```Please sepecify time after the command.\nEx: " + prefix + "set article days 0 6```"
          )
        }
      } catch (error) {
        console.log(error);
        msg.channel.send(
          "```Please specify days in [startDay] [endDay] format ```"
        );
      }
    } else if (setTimeCommand[2] == "time") {
      try {
        var time = setTimeCommand[3].split(":");
        if (time.length !== 2 || time[0] == "" || time[1] == "") {
          msg.channel.send(
            "```Please specify time in [hours]:[minutes] format ```"
          );
        } else if (time[0] > 23 || time[1] > 59 || time[0] < 0 || time[1] < 0) {
          msg.channel.send("```Hour should be less than 24 & Minute should be less than 60```");
          correctTimeProvided = true;
        } else if (time[0] < 23 || time[1] < 59 || time[0] >= 0 || time[1] >= 0) {
          rule.hour = time[0];
          rule.minute = time[1];
          correctTimeProvided = true;
        }
      }
      catch (error) {
        console.log(error);
        msg.channel.send(
          "```Please sepecify time after the command.\nEx: " + prefix + "set article time hour 14:20```"
        );
      }
    } else {
      msg.channel.send(
        "```wrong command :( please type [" + prefix + "get help] for the commands```"
      );
    }

    var updatedcronExpression = `${rule.minute} ${rule.hour} * * ${startDay}-${endDay}`;
    console.log(updatedcronExpression);
    console.log(cronExpression);
    if (correctTimeProvided == true) {
      msg.channel.send(
        "From now the daily article will be coming " +
        cronstrue.toString(updatedcronExpression)
      );
      cronExpression = updatedcronExpression;
    } else {
      msg.channel.send(
        "```The daily article time is already " +
        cronstrue.toString(updatedcronExpression) +
        "```"
      );
    }
    resetScheduler();
  }
});


//Token need in token.json
client.login(dotenv.parsed.TOKEN);
