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

class GymOpeningDaysDialog extends CancelAndHelpDialog {
  constructor(id) {
    super(id || 'gymOpeningDaysDialog');

    this.addDialog(new TextPrompt(TEXT_PROMPT))
      .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
      .addDialog(
        new WaterfallDialog(WATERFALL_DIALOG, [this.gymIsOpen.bind(this)])
      );
    this.initialDialogId = WATERFALL_DIALOG;
  }

  async gymIsOpen(context) {
    const gymOpeningDaysDetails =
      'A Academia está aberta de Segunda a Sexta, dás 05:00 às 22:00 da noite.';
    const msg = MessageFactory.text(
      gymOpeningDaysDetails,
      gymOpeningDaysDetails,
      InputHints.ExpectingInput
    );

    return await context.prompt(CONFIRM_PROMPT, { prompt: msg });
  }
}

module.exports.GymOpeningDaysDialog = GymOpeningDaysDialog;
