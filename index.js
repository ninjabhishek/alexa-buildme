'use strict';

const Alexa = require('ask-sdk-core');

const request = require('request');

const fs = require('fs');
const daysJson = JSON.parse(fs.readFileSync('daysOfWeek.json'));

const appName = 'rail enquiry'

const baseUrl = 'https://api.railbeeps.com/api/searchTrains/api-key/web-cfc8cf88fa0ac3b6fd8f9570608c6911';

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'Launchrequest';
    },
    handle(handlerInput) {
        let speechText = 'Welcome to the railway enquiry. You can say, check PNR status';
        let displayText = "Welcome to the railway enquiry.";
        return handlerInput.responseBuilder.speak(speechText)
                .reprompt(speechText)
                .withSimpleCard(appName, displayText)
                .getResponse();
    }
}


const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        //help text for your skill
        let speechText = 'You can say, add 3 and 5';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard(appName, speechText)
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
        let speechText = 'Goodbye';
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard(appName, speechText)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        //any cleanup logic goes here
        return handlerInput.responseBuilder.getResponse();
    }
};

//custom skill
const TrainInfoHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
                && handlerInput.requestEnvelope.request.intent.name === 'traininforequest';
    },
    handle(handlerInput) {
        let speechText = '';
        let displayText = '';
        let intent = handlerInput.requestEnvelope.request.intent;
        let trainNo = intent.slots.trainNo.value;
        if(trainNo) {
            const validTrainNo = trainNo.toString().length;
            const intTrainNo = Number.isInteger(trainNo)

            if(validTrainNo == 5 && intTrainNo && trainNo>0) {
                request(baseUrl + '?trainno=' + trainNo, { json:true }, (err, res, body) => {
                    if(err) {
                        speechText = `Internal error occurred while fetching data for train ${trainNo}. Please try again.`
                        break;
                    }
                    if(body.length > 1 || body.length == 0) {
                        speechText = `Train number ${trainNo} does not exist. Please try again with a valid train number.`
                        break;
                    }
                    const trainName = body[0].display.substring(8, input_string.indexOf(" ("));
                    const start = body[0].source_name;
                    const end = body[0].destination_name;
                    const daysPattern = body[0].runson;
                    speechText = `Train number ${trainNo}, ${trainName}, runs from ${start} to ${end} ${daysOfWeek(daysPattern)}.`
                })
                displayText = speechText;
                return handlerInput.responseBuilder
                        .speak(speechText)
                        .withSimpleCard(appName, displayText)
                        .withShouldEndSession(true)
                        .getResponse();
            } else {
                //ask for required input
                return handlerInput.responseBuilder.addDelegateDirective(intent)
                    .getResponse();
            }      
        }
    }
}

function daysOfWeek(pattern) {
    let days = '';
    if(pattern = '1111111') {
        days = 'All days of the week.'
    }
    days = 'On'
    const number = pattern.toString();
    for(var i = 0; i < number.length; i++) {
        if(number.charAt(i) == '1')
        days = days + ' ' + daysJson.i
    }
    return days;
}

//Lambda handler function
//Remember to add custom request handlers here
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        RunPipelineHandler).lambda();