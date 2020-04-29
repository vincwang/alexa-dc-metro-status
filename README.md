<div align="center">
  <h1>WMATA DC Metro Status</h1>
  <p align="center"> 
    <img src="./screenshots/invoke_with_alexa.png" style="box-shadow: 0px 0px 20px 0px rgba(189,182,189,1)">
  </p>
</div>

You can ask Alexa what time your next train arrives at your station!

## Technologies
- **Node.js**: Backend to create the skills
- **AWS Lambda**: Backend to host the skills

## Data Provider
- **[WMATA](https://developer.wmata.com/)**: Washington Metropolitan Area Transit Authority API

## Key features
Note you don't have to say the same exact sentences. Alexa is smart enough to parse your sentence into commands that she understands with this skill and reply to you with information you ask. She will also ask to clarify if she needs more information such as the line color and the station name.

You can say "Alexa ask metro status for next silver line train at Metro Center station".

1. **Arrival times of the next trains to each destination**: Since a metro line is bi-directional and sometimes it stops at different destinations, Alexa will list out the trains to each destination for you.
2. **Subsequent arrival times after the next train**: In case you can not make it to the very next train, Alexa will list out the subsequent trains' arrival times as well.

## How to use the features
You can either invoke the skill about saying "open metro status" or just directly ask Alexa a question by saying things like "Alexa ask metro status for next silver line train at metro center?"


Ask about a state|She will ask to clarify if you didn't provide a state|If you have asked about a state before, she will remember it so you don't have to say it again next time
:-------------------------:|:-------------------------:|:-------------------------:
![](./screenshots/capture_state_intent1.png)|![](./screenshots/capture_state_intent2.png)|![](./screenshots/capture_current_state_intent.png)

Ask about a country   |Ask about global summary   |  Aak about top countires and top states
:-------------------------:|:-------------------------:|:-------------------------:
![](./screenshots/capture_country_intent.png)|![](./screenshots/capture_global_intent.png)|![](./screenshots/capture_top_countries_and_states_intents.png)
