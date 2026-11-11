# Hunter: Contest Hosting Platform

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](CODE_OF_CONDUCT.md)
![](https://badgen.net/badge/MCP%20Support/Yes)

![](https://hunter.cambo.in/assets/hunter-banner.jpg)

Built to simplify the daily coding and normal academic competitions hosting in general. Hunter gives you the ability to create your own competitions and necessary features to maintain and judge your participants.

Visit at [hunter.cambo.in](https://hunter.cambo.in)

<a
    href="https://www.producthunt.com/products/hunter-4?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-hunter-6"
    target="_blank"
    rel="noopener noreferrer"
    ><img
        alt="Hunter - Open Source Contest Hosting Platform | Product Hunt"
        width="250"
        height="54"
        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1312629&amp;theme=light&amp;t=1794393567647"
    />
</a>

## Overview

Users can sign up with Github for the free account and start creating competitions. Along with the competition meta data and scheduling information, you can add questions to your contest. Host can add as many questions they like. A question will consists of statement, sample test cases and final test cases. Each question can have positive and negative marking according to your requirement.

On the side of the participants, users who wish to just participate can get ready in the compete page, where all the competitions, which were made public by the hosts, would appear. Any one can get started with them when they are live. Users can submit the code, test them again samples and final submit and track their performance.

Users submit their solution code to the online judge built for Hunter, that detects the language, compiles it and test it against the test cases provided by the host user. All this is done by a homegrown execution engine called 'Showdown', which is in testing phase and will be open source soon. All the results would be public on a live scoreboard during the competition.

## Question Types Supported

- Coding questions (Hunter started from this)
    - Supported 7 programming languages
    - In built code execution and evaluation
- Multiple choice questions
- Fill in blank questions (Or basic input question)
- Long answer type questions (Useful for essay writing)

## Automatic Evaluation

- Positive marking
- Negative marking
- Case sensitivity configuration for input based questions
- Configure minimum number of words for long answer type questions

### Manual evaluations for long answer type questions

- Full dashboard with participants responses, grading & ranking
- View pending evaluations, read answers and option to grade them manually

## Key Features

| Feature                                 | Description                                                                                                                                                            | Image                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Seamless Automatic Evaluation**       | Build your contest and let Hunter do all the hard work. Configure your questions' rules and grading with effortless settings; so sit back and relax!                   | <img src="https://hunter.cambo.in/assets/evaluation.webp" alt="drawing" width="200"/>  |
| **Built-in Coding Task Support**        | Create custom programming questions effortlessly. Set up problems, test cases, and scoring systems with our intuitive interface.                                       | <img src="https://hunter.cambo.in/assets/coding-task.webp" alt="drawing" width="200"/> |
| **Secure & Always On Time**             | Custom scheduler features according to your needs and rules. Get rid of manual distribution and increase efficiency, with automated visibilities and grading features. | <img src="https://hunter.cambo.in/assets/scheduler.webp" alt="drawing" width="200"/>   |
| **Secure Code Compilation & Execution** | Powerful backend infrastructure handles code compilation and execution. Multiple language support with secure sandboxing.                                              | <img src="https://hunter.cambo.in/assets/question.webp" alt="drawing" width="200"/>    |
| **Essay Evaluation Control**            | View and evaluate your participants' responses that require manual grading. See all the data and details, understand the trends of responses and grade them.           | <img src="https://hunter.cambo.in/assets/insights.webp" alt="drawing" width="200"/>    |
| **Global Participation**                | Share your contests globally. Engage with participants worldwide and foster a community of programmers.                                                                | <img src="https://hunter.cambo.in/assets/workbench.webp" alt="drawing" width="200"/>   |

## Contributing

Contributions are welcome. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for setup
steps, dev commands, and the PR workflow, and read our
**[Code of Conduct](CODE_OF_CONDUCT.md)**. Issues labeled `good first issue`
and `help wanted` are good starting points.
