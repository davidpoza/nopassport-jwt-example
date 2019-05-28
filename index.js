'use strict';

require('dotenv').config();
const express           = require('express');
const bodyParser        = require('body-parser');
const mongoose          = require('mongoose');
const user_routes       = require('./routes/user');
const customMdw         = require('./middleware/custom');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true })
.catch((err)=>{console.log(err); process.exit(1)});

let app = express();

//conectamos todos los middleware de terceros
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use('/public', express.static(process.cwd() + '/public'));

//conectamos todos los routers
app.use('/api', user_routes);

//el último nuestro middleware para manejar errores
app.use(customMdw.errorHandler);
app.use(customMdw.notFoundHandler);

let port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('express server listening ...');
});

