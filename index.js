#!/usr/bin/env node

const FEED = "https://feeds.simplecast.com/CFoB8_L_";
const MP3 =
  "https://cdn.simplecast.com/audio/203532/20353245-70c1-4ce1-99f1-1b04ab09427c/9d768eb6-b7e7-4a4e-9952-739da7cff46f/react_delivery_1_lindsey_kopacz_6_24_19_10_48_pm_tc.mp3?aid=rss_feed";

const Parser = require("rss-parser");
const parser = new Parser();

const request = require("request");
const lame = require("lame");
const Speaker = require("speaker");
const term = require("terminal-kit").terminal;
const chalk = require("chalk");
const boxen = require("boxen");

const speaker = new Speaker();

function terminate() {
  term.clear();
  term.grabInput(false);
  speaker.end();
  setTimeout(function() {
    process.exit();
  }, 100);
}

(async () => {
  let feed = await parser.parseURL(FEED);
  term.fullscreen(true);
  console.log(chalk.yellow("Welcome to the React Delivery Podcast"));
  console.log(
    boxen(`📦${chalk.black.bgYellow.bold(`\nReact\nDelivery`)}`, {
      padding: {
        top: 1,
        bottom: 1,
        left: 2,
        right: 2
      },
      backgroundColor: "yellow",
      borderColor: "black"
    })
  );

  term.cyan(`Subscribe at https://react.delivery`);
  term("\n");

  term.singleColumnMenu(
    feed.items.map(item => {
      return `${item.title} - Length ${item.itunes.duration}`;
    }),
    function(error, response) {
      const item = feed.items[response.selectedIndex];
      const timeInSeconds = item.itunes.duration
        .split(":")
        .reduce((time, section, i) => {
          if (i === 0) {
            return time + Number(section) * 60 * 60;
          } else if (i === 1) {
            return time + Number(section) * 60;
          } else if (i === 2) {
            return time + Number(section);
          }
        }, 0);
      var progressBar,
        progress = 0;

      term.yellow.bold("Summary");
      term("\n");
      term.wrapColumn({ x: 1, width: 70 });
      term.wrap(item.itunes.summary);
      term("\n");
      term("\n");
      const req = request(item.enclosure.url);
      req.pipe(new lame.Decoder()).pipe(speaker);
      term.red("Press Ctrl-C to stop playback");

      term.insertLine(3);

      function doProgress() {
        progress += 1 / timeInSeconds;
        progressBar.update(progress);
        if (progress >= 1) {
          // Cleanup and exit
          setTimeout(function() {
            term("\n");
            process.exit();
          }, 200);
        } else {
          setTimeout(doProgress, 1000);
        }
      }

      progressBar = term.progressBar({
        width: 80,
        title: "Track Progress",
        inline: true,
        syncMode: true
      });

      doProgress();
      term.on("key", function(name, matches, data) {
        if (name === "CTRL_C") {
          terminate();
        }
      });
    }
  );
})();
