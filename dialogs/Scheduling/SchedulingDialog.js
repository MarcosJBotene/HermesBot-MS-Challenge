const { InputHints, MessageFactory } = require('botbuilder');
const {
  ConfirmPrompt,
  TextPrompt,
  WaterfallDialog,
} = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('../cancelAndHelpDialog');

const TEXT_PROMPT = 'textPrompt';
const CONFIRM_PROMPT = 'confirmPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class SchedulingDialog extends CancelAndHelpDialog {
  constructor(id) {
    super(id || 'shedulingDialog');

    this.addDialog(new TextPrompt(TEXT_PROMPT))
      .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
      .addDialog(
        new WaterfallDialog(WATERFALL_DIALOG, [
          this.startTimeStep,
          this.endTimeStep,
          this.confirmSchedulingStep,
          this.finalStep,
        ])
      );

    this.initialDialogId = WATERFALL_DIALOG;
  }

  async startTimeStep(stepContext) {
    const schedulingDetails = stepContext.options;

    if (schedulingDetails.startTime === schedulingDetails.startTime) {
      const messageText = 'Qual o Horario de Inicio?';
      const msg = MessageFactory.text(
        messageText,
        messageText,
        InputHints.ExpectingInput
      );
      return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }
    return await stepContext.next(schedulingDetails.startTime);
  }

  async endTimeStep(stepContext) {
    const schedulingDetails = stepContext.options;

    schedulingDetails.startTime = stepContext.result;
    if (!schedulingDetails.endTime) {
      const messageText = 'Qual o Horario de Finalização?';
      const msg = MessageFactory.text(
        messageText,
        'Qual o Horario de Finalização?',
        InputHints.ExpectingInput
      );
      return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }
    return await stepContext.next(schedulingDetails.endTime);
  }

  async confirmSchedulingStep(stepContext) {
    const schedulingDetails = stepContext.options;

    schedulingDetails.endTime = stepContext.result;
    const messageText = `Confirme para mim: Dás: ${schedulingDetails.startTime}, até ás: ${schedulingDetails.endTime}?`;
    const msg = MessageFactory.text(
      messageText,
      messageText,
      InputHints.ExpectingInput
    );

    return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
  }

  async finalStep(stepContext) {
    if (stepContext.result === true) {
      const schedulingDetails = stepContext.options;
      return await stepContext.endDialog(schedulingDetails);
    }
    return await stepContext.endDialog();
  }
}

module.exports.SchedulingDialog = SchedulingDialog;
