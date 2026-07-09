const express = require('express');
const app = express();
const port = 3000;
const userRoutes = require('./routes/userRoutes');



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/user', userRoutes);

app.get('/', (req, res) => {
  res.send('Hello, World!');
} )

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});