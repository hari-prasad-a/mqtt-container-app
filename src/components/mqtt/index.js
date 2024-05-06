import {useEffect, useState} from 'react';
import { mqtt, iot } from "aws-iot-device-sdk-v2";
import AWS from "aws-sdk";

class AWSCognitoCredentialsProvider {
  constructor(options, expire_interval_in_ms) {
    this.options = options;
    AWS.config.region = options.Region;
    this.source_provider = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: options.IdentityPoolId
    });
    this.aws_credentials =
      {
        aws_region: options.Region,
        aws_access_id: this.source_provider.accessKeyId,
        aws_secret_key: this.source_provider.secretAccessKey,
        aws_sts_token: this.source_provider.sessionToken
      };

    setInterval(async () => {
      await this.refreshCredentialAsync();
    }, expire_interval_in_ms ?? 3600 * 1000);
  }

  getCredentials() {
    return this.aws_credentials;
  }

  async refreshCredentialAsync() {
    return new Promise((resolve, reject) => {
      this.source_provider.get((err) => {
        if (err) {
          reject("Failed to get cognito credentials.");
        }
        else {
          this.aws_credentials.aws_access_id = this.source_provider.accessKeyId;
          this.aws_credentials.aws_secret_key = this.source_provider.secretAccessKey;
          this.aws_credentials.aws_sts_token = this.source_provider.sessionToken;
          this.aws_credentials.aws_region = this.options.Region;
          resolve(this);
        }
      });
    });
  }
}

async function connect_websocket(provider) {
  return new Promise((resolve, reject) => {
    let config = iot.AwsIotMqttConnectionConfigBuilder.new_builder_for_websocket()
      .with_clean_session(true)
      .with_client_id(`pub_sub_sample(${new Date()})`)
      .with_endpoint(process.env.NEXT_PUBLIC_AWS_REGION,)
      .with_credentials(
        process.env.NEXT_PUBLIC_AWS_ENDPOINT,
        provider.aws_credentials.aws_access_id,
        provider.aws_credentials.aws_secret_key,
        provider.aws_credentials.aws_sts_token
      )
      .with_credential_provider(provider)
      .with_use_websockets()
      .with_keep_alive_seconds(30)
      .build();

    console.log('Connecting websocket...');
    const client = new mqtt.MqttClient();
    console.log('new connection ...');
    const connection = client.new_connection(config);
    console.log('setup callbacks ...');
    connection.on('connect', (session_present) => {
      resolve(connection);
      console.log("connection started:");
    });
    connection.on('interrupt', (error) => {
      console.log(`Connection interrupted: error=${error}`);
    });
    connection.on('resume', (return_code, session_present) => {
      console.log(`Resumed: rc: ${return_code} existing session: ${session_present}`);
    });
    connection.on('disconnect', () => {
      console.log('Disconnected');
    });
    connection.on('error', (error) => {
      reject(error);
    });
  });
}

function Mqtt() {

  let connectionPromise;
  let sample_msg_count = 0;
  let user_msg_count = 0;
  let test_topic = "exporting";
  const [data, setData] = useState("");

  async function PubSub() {

    const provider = new AWSCognitoCredentialsProvider({
      IdentityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID,
      Region: process.env.NEXT_PUBLIC_AWS_REGION,
    });

    await provider.refreshCredentialAsync();

    connectionPromise = connect_websocket(provider);

    connectionPromise.then((connection) => {
      connection.subscribe(test_topic, mqtt.QoS.AtLeastOnce, (topic, payload) => {
        const decoder = new TextDecoder('utf8');
        let message = decoder.decode(new Uint8Array(payload));
        console.log(`Message received: topic=\"${topic}\" message=\"${message}\"`);
        setData(JSON?.parse(message)?.message)
      })
    })
      .catch((reason) => {
        console.log(`Error while connecting: ${reason}`);
      });
  }

  useEffect(() => {
    PubSub();
  }, []);

  async function PublishMessage() {
    const msg = `BUTTON CLICKED {${user_msg_count}}`;
    connectionPromise.then((connection) => {
      connection.publish(test_topic, msg, mqtt.QoS.AtLeastOnce).catch((reason) => {
        console.log(`Error publishing: ${reason}`);
      });
    });
    user_msg_count++;
  }

  async function CloseConnection() {
    await connectionPromise?.then((connection) => {
      connection.disconnect()
        .catch((reason) => {
          console.log(`Error publishing: ${reason}`);
        });
    });
  }

  return (
    <>
      <div>
        <button onClick={() => CloseConnection()}>Disconnect</button>
      </div>
      <div id="message">{data}</div>
    </>
  );
}

export default Mqtt;

