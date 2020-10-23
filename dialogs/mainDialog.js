const {
  TimexProperty,
} = require('@microsoft/recognizers-text-data-types-timex-expression');
const { MessageFactory, InputHints } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const {
  ComponentDialog,
  DialogSet,
  DialogTurnStatus,
  TextPrompt,
  WaterfallDialog,
} = require('botbuilder-dialogs');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

class MainDialog extends ComponentDialog {
  constructor(luisRecognizer, bookingDialog) {
    super('MainDialog');

    if (!luisRecognizer)
      throw new Error(
        "[MainDialog]: Missing parameter 'luisRecognizer' is required"
      );
    this.luisRecognizer = luisRecognizer;

    // Se o dialogo não existir.
    if (!bookingDialog)
      throw new Error("Missing parameter 'bookingDialog' is required");

    // Se o dialogo não existir.
    this.addDialog(new TextPrompt('TextPrompt'))
      .addDialog(bookingDialog)
      .addDialog(
        new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
          this.introStep.bind(this),
          this.actStep.bind(this),
          this.finalStep.bind(this),
        ])
      );

    this.initialDialogId = MAIN_WATERFALL_DIALOG;
  }

  async run(turnContext, accessor) {
    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    if (results.status === DialogTurnStatus.empty) {
      await dialogContext.beginDialog(this.id);
    }
  }

  // Primeiro passo do dialogo WaterFall
  async introStep(stepContext) {
    if (!this.luisRecognizer.isConfigured) {
      const messageText = 'LUIS não está configurado';
      await stepContext.context.sendActivity(
        messageText,
        null,
        InputHints.IgnoringInput
      );
      return await stepContext.next();
    }

    const messageText = stepContext.options.restartMsg
      ? stepContext.options.restartMsg
      : 'Em que eu posso ajudar?';
    const promptMessage = MessageFactory.text(
      messageText,
      messageText,
      InputHints.ExpectingInput
    );
    return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
  }

  // Second step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
  async actStep(stepContext) {
    const bookingDetails = {};

    if (!this.luisRecognizer.isConfigured) {
      return await stepContext.beginDialog('bookingDialog', bookingDetails);
    }

    const luisResult = await this.luisRecognizer.executeLuisQuery(
      stepContext.context
    );

    switch (LuisRecognizer.topIntent(luisResult)) {
      case 'BookFlight': {
        const fromEntities = this.luisRecognizer.getFromEntities(luisResult);
        const toEntities = this.luisRecognizer.getToEntities(luisResult);

        // Faz o reconhecimento da entidade
        bookingDetails.destination = toEntities.airport;
        bookingDetails.origin = fromEntities.airport;
        bookingDetails.travelDate = this.luisRecognizer.getTravelDate(
          luisResult
        );

        console.log('Detalhes Extraidos:', JSON.stringify(bookingDetails));

        return await stepContext.beginDialog('bookingDialog', bookingDetails);
      }

      // Intenções ainda não cadastradas.
      default: {
        const didntUnderstandMessageText =
          'Me desculpe, não entendi a pergunta...';

        await stepContext.context.sendActivity(
          didntUnderstandMessageText,
          didntUnderstandMessageText,
          InputHints.IgnoringInput
        );
      }
    }

    return await stepContext.next();
  }

  // Retorna o pedido do Usuário.
  async finalStep(stepContext) {
    if (stepContext.result) {
      const result = stepContext.result;
      const timeProperty = new TimexProperty(result.travelDate);
      const travelDateMsg = timeProperty.toNaturalLanguage(
        new Date(Date.now())
      );
      const msg = `I have you booked to ${result.destination} from ${result.origin} on ${travelDateMsg}.`;
      await stepContext.context.sendActivity(
        msg,
        msg,
        InputHints.IgnoringInput
      );
    }

    return await stepContext.replaceDialog(this.initialDialogId, {
      restartMsg: 'O que mais posso fazer por você?',
    });
  }
}

module.exports.MainDialog = MainDialog;
