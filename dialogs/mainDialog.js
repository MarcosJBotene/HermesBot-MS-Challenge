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
  constructor(luisRecognizer, schedulingDialog) {
    super('MainDialog');

    if (!luisRecognizer)
      throw new Error(
        "[MainDialog]: Missing parameter 'luisRecognizer' is required"
      );

    // Se o dialogo não existir.
    if (!schedulingDialog)
      throw new Error("Missing parameter 'schedulingDialog' is required");

    this.luisRecognizer = luisRecognizer;

    this.addDialog(new TextPrompt('TextPrompt'))
      .addDialog(schedulingDialog)
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
      : 'Para marcar um horário, escreva: "18 : 00", para desbloquear o diálogo.';
    const promptMessage = MessageFactory.text(
      messageText,
      messageText,
      InputHints.ExpectingInput
    );
    return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
  }

  async actStep(stepContext) {
    const schedulingDetails = {};
    if (!this.luisRecognizer.isConfigured) {
      return await stepContext.beginDialog(
        'schedulingDialog',
        schedulingDetails
      );
    }

    const luisResult = await this.luisRecognizer.executeLuisQuery(
      stepContext.context
    );

    switch (LuisRecognizer.topIntent(luisResult)) {
      case 'Scheduling': {
        const startTimeEntities = this.luisRecognizer.getStartTimeEntities(
          luisResult
        );
        const endTimeEntities = this.luisRecognizer.getEndTimeEntities(
          luisResult
        );

        schedulingDetails.startTime = startTimeEntities.datetimeV2;
        schedulingDetails.endTime = endTimeEntities.datetimeV2;

        return await stepContext.beginDialog(
          'schedulingDialog',
          schedulingDetails
        );
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
      const msg = `Horario marcado dás ${result.startTime} até às ${result.endTime} horas.`;
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
