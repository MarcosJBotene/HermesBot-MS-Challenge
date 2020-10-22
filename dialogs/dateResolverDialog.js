const { InputHints, MessageFactory } = require('botbuilder');
const { DateTimePrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const {
  TimexProperty,
} = require('@microsoft/recognizers-text-data-types-timex-expression');

const DATETIME_PROMPT = 'datetimePrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class DateResolverDialog extends CancelAndHelpDialog {
  constructor(id) {
    super(id || 'dateResolverDialog');
    this.addDialog(
      new DateTimePrompt(
        DATETIME_PROMPT,
        this.dateTimePromptValidator.bind(this)
      )
    ).addDialog(
      new WaterfallDialog(WATERFALL_DIALOG, [
        this.initialStep.bind(this),
        this.finalStep.bind(this),
      ])
    );

    this.initialDialogId = WATERFALL_DIALOG;
  }

  async initialStep(stepContext) {
    const timex = stepContext.options.date;

    const promptMessageText = 'On what date would you like to travel?';
    const promptMessage = MessageFactory.text(
      promptMessageText,
      promptMessageText,
      InputHints.ExpectingInput
    );

    const repromptMessageText =
      "I'm sorry, for best results, please enter your travel date including the month, day and year.";
    const repromptMessage = MessageFactory.text(
      repromptMessageText,
      repromptMessageText,
      InputHints.ExpectingInput
    );

    if (!timex) {
      return await stepContext.prompt(DATETIME_PROMPT, {
        prompt: promptMessage,
        retryPrompt: repromptMessage,
      });
    }
    const timexProperty = new TimexProperty(timex);
    if (!timexProperty.types.has('definite')) {
      return await stepContext.prompt(DATETIME_PROMPT, {
        prompt: repromptMessage,
      });
    }
    return await stepContext.next([{ timex: timex }]);
  }

  async finalStep(stepContext) {
    const timex = stepContext.result[0].timex;
    return await stepContext.endDialog(timex);
  }

  async dateTimePromptValidator(promptContext) {
    if (promptContext.recognized.succeeded) {
      const timex = promptContext.recognized.value[0].timex.split('T')[0];

      return new TimexProperty(timex).types.has('definite');
    }
    return false;
  }
}

module.exports.DateResolverDialog = DateResolverDialog;
