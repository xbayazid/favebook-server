const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000;

// middle ware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qcbwmei.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

function verifyJWT(req,res,next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send('unauthorized access')
  }

  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
    if(err){
      return res.status(403).send({message: 'forbidden access'})
    }
    req.decoded = decoded;
    next();
  })
}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // console.log(client.connect());
    const postsCollection = client.db("favebook").collection("posts");
    const categoriesCollection = client.db("favebook").collection("categories");
    const booksCollection = client.db("favebook").collection("books");
    const authorsCollection = client.db("favebook").collection("authors");
    const usersCollection = client.db("favebook").collection("users");
    const groupsCollection = client.db("favebook").collection("groups");


    app.get('/jwt', async(req, res) => {
      await client.connect();
      const email = req.query.email;
      const query = {
        email: email
      };

      const user = await usersCollection.findOne(query);
      if(user) {
        const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        })
        return res.send({accessToken: token})
      }
      res.status(403).send({accessToken: ""})
    });

    // app.get('/posts', async (req, res) =>{
    //   await client.connect();
    //   const query = {};
    //   const posts = await postsCollection.find(query).toArray();
    //   res.send(posts)
    // });

    app.get('/posts/:id', async (req, res) =>{
      await client.connect();
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const post = await postsCollection.findOne(query);
      res.send(post);
    });

    app.get("/posts", async(req, res) => {
      await client.connect();
      const email = req.query.email;
      const query = {email: email};
      const post = await postsCollection.find(query).toArray();
      res.send(post)
    })

    app.post('/posts', async(req, res) => {
      await client.connect();
      const post = req.body;
      const result = await postsCollection.insertOne(post);
      res.send(result);
    })

    app.get('/categories', async (req, res) =>{
      await client.connect();
      const query = {};
      const category = await categoriesCollection.find(query).toArray();
      res.send(category)
    });

    app.get("/books", async (req,res) => {
      await client.connect();
      const query = {};
      const books = await booksCollection.find(query).toArray();
      res.send(books);
    });

    app.get("/books/:category", async (req,res) =>{
      await client.connect();
      const category = req.params.category;
      if(category === 'null'){
        const query = {};
        const book = await booksCollection.find(query).toArray();
        res.send(book);
      }
      else{
        const query = {category : category};
      const book = await booksCollection.find(query).toArray();
      res.send(book);
      }
    });

    app.get("/authors", async (req, res) => {
      await client.connect();
      const query = {};
      const authors = await authorsCollection.find(query).toArray();
      res.send(authors);
    });

    // user Related Code

    app.get("/users" , async( req, res ) => {
      await client.connect();
      const query = {};
      const user = await usersCollection.find(query).toArray();
      res.send(user);
    });

    app.get("/users/:email", async(req, res) => {
      await client.connect();
      const email = req.params.email;
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      res.send(user);
    })

    app.post("/users", async (req, res) => {
      await client.connect();
      const user = req.body;
      const query = {
        email: user.email
      }
      const alreadyAssigned = await usersCollection.find(query).toArray();
      if(alreadyAssigned.length){
        return res.send({acknowledged: false});
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });


    // groups related code
    app.get("/groups", async(req, res) => {
      await client.connect();
      const query = {};
      const group = await groupsCollection.find(query).toArray();
      res.send(group);
    })

    app.get("/groups/:id", async(req, res) => {
      await client.connect();
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const group = await groupsCollection.findOne(query);
      res.send(group);
    })

    app.put('/groups/:id', async( req, res ) => {
      await client.connect();
      const id = req.params.id;
      const message = req.body;
      const filter = {_id: new ObjectId(id)};
      const group = await groupsCollection.findOne(filter);
      const messages = group.message;
      const newMessage = [...messages, message];
      const option = {upsert : true};
      const updatedDoc = {
        $set: {
          message: newMessage,
        },
      };
      const result = await groupsCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send(result);
    })

    // temporary to update a field
  //   app.get('/addIsRent', async(req, res) => {
  //     await client.connect();
  //     const filter = {};
  //     const option = { upsert : true };
  //     const updatedDoc = {
  //         $set: {
  //             userImage: 'https://i.ibb.co/jJWpBrY/men-1.png'
  //         }
  //     }
  //     const result = await usersCollection.updateMany(filter, updatedDoc, option);
  //     res.send(result);
  // })
  



  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})