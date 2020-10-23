const { LuisRecognizer } = require('botbuilder-ai');

class FlightBookingRecognizer {
  constructor(config) {
    const luisIsConfigured =
      config && config.applicationId && config.endpointKey && config.endpoint;
    if (luisIsConfigured) {
      const recognizerOptions = {
        apiVersion: 'v3',
      };

      this.recognizer = new LuisRecognizer(config, recognizerOptions);
    }
  }

  get isConfigured() {
    return this.recognizer !== undefined;
  }

  /**
   * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
   * @param {TurnContext} context
   */
  async executeLuisQuery(context) {
    return await this.recognizer.recognize(context);
  }

  getFromEntities(result) {
    let fromValue, fromAirportValue;
    if (result.entities.$instance.From) {
      fromValue = result.entities.$instance.From[0].text;
    }
    if (fromValue && result.entities.From[0].Airport) {
      fromAirportValue = result.entities.From[0].Airport[0][0];
    }

    return { from: fromValue, airport: fromAirportValue };
  }

  getToEntities(result) {
    let toValue, toAirportValue;
    if (result.entities.$instance.To) {
      toValue = result.entities.$instance.To[0].text;
    }
    if (toValue && result.entities.To[0].Airport) {
      toAirportValue = result.entities.To[0].Airport[0][0];
    }

    return { to: toValue, airport: toAirportValue };
  }
}

module.exports.FlightBookingRecognizer = FlightBookingRecognizer;
