import crypto from 'crypto';

const twitchSigningSecret = process.env.TWITCH_SIGNING_SECRET;

export const verifyTwitchSignature = (req, res, buf, encoding): void => {
    const messageId = req.header("Twitch-Eventsub-Message-Id");
    const timestamp = req.header("Twitch-Eventsub-Message-Timestamp");
    const messageSignature = req.header("Twitch-Eventsub-Message-Signature");
    const time = Math.floor(new Date().getTime() / 1000);
    console.log(`Message ${messageId} Signature: `, messageSignature);

    if (Math.abs(time - timestamp) > 600) {
        console.log(`Verification Failed: timestamp > 10 minutes. Message Id: ${messageId}.`);
        throw new Error("Ignore this request.");
    }

    if (!twitchSigningSecret) {
        console.log(`Twitch signing secret is empty.`);
        throw new Error("Twitch signing secret is empty.");
    }

    const computedSignature =
        "sha256=" +
        crypto
            .createHmac("sha256", twitchSigningSecret)
            .update(messageId + timestamp + buf)
            .digest("hex");
    console.log(`Message ${messageId} Computed Signature: `, computedSignature);

    if (messageSignature !== computedSignature) {
        throw new Error("Invalid signature.");
    } else {
        console.log("Verification successful");
    }
};