# beatbytebot
Telegram Bot for musicians, educators, sound engineers and people in general to share audio tracks.

## Summary:

This project is a simple Telegram bot that allows you process specific messages, mainly audio, to display them in a web site to be public.

## Demo:
If you want to see it in action just follow these steps:
1. In Telegram, create a new channel or group
2. Add the bot called "bunchofsongsbot" as an admin to the chat
3. Record something or attach an audio file
4. Visit: https://sheltered-meadow-50218.herokuapp.com/ and check the content was successfully created
5. Visit https://bunchofsongs.web.app/ to actually listen to your audio tracks

Current features: https://github.com/gilpanal/beatbytebot/wiki/Current-Features

## Requirements:
- Node.js (v14)
- Firebase Project and Database: https://firebase.google.com/docs/admin/setup#set-up-project-and-service-account
- Telegram Bot Token: https://core.telegram.org/bots#6-botfather

## How to run it locally:
1. `git clone https://github.com/gilpanal/beatbytebot.git`
2. `cd beatbytebot`
3. `npm i`
5. Rename `config/account_template.json` to `config/account.json` and fill it with the correct information. More details: https://github.com/gilpanal/beatbytebot/wiki/Firebase-Setup
6. Rename `config/env_vars_template.js` to `config/env_vars.js` and include the Bot Token and the Firebase DB URL
7. `npm start`
8. Open http://localhost:8125

NOTE: In `config/env_vars.js` file there's a variable named MODE that is meant for deploying to different environments, PROD, STAGE or DEV. For local development is enough with the following configuration:

>       const MODE = 'PROD' // DEV, STAGE, PROD
>       const ENVIRONMENTS = {
>           PROD : {
>               TELEGRAM_TOKEN: '<BOT_TOKEN>',
>               DATABASE_URL: 'https://<YOUR_PROJECT>.firebaseio.com',
>               ACCOUNT_FILE: './config/account.json'
>           },

## More info:

Wiki: https://github.com/gilpanal/beatbytebot/wiki

Project Dev Board: https://github.com/gilpanal/beatbytebot/projects/1
