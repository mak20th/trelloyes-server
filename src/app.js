//1stsetup this file to export the <app> ready for integration testing
require ('dotenv').config();
const myExpress = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const winston = require('winston'); // logging library to log all failures
const uuid = require('uuid/v4'); // for creating data, post request we need to generate uuid 

const app = myExpress();

//const morganOption = (process.env.Node_ENV === 'production')~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

// set up winston~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
});

if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.use(myExpress.json());// for POSTING we need express.json() middleware to parse the JSON data in the body of the request.

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const cards =[{
  id: 1,
  title: 'Task one',
  content:'thi sis cad oen'  
}];

const lists =[{
  id:1,
  header: 'List One',
  cardIds: [1]
}];

console.log(process.env.API_TOKEN); // to print out the API token key

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~GET ENDPOINTS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
app.get('/', (req, res) => {
  res.send('Hello, boilerplate');
});

//add GET /card and GET /list endpoints that return arrays of cards and lists respectively.
app.get('/card', (req, res) => {
  res
    .json(cards);
});

app.get('/list', (req,res)=>{
  res 
    .json(lists);
});

//in addition to getting a full list of cards or lists, we also need the ability to get an individual card or list by ID.
app.get('/card/:id', (req, res) => {
  const { id } = req.params;
  const card = cards.find(c => c.id === id);

  // make sure we found a card
  if (!card) {
    logger.error(`Card with id ${id} not found.`);
    return res
      .status(404)
      .send('Card Not Found');
  }

  res.json(card);
});

app.get('/list/:id', (req, res) => {
  const { id } = req.params;
  const list = lists.find(li => li.id === id);

  // make sure we found a list
  if (!list) {
    logger.error(`List with id ${id} not found.`);
    return res
      .status(404)
      .send('List Not Found');
  }

  res.json(list);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~POST ENDPOINTS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//~~~~~~~~~~~~~~~endpoin for CARD~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ 
app.post('/card', (req, res)=>{
  // In this route handler, the data must first be extracted from the body
  const { title, content } = req.body;
  // and validated
  if (!title) {
    logger.error('Title is required YO');
    return res
      .status(400)
      .send('Invalid data YO');
  }

  if (!content) {
    logger.error('Content is required YO');
    return res
      .status(400)
      .send('Invalid data YO');
  }

  //if they exist then the object constructed and pushed into the array. 
  const id = uuid();
  const card = {
    id,
    title,
    content
  };

  cards.push(card);

  //The response will consist of a 201 Created, a location header and the ID of the created object in the body.
  logger.info(`Card with id ${id} created by AAMIR KHAN`);
  res
    .status(201)
    .location(`http://localhost:8000/card/${id} by AAMIR KHAN`)
    .json(card);
});

//~~~~~endpoint for LIST~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.post('/list', (req, res) => {
  const { header, cardIds = [] } = req.body;

  if (!header) {
    logger.error(`Header is required YO`);
    return res
      .status(400)
      .send('Invalid data');
  }

  // check card IDs
  if (cardIds.length > 0) {
    let valid = true;
    cardIds.forEach(cid => {
      const card = cards.find(c => c.id === cid);
      if (!card) {
        logger.error(`Card with id ${cid} not found in cards array YO.`);
        valid = false;
      }
    });

    if (!valid) {
      return res
        .status(400)
        .send('Invalid data');
    }
  }

  // get an id
  const id = uuid();

  const list = {
    id,
    header,
    cardIds
  };

  lists.push(list);

  logger.info(`List with id ${id} created`);

  res
    .status(201)
    .location(`http://localhost:8000/list/${id}`)
    .json({id});
});
    
//~~~~~~~~~~~DELETE list~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//Deleting the list is a simple matter of removing it from the array of lists after validating that the ID is correct.
app.delete('/list/:id', (req, res) => {
  const { id } = req.params; // req.params.id will have the value of what is passed in the endpoint

  const listIndex = lists.findIndex(li => li.id === id); // will store the index position of where the list is

  if (listIndex === -1) {
    logger.error(`List with id ${id} not found.`);
    return res
      .status(404)
      .send('Not Found');
  }

  lists.splice(listIndex, 1);

  logger.info(`List with id ${id} deleted.`);
  res
    .status(204)
    .end();
});

//~~~~~~~~~~~~~~~Deleting the CARD~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
app.delete('/card/:id', (req, res) => {
  const { id } = req.params;

  const cardIndex = cards.findIndex(c => c.id == id);

  if (cardIndex === -1) {
    logger.error(`Card with id ${id} not found.`);
    return res
      .status(404)
      .send('Not found');
  }

  //remove card from lists
  //assume cardIds are not duplicated in the cardIds array
  lists.forEach(list => {
    const cardIds = list.cardIds.filter(cid => cid !== id);
    list.cardIds = cardIds;
  });

  cards.splice(cardIndex, 1);

  logger.info(`Card with id ${id} deleted.`);

  res
    .status(204)
    .end();
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~MIDDLEWARE STUFF~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//authorization middleware that validates that an Authorization header with an API token is present.
app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;   
  const authToken = req.get('Authorization');
  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`); //If the authorization fails, create
    // an error log statement with some information that may be helpful then respond to the client
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  // move to the next middleware
  next();
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
app.use(function errorHandler(error, req, res, next) {
  let response;
  //if (process.env.NODE_ENV === 'production') {
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});
module.exports = app;
