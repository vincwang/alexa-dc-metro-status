const Alexa = require('ask-sdk-core');
const axios = require('axios');
const apiKey = require('./apiKey.js');

const fetchStationPredictionUrl = `https://api.wmata.com/StationPrediction.svc/json/GetPrediction/METRO_STATION_CODES?api_key=${apiKey.api_key}`;

const fetchNextTrainsAtStation = async (metroStationCodes) => {
  try {
    var requestUrl = fetchStationPredictionUrl.replace("METRO_STATION_CODES", metroStationCodes);
    const { data } = await axios.get(requestUrl);
    return data;
  } catch (error) {
    console.error('cannot fetch quotes', error);
  }
};

const groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
};

const pluralizeMinutes = function(minutes) {
    return minutes === 1 ? `1 minute` : `${minutes} minutes`;
}

const pluralizeTrains = function(trains) {
    return trains === 1 ? `1 more train` : `${trains} more trains`;
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {
        
        const speakOutput = `Hello! How can I help you?`;
        const repromptText = 'You can say next silver line at metro center station';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptText)
            .getResponse();
    }
};

const CaptureStationAndLineIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CaptureStationAndLineIntent';
    },
    async handle(handlerInput) {
        const station = handlerInput.requestEnvelope.request.intent.slots.metroStation.value;
        
        let nextTrains;
        try {
            //stations with multiple platforms have multiple codes
            const stationCodes = handlerInput.requestEnvelope.request.intent.slots.metroStation.resolutions.resolutionsPerAuthority[0].values[0].value.id;
            nextTrains = await fetchNextTrainsAtStation(stationCodes);
        } catch (error) {
            console.error(error);
            return handlerInput.responseBuilder
                .speak(`Sorry, there is an issue getting information on ${metroLine} line at ${station}. Plese try again later.`)
                .getResponse();
        }
        
        const metroLine = handlerInput.requestEnvelope.request.intent.slots.metroLine.value;
        const lineCode = handlerInput.requestEnvelope.request.intent.slots.metroLine.resolutions.resolutionsPerAuthority[0].values[0].value.id;
        
        const nextTrainsForLine = nextTrains.Trains.filter(function (train) {
            return train.Line === lineCode 
                && train.Min.match(/^-{0,1}\d+$/); //filter out BRD and no time status
        });
    
        if (nextTrains === undefined || nextTrainsForLine.length === 0) {
            return handlerInput.responseBuilder
            .speak(`There are no ${metroLine} line trains arriving at ${station} at this time. Plese try again later.`)
            .getResponse();
        }    
        
        const nextTrainsForLineGrpByDestinations = groupBy(nextTrainsForLine, 'DestinationCode');
        
        let speech = ``;
        
        // First train of each destination
        let destCounter = 0;
        for (var key1 of Object.keys(nextTrainsForLineGrpByDestinations)) {
            const trainsToSameDest = nextTrainsForLineGrpByDestinations[key1];
            
            if (destCounter === 0) {
                speech += `At ${trainsToSameDest[0].LocationName}, next `;
            } else if (destCounter ===  Object.keys(nextTrainsForLineGrpByDestinations).length - 1){
                speech += `, and next `;
            } else {
                speech += `, next `;
            }
            
            speech += `${metroLine} line train to ${trainsToSameDest[0].DestinationName} will arrive in ${trainsToSameDest[0].Min} minutes`;
            destCounter++;
        }
        speech += destCounter > 0 ? `.` : ``;
        
        // Subsequent trains of each destination
        let hasSaidPrefix = false;
        let destCounterTwo = 0;
        for (var key2 of Object.keys(nextTrainsForLineGrpByDestinations)) {
            let subsequentTrainsToSameDest = nextTrainsForLineGrpByDestinations[key2].slice(1);
            
            if (subsequentTrainsToSameDest.length > 0) {
                if (hasSaidPrefix === false) {
                    speech += subsequentTrainsToSameDest.length === 1 ? `. If you miss your train, there is another` : `. If you miss your train, there are another`;
                }
                speech += hasSaidPrefix === false ? `` : `,`;
                speech += ` ${pluralizeTrains(subsequentTrainsToSameDest.length)} to ${subsequentTrainsToSameDest[0].DestinationName} arriving in`;
                hasSaidPrefix = true;
                for (var i = 0; i < subsequentTrainsToSameDest.length; i++) {
                    if (i > 0 && i === subsequentTrainsToSameDest.length - 1) {
                        speech += ` and ${pluralizeMinutes(subsequentTrainsToSameDest[i].Min)}` ;         
                    } else {
                        speech += ` ${pluralizeMinutes(subsequentTrainsToSameDest[i].Min)}`;         
                    }
                }
            }
            destCounterTwo ++;
        }
        speech += hasSaidPrefix === true ? `.` : ``;
        
        return handlerInput.responseBuilder
             .speak(speech)
             .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.message}`);
        const speakOutput = `Sorry, I couldn't understand what you said. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        CaptureStationAndLineIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    .addErrorHandlers(
        ErrorHandler)
    .lambda();