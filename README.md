# bunchofsongs_bot
Telegram Bot for musicians, educators, sound engineers and people in general to share audio tracks.

Summary:

This project is a sample Telegram bot that allows you process specific messages, mainly audio, to display them in a web site to be public.

Requirements:
- Node.js (v14)
- Firebase Project and Database: https://firebase.google.com/docs/admin/setup#set-up-project-and-service-account
- Telegram Bot Token: https://core.telegram.org/bots#6-botfather

How to run it locally:
1. `git clone https://github.com/gilpanal/bunchofsongs_bot.git`
2. `cd bunchofsongs_bot`
3. `npm i`
5. Adapt `account_dev.json`. More info: https://firebase.google.com/docs/admin/setup#initialize-sdk
6. Modify `.env` file to include the Bot Token and the Firebase DB URL
7. `npm start`
8. Open http://localhost:8125

NOTE: In `.env` file there's a key named MODE that is meant for testing different environments, PROD or DEV. 
For local development is enough with the following configuration:

>       MODE=DEV
>       TELEGRAM_TOKEN=""
>       TELEGRAM_TOKEN_DEV=<BOT_TOKEN>
>       DATABASE_URL=""
>       DATABASE_URL_DEV=https://<YOUR_PROJECT>.firebaseio.com

Same happens with `account.json` file, it's only required when using MODE=PROD.

Once the steps above are followed, to properly test the bot you need to:

1. Go to Telegram and create a new channel or group.
2. Add the bot as an admin to the group.
3. Type something in the chat group or directly record something with your voice.
4. Go to http://localhost:8125 and check the name of the channel/group is visible.
