#! /usr/bin/env node

const express = require('express');
const bodyParser = require('body-parser');
const { Issuer, generators } = require('openid-client');

const { program } = require('commander');
const open = require('open');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const code_verifier = generators.codeVerifier();
const code_challenge = generators.codeChallenge(code_verifier);

const baseUrl = 'https://samples-demo.frontegg.com';
const clientId = '2e53360e-517e-4c38-a040-ba0e8639f2c7';

async function resolveClient() {
    const fronteggIssuer = await Issuer.discover(baseUrl);
    // console.log('Discovered issuer %s %O', fronteggIssuer.issuer, fronteggIssuer.metadata);

    client = new fronteggIssuer.Client({
        client_id: clientId,
        client_secret: 'SOME-DUMMY-SECRET-JUST-BECAUSE-THE-LIB-NEEDS-IT',
        redirect_uris: ['http://localhost:8888/callback'],
        response_types: ['code'],
    });
    return client;
}

app.get('/callback', async (req, res) => {
    const client = await resolveClient();
    const params = client.callbackParams(req);
    const tokenSet = await client.callback('http://localhost:8888/callback', params, { code_verifier });

    // console.log('received and validated tokens %j', tokenSet);
    // console.log('validated ID Token claims %j', tokenSet.claims());

    const userInfo = await client.userinfo(tokenSet);
    console.log('userinfo - ', userInfo);

    res.status(200).send('<h1>Authenticated!</h1>');
});


program.command('login')
    .description('Login to the CLI')
    .action(async () => {
        const client = await resolveClient();
        console.log('authenticating...');
        const url = client.authorizationUrl({
            scope: 'openid email profile',
            code_challenge,
            code_challenge_method: 'S256',
        });

        open(url);
    });

app.listen(8888, () => {
  console.log('Server started on port 8888');
});

program.parse();
