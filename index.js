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
    const meetingCollection = client.db("favebook").collection("meeting");


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
      const query = {};
      const post = await postsCollection.find(query).toArray();
      res.send(post)
    })

    app.get("/myPosts", async(req, res) => {
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
    });

    app.get("/posts/:id/comments", async (req, res) => {
      await client.connect();
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const post = await postsCollection.findOne(query);
      const comments = await post.comments;
      res.send(comments);
    })

    app.put("/posts/:id/comments", async(req, res) =>{
      await client.connect();
      const id = req.params.id;
      const comment = req.body;
      const filter = { _id: new ObjectId(id) }
      const post = await postsCollection.findOne(filter);
      const comments = post.comments;
      const newComments = [...comments, comment];
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          comments: newComments,
        },
      };
      const result = await postsCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send(result);
    });

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

    app.post("/book", async (req, res) => {
      await client.connect();
      const book = req.body;
      const result = await booksCollection.insertOne(book);
      res.send(result);
    })

    app.get("/authors", async (req, res) => {
      await client.connect();
      const query = {};
      const authors = await authorsCollection.find(query).toArray();
      res.send(authors);
    });

    app.post("/authors", async (req, res) => {
      await client.connect();
      const author = req.body;
      console.log(author)
      const result = await authorsCollection.insertOne(author);
      res.send(result); 
    })

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

    app.get("/user/admin/:email", async (req, res) => {
      await client.connect();
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });


    app.get("/user/author/:email", async (req, res) => {
      await client.connect();
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isAuthor: user?.role === "author" });
    });

    app.get("/user/request/:email", async (req, res) => {
      await client.connect();
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isRequest: user?.role === "authorRequest" });
    });

    app.get("/user/member/:email", async (req, res) => {
      await client.connect();
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isMember: user?.role === "Member" });
    });

    app.put("/users/update/:email", async(req, res) =>{
      await client.connect();
      const action = req.query.action;
      const email = req.params.email;
      const filter = {email: email}
      const user = await usersCollection.findOne(filter);
      const option = { upsert: true };
      let updatedDoc = {};
      if(action === 'request'){
        const meet = req.body;
        updatedDoc = {
          $set: {
            role: 'authorRequest',
            meet: meet.meet,
            bookName: meet.bookName,
          },
        };
      }
      else if(action === 'confirm'){
        updatedDoc = {
          $set: {
            role: 'author',
          },
        };
      }
      else if(action === 'delete'){
        updatedDoc = {
          $set: {
            role: 'Member',
          },
        };
      }
      else{
        updatedDoc = {
          $set: {
            role: 'Member',
          },
        };
      }
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send({acknowledged: true});
    })


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
    });

    app.post("/group", async (req, res) => {
      await client.connect();
      const group = req.body;
      const result = await groupsCollection.insertOne(group);
      res.send(result);
    })

    

    app.put('/joinGroup/:id', async( req, res ) => {
      await client.connect();
      const id = req.params.id;
      const member = req.body;
      const filter = {_id: new ObjectId(id)};
      const group = await groupsCollection.findOne(filter);
      const members = group.members;
      const newMembers = [...members, member];
      const option = {upsert : true};
      const updatedDoc = {
        $set: {
          members: newMembers,
        },
      };
      const result = await groupsCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send(result);
    });

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
    });

    // meeting related code
    app.get("/meeting", async (req, res) => {
      await client.connect()
      const email = req.query.email;
      const query = {email}
      const result = await meetingCollection.find(query).toArray()
      res.send(result);
    });

    app.get("/myMeeting", async (req, res) => {
      await client.connect()
      const email = req.query.email;
      const query = {authorEmail: email}
      const result = await meetingCollection.find(query).toArray()
      res.send(result);
    });

    app.post("/meeting", async (req, res) => {
      await client.connect();
      const meeting = req.body;
      const result = await meetingCollection.insertOne(meeting);
      res.send(result)
    });

    app.put("/meeting/:id", async( req, res ) => {
      await client.connect();
      const meeting = req.body;
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)}
      const option = {upsert : true};
      const updatedDoc = {
        $set: {
          date: meeting.date,
          time: meeting.time,
          status: 'true',
        },
      };
      const result = await meetingCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send(result);
      
    })

    app.delete("/meeting/:id", async (req, res) => {
      await client.connect()
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await meetingCollection.deleteOne(filter);
      res.send(result);
    })



  // temporary to update a field
  //   app.get('/addIsRent', async(req, res) => {
  //     await client.connect();
  //     const filter = {};
  //     const option = { upsert : true };
  //     const updatedDoc = {
  //         $set: {
  //             description: "A book club for the moment, and also for the ages. 📚 If you're looking for fellow bookworms to disc.",
  //             members: []
  //         }
  //     }
  //     const result = await groupsCollection.updateMany(filter, updatedDoc, option);
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