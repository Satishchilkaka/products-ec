const express = require('express');
const bodyParser = require('body-parser');
const loginRoutes = require('./routes/login');
const signupRoutes = require('./routes/signup');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(cors());
app.use( loginRoutes);
// app.use('/v1/signup', signupRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
