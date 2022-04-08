import express from 'express';
import { verifyTwitchSignature } from './services/twitchService';

const app = express();
const port = process.env.PORT || 3000;

const gameEventsData = [];
let events = [];

app.use(express.json({ verify: verifyTwitchSignature }));

app.post("/webhooks/callback", async (req, res) => {
    const messageType = req.header("Twitch-Eventsub-Message-Type");
    if (messageType === "webhook_callback_verification") {
        console.log("Verifying Webhook");
        return res.status(200).send(req.body.challenge);
    }

    const { type } = req.body.subscription;
    const { event } = req.body;

    console.log(
        `Receiving ${type} request for ${event.broadcaster_user_name}: `,
        event
    );
    res.status(200).end();
});

function eventsHandler(request, response): void {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);

    const data = `data: ${JSON.stringify(gameEventsData)}\n\n`;

    response.write(data);

    const eventId = Date.now();

    const newEvent = {
        id: eventId,
        response
    };

    events.push(newEvent);

    request.on('close', () => {
        events = events.filter(event => event.id !== eventId);
    });
}

app.get('/events', eventsHandler);

function sendEventsToAll(newEvent): void {
    gameEventsData.push({ 'event': newEvent, 'id': gameEventsData.length });
    events.forEach(event => event.response.write(`data: ${JSON.stringify({ 'event': newEvent, 'id': gameEventsData.length })}\n\n`))
}

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
