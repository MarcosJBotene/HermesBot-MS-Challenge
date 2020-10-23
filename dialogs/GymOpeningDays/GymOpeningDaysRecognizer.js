const { LuisRecognizer } = require('botbuilder-ai');

class GymOpeningDaysRecognizer {
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

  async executeLuisQuery(context) {
    return await this.recognizer.recognize(context);
  }

  getGymIsOpenEntities(result) {
    let gymIsOpenValue, keyWordsDaysValue;

    if (result.entities.$instance.GymIsOpen) {
      gymIsOpenValue = result.entities.$instance.GymIsOpen[0].text;
    }

    if (gymIsOpenValue && result.entities.GymIsOpen[0].KeyWordsDays) {
      keyWordsDaysValue = result.entities.GymIsOpen[0].KeyWordsDays[0];
    }

    return { gymIsOpen: gymIsOpenValue, keyWordsDays: keyWordsDaysValue };
  }
}

module.exports.GymOpeningDaysRecognizer = GymOpeningDaysRecognizer;
