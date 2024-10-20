# Hunter: Programming Contest Hosting Platform

![](https://badgen.net/github/license/msc24x/hunter)
![](https://badgen.net/github/branches/msc24x/hunter)
![](https://badgen.net/github/commits/msc24x/hunter/main)

Built to simplify the daily coding competitions hosting in general. Hunter gives you the ability to create your own coding competitions and necessary features to maintain and judge your participants.

Visit at [hunter.cambo.in](https://hunter.cambo.in)

## Analytics

![](https://badgen.net/https/hunter.cambo.in/api/status/users)
![](https://badgen.net/https/hunter.cambo.in/api/status/competitions)

## Overview

Users can sign up with Github for the free account and start creating competitions. Along with the competition meta data and scheduling information, you can add questions to your contest. Host can add as many questions they like. A question will consists of statement, sample test cases and final test cases. Each question can have positive and negative marking according to your requirement.

On the side of the participants, users who wish to just participate can get ready in the compete page, where all the competitions, which were made public by the hosts, would appear. Any one can get started with them when they are live. Users can submit the code, test them again samples and final submit and track their performance.

Users submit their solution code to the online judge built for Hunter, that detects the language, compiles it and test it against the test cases provided by the host user. All this is done by a homegrown execution engine called 'Showdown', which is in testing phase and will be open source soon. All the results would be public on a live scoreboard during the competition.

## Features

### Editor

This part of the Hunter allows users to create their custom competitions. They can edit the meta data and scheduling information & define their set of questions. All settings related to competition editing will be there. Users can access the Editor through clicking on any of their created competitions from the Editor page. Users can edit and create any number of competitions they want by just clicking on Create Competition button.

### Participation

Hunter provides clean and non distracting interfaces while participating in competitions. The module of the site is best designed to be viewed on desktops. Any one can participate in a 'Public' competitions whenever they are live. Users can view the questions that the competition contains and start writing code in their preferred language.

### Code Execution

As the participants would be writing code, they have the access to the Hunter's online judge, that compiles, execute and test their submissions against the preset tests defined by the host. Users have the ability to test against the full cases or just the samples cases. Meanwhile, Hunter keep users' last submission saved on its servers, so that the participants do not loose their code due to unexpected exits.

### Scoreboard

Any successful or wrong submissions are evaluated, whose results the participant can see right next to the output in the Evaluation box. All the results for any question will be displayed there. They will get the defined score for the successful submission and one penalty for each wrong submission pre success.

The results of all the questions are accumulated for all the participants in the live scoreboard that rank wise displays their performance.
