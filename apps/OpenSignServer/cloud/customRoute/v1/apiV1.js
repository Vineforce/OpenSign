//--npm modules
import express from 'express';
import cors from 'cors';
export const app = express();
import dotenv from 'dotenv';
import getUser from './routes/getUser.js';
import getDocumentList from './routes/getDocumentList.js';
import getDocument from './routes/getDocument.js';
import getContact from './routes/getContact.js';
import deleteContact from './routes/deleteContact.js';
import getContactList from './routes/getContactList.js';

dotenv.config();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// get user details whose api token used
app.get('/getuser', getUser);

// get all types of documents on the basis of doctype
app.get('/documentlist', getDocumentList);

// get Document on the basis of id
app.get('/document/:document_id', getDocument);

// get contact on the basis of id
app.get('/contact/:contact_id', getContact);

// soft delete contact
app.delete('/contact/:contact_id', deleteContact);

//  get list of contacts
app.get('/contactlist', getContactList);
