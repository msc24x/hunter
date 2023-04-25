# Hunter

![](https://badgen.net/github/license/msc24x/hunter)
![](https://badgen.net/github/branches/msc24x/hunter)
![](https://badgen.net/github/commits/msc24x/hunter/arch)

Built to simplify the daliy coding competitions hosting for general public. Hunter gives you the ability to create your own coding competitions similar to what you see on other competitive sites, but with a lot of easy, simplicity and least maintainance.

### Latest: The site will now be available at https://hunter.cambo.in instead of https://thehunter.tech
### **I regret to inform you that I will be discontinuing this hobby project of mine in upcoming days due to some technical reasons. Hunter was a fun and challenging project that I enjoyed working on, but unfortunately I can no longer maintain it. I hope to resume it someday, but on a different domain. You will be notified here and on my Linkedin profile if and when that happens. Thank you for your support and interest in Hunter.**


## Live Status
![Azure](https://img.shields.io/badge/azure-%230072C6.svg?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Nginx](https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white)

![](https://badgen.net/https/hunter.cambo.in/api/status/users)
![](https://badgen.net/https/hunter.cambo.in/api/status/competitions)

The site is live and accessible at https://hunter.cambo.in

## Overview
Users can initiate with the free account and start creating competitions. Competitions are create on the basis of meta data users provide, such as title, description, length of competition, and more parameters. Host can add as many questions they like.

Other users who wish to just participate can get ready in the compete page, where all the competitions, which were made public by the other users, would appear. Any one can get started with them when they are live.

Users submit their solution code to the online judge built for Hunter, that detects the language, compiles it and test it against the test cases provided by the host user. The judge responds with the result. All the results would be public on a live scoreboard during the competition. Participants get ranks, based upon which they are benifited from the Hunter or the sponsers if exists. Normal challanging competitions are always present here, that are constantly added by the Hunter official account, to keep practicing your problem solving skills.

Note : Sign in using email has been temporarily disabled due to some technical issue regarding verification of emails. Hence the method has been replaced by GitHub OAuth for some time.

## Features

### Editor
This part of the Hunter allows users to create their custom competitions. They can edit the meta data and scheduling information & define their set of questions. All settings related to competition editing will be there. Users can access the Editor through clicking on any of their created competitions from the Editor page. Users can edit and create any number of competitions they want by just clicking on Create Competition button.

### Participation
Hunter provides clean and non distracting interfaces while participating in competitions. The module of the site is best designed to be viewed on desktops. Any one can participate in a 'Public' competitions whenever they are live. Users can view the questions that the competition contains and start writing code in their preffered language. 

### Code Execution
As the participants would be writing code, they have the access to the Hunter's online judge, that compiles, execute and test their submissions against the preset tests defined by the host. Users have the ability to test against the full cases or just the samples cases. Meanwhile, Hunter keep users' last submission saved on its servers, so that the participants do not loose their code due to unexpected exits.

### Scoreboard
Any successful or wrong submissions are evaluated, whose results the participant can see right next to the output in the Evaluation box. All the results for any question will be displayed there. They will get the defined score for the successful submission and one penality for each wrong submission pre success.

The results of all the questions are accumulated for all the participants in the live scoreboard that rank wise displays their performance.

## Contribute
![Angular](https://img.shields.io/badge/angular-%23DD0031.svg?style=for-the-badge&logo=angular&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

Clone the `main` branch. Run `ng serve` in project root folder to run the Angular UI. Change working directory to `/server` folder, and run `npm start` to run the backend for Hunter. 
