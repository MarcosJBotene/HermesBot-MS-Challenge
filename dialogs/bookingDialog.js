const {
  TimexProperty,
} = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory } = require('botbuilder');
const {
  ConfirmPrompt,
  TextPrompt,
  WaterfallDialog,
} = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class BookingDialog extends CancelAndHelpDialog {
  constructor(id) {
    super(id || 'bookingDialog');

    this.addDialog(new TextPrompt(TEXT_PROMPT))
      .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
      .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
      .addDialog(
        new WaterfallDialog(WATERFALL_DIALOG, [
          this.destinationStep.bind(this),
          this.originStep.bind(this),
          this.travelDateStep.bind(this),
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
      const messageText = 'From what city will you be travelling?';
      const msg = MessageFactory.text(
        messageText,
        'From what city will you be travelling?',
        InputHints.ExpectingInput
      );
      return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }
    return await stepContext.next(bookingDetails.origin);
  }

  /**
   * If a travel date has not been provided, prompt for one.
   * This will use the DATE_RESOLVER_DIALOG.
   */
  async travelDateStep(stepContext) {
    const bookingDetails = stepContext.options;

    // Capture the results of the previous step
    bookingDetails.origin = stepContext.result;
    if (
      !bookingDetails.travelDate ||
      this.isAmbiguous(bookingDetails.travelDate)
    ) {
      return await stepContext.beginDialog(DATE_RESOLVER_DIALOG, {
        date: bookingDetails.travelDate,
      });
    }
    return await stepContext.next(bookingDetails.travelDate);
  }

  //Confirmando a informação dada pelo usuário
  async confirmStep(stepContext) {
    const bookingDetails = stepContext.options;

    bookingDetails.travelDate = stepContext.result;
    const messageText = `Please confirm, I have you traveling to: ${bookingDetails.destination} from: ${bookingDetails.origin} on: ${bookingDetails.travelDate}. Is this correct?`;
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
