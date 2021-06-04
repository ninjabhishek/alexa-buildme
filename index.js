"use strict";

const Alexa = require("ask-sdk-core");

const request = require("request");

const fs = require("fs");

const appName = "jenkins builder";

var jenkinsapi = require('jenkins-api');

var jenkins = jenkinsapi.init('http://admin:admin@134.209.158.22:8080');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "Launchrequest";
  },
  handle(handlerInput) {
    let speechText = "Welcome to my jenkins builder. You can say, run job";
    let displayText = "Welcome to my jenkins builder.";
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(appName, displayText)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    //help text for your skill
    let speechText = "You can say, run job";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(appName, speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name ===
        "AMAZON.CancelIntent" ||
        handlerInput.requestEnvelope.request.intent.name ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    let speechText = "Goodbye";
    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard(appName, speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    //any cleanup logic goes here
    return handlerInput.responseBuilder.getResponse();
  },
};

//custom skill
const RunPipelineHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "buildintent"
    );
  },
  async handle(handlerInput) {
    let speechText = "";
    let displayText = "";
    let intent = handlerInput.requestEnvelope.request.intent;
    let jobName = intent.slots.pipeline.value;
    if (jobName) {
      const job = jobName.toString();
      speechText = await build(job);
      displayText = speechText;
      return handlerInput.responseBuilder
        .speak(speechText)
        .withSimpleCard(appName, displayText)
        .withShouldEndSession(true)
        .getResponse();
    } else {
      //ask for required input
      return handlerInput.responseBuilder
        .addDelegateDirective(intent)
        .getResponse();
    }
  },
};

async function build(job) {
  let speechText = '';
  jenkins.job_info(job, function(err, data) {
    if (err){ 
      speechText = `Error finding job ${job}.` 
    }
    if(data) {
      if(data.name && data.name === job) {
        jenkins.build(job, function(err, data) {
          if (err){ 
            speechText=`Error running job ${job}.`; 
          }
          if(data) {
            speechText = `Job ${job} started successfully.`;
          }
        });
      } else {
        speechText = `Job ${job} does not exist.`
      }
    }
  });
  await sleep(2000);
  return speechText;
}

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

//Lambda handler function
//Remember to add custom request handlers here
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    RunPipelineHandler
  )
  .lambda();
