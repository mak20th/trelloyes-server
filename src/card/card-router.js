const MyExpress1 = require('express');

const uuid = require('uuid/v4');
const logger = require('../logger');
const { cards, lists } = require('../store');
const cardRouter = MyExpress1.Router();// create a Route using Router.
const bodyparser = MyExpress1.json();//to parse json body in POST methods

cardRouter
  .route('/card')
  .get((req,res)=>{
    //implementation logic goes here
    res
      .json(cards);
  })

  .post(bodyparser, (req, res)=>{
    //implementation logic for POST goes here   

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

cardRouter
  .route('/card/:id')
  .get((req, res)=>{
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
  })

  .delete((req, res) => {
    // move implementation logic into here

    const { id } = req.params;
    const cardIndex = cards.findIndex(c => c.id === id);
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

module.exports = cardRouter;