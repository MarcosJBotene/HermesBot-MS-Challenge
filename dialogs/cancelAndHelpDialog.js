const { InputHints } = require('botbuilder');
const { ComponentDialog } = require('botbuilder-dialogs');

class CancelAndHelpDialog extends ComponentDialog {
  async onContinueDialog(innerDc) {
    const result = await this.interrupt(innerDc);
    if (result) {
      return result;
    }
    return await super.onContinueDialog(innerDc);
  }

  async interrupt(innerDc) {
    if (innerDc.context.activity.text) {
      const text = innerDc.context.activity.text.toLowerCase();

      // Calcela um Dialogo.
      switch (text) {
        case 'cancel':
        case 'quit': {
          const cancelMessageText = 'Cancelando...';
          await innerDc.context.sendActivity(
            cancelMessageText,
            cancelMessageText,
            InputHints.IgnoringInput
          );
          return await innerDc.cancelAllDialogs();
        }
      }
    }
  }
}

module.exports.CancelAndHelpDialog = CancelAndHelpDialog;
