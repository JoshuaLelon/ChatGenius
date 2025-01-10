import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  User: a
    .model({
      email: a.string().required(),
      username: a.string().required(),
      avatar: a.string(),
      status: a.string(),
      lastSeen: a.datetime(),
    })
    .authorization((allow) => allow.authenticated()),

  Channel: a
    .model({
      name: a.string().required(),
      description: a.string(),
      type: a.enum(['PUBLIC', 'PRIVATE', 'DIRECT']),
      createdBy: a.hasOne('User', 'createdChannels'),
      members: a.hasMany('User', 'joinedChannels'),
      messages: a.hasMany('Message', 'channel'),
      createdById: a.string(),
    })
    .authorization((allow) => allow.authenticated()),

  Message: a
    .model({
      content: a.string().required(),
      type: a.enum(['TEXT', 'IMAGE', 'FILE']),
      sender: a.hasOne('User', 'messages'),
      channel: a.hasOne('Channel', 'messages'),
      replyTo: a.hasOne('Message', 'replies'),
      attachments: a.hasMany('Attachment', 'message'),
      senderId: a.string(),
      channelId: a.string(),
      replyToId: a.string(),
    })
    .authorization((allow) => allow.authenticated()),

  Attachment: a
    .model({
      url: a.string().required(),
      type: a.string().required(),
      size: a.integer(),
      message: a.hasOne('Message', 'attachments'),
      messageId: a.string(),
    })
    .authorization((allow) => allow.authenticated()),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
