const {
  TimexProperty,
} = require('@microsoft/recognizers-text-data-types-timex-expression');
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

class BookingDialog extends CancelAndHelpDialog {
  constructor(id) {
    super(id || 'bookingDialog');

    this.addDialog(new TextPrompt(TEXT_PROMPT))
      .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
      .addDialog(
        new WaterfallDialog(WATERFALL_DIALOG, [
          this.destinationStep.bind(this),
          this.originStep.bind(this),
          this.confirmStep.bind(this),
          this.finalStep.bind(this),
        ])
      );

    this.initialDialogId = WATERFALL_DIALOG;
  }

  // Se uma cidade não estiver definida.
  async destinationStep(stepContext) {
    const bookingDetails = stepContext.options;

    if (!bookingDetails.destination) {
      const messageText = 'Para qual cidade voce gostaria de viajar?';
      const msg = MessageFactory.text(
        messageText,
        messageText,
        InputHints.ExpectingInput
      );
      return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }
    return await stepContext.next(bookingDetails.destination);
  }

  // Quando uma cidade de origem não estiver definida
  async originStep(stepContext) {
    const bookingDetails = stepContext.options;

    bookingDetails.destination = stepContext.result;
    if (!bookingDetails.origin) {
      const messageText = 'Para qual País voce está viajando?';
      const msg = MessageFactory.text(
        messageText,
        'Para qual País voce está viajando?',
        InputHints.ExpectingInput
      );
      return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }
    return await stepContext.next(bookingDetails.origin);
  }

  //Confirmando a informação dada pelo usuário
  async confirmStep(stepContext) {
    const bookingDetails = stepContext.options;

    bookingDetails.travelDate = stepContext.result;
    const messageText = `Please confirm, I have you traveling to: ${bookingDetails.destination}, from: ${bookingDetails.travelDate}. Is this correct?`;
    const msg = MessageFactory.text(
      messageText,
      messageText,
      InputHints.ExpectingInput
    );

    return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
  }

  async finalStep(stepContext) {
    if (stepContext.result === true) {
      const bookingDetails = stepContext.options;
      return await stepContext.endDialog(bookingDetails);
    }
    return await stepContext.endDialog();
  }

  isAmbiguous(timex) {
    const timexPropery = new TimexProperty(timex);
    return !timexPropery.types.has('Definido');
  }
}

module.exports.BookingDialog = BookingDialog;
