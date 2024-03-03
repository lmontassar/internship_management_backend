//imports
import dotenv from 'dotenv';
dotenv.config();
import './config/connect.js';
import express from 'express';
import cors from 'cors';
import bodyparse from 'body-parser';
/* path */
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const corsOptions = {
    origin: process.env.FRONT_END_ORIGIN,
    optionsSuccessStatus: 200,
  };
app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyparse.json());

import { router as adminRoute } from './cruds/admin.js';
import { router as stagiaireRoute } from './cruds/stagiaire.js';
import { router as stageRoute } from './cruds/stage.js';
import { router as regionRoute } from './cruds/region.js';
import { router as encadrantRoute } from './cruds/encadrant.js';
import { router as posteRoute } from './cruds/poste.js';
/* routes */
app.use('/admin',adminRoute);
app.use('/stagiaire',stagiaireRoute);
app.use('/stage',stageRoute);
app.use('/region',regionRoute);
app.use('/encadrant',encadrantRoute);
app.use('/poste',posteRoute);
app.use('/files', express.static( __dirname + '/uploads/pdf') );

const port = process.env.SERVER_PORT ;
app.listen(port , ()=>{
    console.log('server is working');
})