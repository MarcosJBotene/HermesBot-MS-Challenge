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
  FlightBookingRecognizer,
} = require('./dialogs/flightBookingRecognizer');
const { DialogAndWelcomeBot } = require('./bots/dialogAndWelcomeBot');
const { MainDialog } = require('./dialogs/mainDialog');

// Dialogos do Bot
const { BookingDialog } = require('./dialogs/bookingDialog');
const BOOKING_DIALOG = 'bookingDialog';

// Adaptador
const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword,
});

// Procura por Erros.
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

// If configured, pass in the FlightBookingRecognizer.
const { LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env;
const luisConfig = {
  applicationId: LuisAppId,
  endpointKey: LuisAPIKey,
  endpoint: `https://${LuisAPIHostName}`,
};

const luisRecognizer = new FlightBookingRecognizer(luisConfig);

// Cria os Dialogos Principais.
const bookingDialog = new BookingDialog(BOOKING_DIALOG);
const dialog = new MainDialog(luisRecognizer, bookingDialog);
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
