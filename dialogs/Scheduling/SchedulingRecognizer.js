const { LuisRecognizer } = require('botbuilder-ai');

class SchedulingRecognizer {
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

  async getStartTimeEntities(result) {
    let startTimeValue, startTimeHourValue;

    if (result.entities.$instance.StartTime) {
      startTimeValue = result.entities.$instance.StartTime[0].text;
    }
    if (startTimeValue && result.entities.StartTime[0].datetimeV2) {
      startTimeHourValue = result.entities.StartTime[0].datetimeV2[0][0];
    }

    return { startTime: startTimeValue, datetimeV2: startTimeHourValue };
  }

  async getEndTimeEntities(result) {
    let endTimeValue, endTimeHourValue;

    if (result.entities.$instance.EndTime) {
      endTimeValue = result.entities.$instance.EndTime[0].text;
    }

    if (endTimeValue && result.entities.EndTime[0].datetimeV2) {
      endTimeHourValue = result.entities.EndTime[0].datetimeV2[0][0];
    }

    return { endTime: endTimeValue, datetimeV2: endTimeHourValue };
  }
}

module.exports.SchedulingRecognizer = SchedulingRecognizer;
