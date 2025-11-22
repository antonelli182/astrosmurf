"use server"

import { SendEmailCommand, SESClient, SESClientConfig } from "@aws-sdk/client-ses"


interface SendVerificationRequestParams {
    identifier: string;
    url: string;
}

async function sendVerificationRequest({ identifier: email, url }: SendVerificationRequestParams) {


    const config: SESClientConfig = {
        credentials: {
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_!,
            accessKeyId: process.env.AWS_ACCESS_KEY_!

        },
        region: "us-east-2"
    }
    const client = new SESClient(config);
    const input = {
        Source: "michael@alignarena.com",
        Destination: {
            ToAddresses: [
                email
            ]
        },
        Message: {
            Subject: {
                Data: "Verify Align Arena Account",
            },
            Body: {
                Text: {
                    Data: `Please click here to authenticate - ${url}`
                }
            }
        }
    }

    const command = new SendEmailCommand(input)
    const response = await client.send(command)


    if (response.$metadata.httpStatusCode != 200) {
        const metadata = await response.$metadata
        console.log(metadata)
    }
}

export { sendVerificationRequest }