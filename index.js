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

// This bot's main dialog.
const { DialogAndWelcomeBot } = require('./bots/dialogAndWelcomeBot');
const { MainDialog } = require('./dialogs/mainDialog');

// the bot's booking dialog
const { BookingDialog } = require('./dialogs/bookingDialog');
const BOOKING_DIALOG = 'bookingDialog';

const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword,
});

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  // Send a trace activity, which will be displayed in Bot Framework Emulator
  await context.sendTraceActivity(
    'OnTurnError Trace',
    `${error}`,
    'https://www.botframework.com/schemas/error',
    'TurnError'
  );

  // Send a message to the user
  let onTurnErrorMessage = 'The bot encountered an error or bug.';
  await context.sendActivity(
    onTurnErrorMessage,
    onTurnErrorMessage,
    InputHints.ExpectingInput
  );
  onTurnErrorMessage =
    'To continue to run this bot, please fix the bot source code.';
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

// If configured, pass in the FlightBookingRecognizer.  (Defining it externally allows it to be mocked for tests)
const { LuisAppId, LuisAPIKey, LuisAPIHostName } = process.env;
const luisConfig = {
  applicationId: LuisAppId,
  endpointKey: LuisAPIKey,
  endpoint: `https://${LuisAPIHostName}`,
};

const luisRecognizer = new FlightBookingRecognizer(luisConfig);

// Create the main dialog.
const bookingDialog = new BookingDialog(BOOKING_DIALOG);
const dialog = new MainDialog(luisRecognizer, bookingDialog);
const bot = new DialogAndWelcomeBot(conversationState, userState, dialog);

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log(`\n${server.name} listening to ${server.url}`);
});

server.post('/api/messages', (req, res) => {
  // Route received a request to adapter for processing
  adapter.processActivity(req, res, async (turnContext) => {
    // route to bot activity handler.
    await bot.run(turnContext);
  });
});

// Listen for Upgrade requests for Streaming.
server.on('upgrade', (req, socket, head) => {
  // Create an adapter scoped to this WebSocket connection to allow storing session data.
  const streamingAdapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
  });
  // Set onTurnError for the BotFrameworkAdapter created for each connection.
  streamingAdapter.onTurnError = onTurnErrorHandler;

  streamingAdapter.useWebSocket(req, socket, head, async (context) => {
    // After connecting via WebSocket, run this logic for every request sent over
    // the WebSocket connection.
    await bot.run(context);
  });
});
