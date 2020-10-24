const path = require('path');
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });
const restify = require('restify');
const {
  BotFrameworkAdapter,
  ConversationState,
  InputHints,
  MemoryStorage,
  UserState,
} = require('botbuilder');

const {
  SchedulingRecognizer,
} = require('./dialogs/Scheduling/SchedulingRecognizer');

const { DialogAndWelcomeBot } = require('./bots/dialogAndWelcomeBot');
const { MainDialog } = require('./dialogs/mainDialog');

// Dialogos
const { SchedulingDialog } = require('./dialogs/Scheduling/SchedulingDialog');
const SCHEDULING_DIALOG = 'schedulingDialog';

// Adaptador
const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword,
});

// Retorna Erros da Aplicação.
const onTurnErrorHandler = async (context, error) => {
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  // Manda uma mensagem para o Usuário
  let onTurnErrorMessage = 'O Bot encontrou um Erro/Bug.';
  await context.sendActivity(
    onTurnErrorMessage,
    onTurnErrorMessage,
    InputHints.ExpectingInput
  );

  await conversationState.delete(context);
};

adapter.onTurnError = onTurnErrorHandler;

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

const { LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env;
const luisConfig = {
  applicationId: LuisAppId,
  endpointKey: LuisAPIKey,
  endpoint: `https://${LuisAPIHostName}`,
};

const luisRecognizer = new SchedulingRecognizer(luisConfig);

const schedulingDialog = new SchedulingDialog(SCHEDULING_DIALOG);
const dialog = new MainDialog(luisRecognizer, schedulingDialog);
const bot = new DialogAndWelcomeBot(conversationState, userState, dialog);

// Cria o Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log(`\n${server.name} ouvindo na porta: ${server.url}`);
});

server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (turnContext) => {
    await bot.run(turnContext);
  });
});

server.on('upgrade', (req, socket, head) => {
  const streamingAdapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
  });
  streamingAdapter.onTurnError = onTurnErrorHandler;

  streamingAdapter.useWebSocket(req, socket, head, async (context) => {
    await bot.run(context);
  });
});
