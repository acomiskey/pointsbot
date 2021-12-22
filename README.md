# BITIbot

BITIbot (Basic Invitable Thread Integration Bot) is a Discord bot for use in multi-fandom roleplay (MFRP) servers in order to automate some traditionally manual game mechanics like thread processing and ranking up.

## DEPENDENCIES

BITIbot uses the following tools and libraries:

- Node.js
- Discord.js
- better-sqlite3
- dotenv
- node-gyp

## CURRENT FUNCTIONALITY

As of 12/21/2021, BITIbot can:

1. Add users to her points database when they join the main server, and remove them automatically when they leave.
2. Grant a random number of points to users when they post in specific channels.
3. Track a user's patronage (for use with traditional MFRP sorting gameplay) and faction (for use with a user's job, guild, or other allegiance).
4. Allow adminstrators to manually add/remove points and set patronage and faction of users.
5. Compile threads, wherein she: 
  1. Counts the overall wordcount.
  2. Counts the wordcount of each participant.
  3. Counts the post count of each participant.
  4. Sets the thread type as defined by the user.
6. Perform debug commands like dumping a specified table in the points database.
7. Accept config information from config.json.

## PLANNED FUNCTIONALITY

In the future, BITIbot will be able to:

1. Add and remove moderators.
2. Add and remove affiliate servers. Affiliate servers will allow users to write and compile threads outside of the main server.
3. Allow administrators to review requests from users to add affiliate servers.
4. Allow administrators to review compiled threads, and disburse points automatically based on the thread's type.
5. Allow administrators to add new types of threads, which have their own descriptions, point values, and word count requirements.
6. Allow administrators to set custom rank-up thresholds and rewards.
7. Allow users to rank up automatically.

## USE INSTRUCTIONS

BITIbot is designed differently from some other Discord bots. Because one instance of BITIbot can be associated with several affiliate servers, you cannot use her in your own MFRP system by just inviting her to your server.

In order to add BITIbot to your server, you will need to download this repository and create your own Discord bot that uses it. More information about how to do this will be available once BITIbot is finished and stable.

## TERMS OF USE

If you duplicate BITIbot to use in your own server, you agree to add the following to its "ABOUT ME" section on Discord:

"This bot implements BITIbot. The original repository is available at github.com/acomiskey/pointsbot"

Additionally, you agree to add the following to your Discord server's "about" or "rules" channel, or to display it prominently on your Discord server's external website:

"This server uses BITIbot to track points. The original repository is available at github.com/acomiskey/pointsbot"
