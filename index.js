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

// Recognizers
const {
  FlightBookingRecognizer,
} = require('./dialogs/Booking/flightBookingRecognizer');
const {
  GymOpeningDaysRecognizer,
} = require('./dialogs/GymOpeningDays/GymOpeningDaysRecognizer');

const { DialogAndWelcomeBot } = require('./bots/dialogAndWelcomeBot');
const { MainDialog } = require('./dialogs/mainDialog');

// Dialogos
const { BookingDialog } = require('./dialogs/Booking/Booking');
const {
  GymOpeningDaysDialog,
} = require('./dialogs/GymOpeningDays/GymOpeningDays');

const BOOKING_DIALOG = 'bookingDialog';
const GYM_OPENING_DAYS_DIALOG = 'gymOpeningDaysDialog';

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

// Se o LUIS estiver configurado, passa para os Recognizers.
const { LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env;
const luisConfig = {
  applicationId: LuisAppId,
  endpointKey: LuisAPIKey,
  endpoint: `https://${LuisAPIHostName}`,
};

const luisRecognizerBooking = new FlightBookingRecognizer(luisConfig);
const luisRecognizerGymOpeningDays = new GymOpeningDaysRecognizer(luisConfig);

const bookingDialog = new BookingDialog(BOOKING_DIALOG);
const gymOpeningDaysDialog = new GymOpeningDaysDialog(GYM_OPENING_DAYS_DIALOG);
const dialog = new MainDialog(
  luisRecognizerBooking,
  luisRecognizerGymOpeningDays,
  bookingDialog,
  gymOpeningDaysDialog
);

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
