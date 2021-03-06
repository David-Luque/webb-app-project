const express = require('express');
const router  = express.Router();
const Boardgame = require('../models/Boardgame')
const Prototipe = require('../models/Prototype');


const checkForAuth = (req, res, next) =>{
  if(req.isAuthenticated()) {
    return next()
  } else {
    res.redirect('/')
  }
}


//Route to see ALL GAMES
router.get('/all-games', checkForAuth, (req, res) =>{
  Boardgame.find({})
  .then(games => {
    res.render('allGames', {games})
  })
})


//Routes to see USER COLLECTIONS
router.get('/games-collection', checkForAuth, (req, res) =>{
  const user = req.user
  Boardgame.find({users_favlist: {$in: [user._id]}})
  .then(games => {
    res.render('userBoardgamesCollection', {games})
  })
  .catch(err=>res.send(err))
})

router.get('/prototipes-collection', checkForAuth, (req, res) => {
  const user = req.user
  Prototipe.find({owner: user._id})
  .then(games => {
    res.render('userProtosCollection', {games})
  })
  .catch(err=>{res.send(err)}) 
  
});


//Routes to see GAME/PROTO DETAILS
router.get('/game-info/:id', checkForAuth, (req, res) => {
  const id = req.params.id
  Boardgame.findById(id)
  .then(game => {
    res.render('gameInfo', game)
  })
  .catch(err=>{res.send(err)})
  
});

router.get('/proto-info/:id', checkForAuth, (req, res) => {
  
  const id = req.params.id
  Prototipe.findById(id)
  .then(game => {
    res.render('protoInfo', game)
  })
  .catch(err=>{res.send(err)}) 
})


//Routes to ADD and COMMENT game
router.post('/add-game/:id', checkForAuth, (req, res) =>{
  
  const id = req.params.id
  const user = req.user
  
  Boardgame.findById(id)
  .then(game => {
      if (game.users_favlist.includes(user._id)) {
        game.alertMessage = "This game is already in your collection";
        res.render('gameInfo', game)
      } else {
        Boardgame.findByIdAndUpdate(id, {$push: {users_favlist: user._id}}, {new: true})
        .then(game => {
          game.alertMessage = "Successfully added to your collection";
          res.render('gameInfo', game)
        })
      } 
  })
})

router.post('/comment-game/:id', checkForAuth, (req, res, next)=>{
  
  const newComment = req.body.comments
  const id = req.params.id
  
  if(newComment == "") {
    Boardgame.findById(id)
    .then(game => {
      game.commentMessage = "Please, insert valid comment";
      res.render('gameInfo', game)
    })
  } else {
    Boardgame.findByIdAndUpdate(id, {$push: {comments: newComment}}, {new: true})
    .then((game) => {
      res.redirect(`/game-info/${game._id}`)
    })
    .catch(err=>{res.send(err)})
  }
})


//Routes to CREATE prototype
router.get('/create-prototipe', checkForAuth, (req, res)=>{
  res.render('createPrototipe')
})

router.post('/create-prototipe', checkForAuth, (req, res)=>{
  const createdProto = req.body
  const user = req.user
  Prototipe.create({...createdProto, owner: user.id})
  .then(()=>{
    res.redirect('/prototipes-collection')
  })
  .catch(err=>res.send(err))
})


//Routes to EDIT prototype
router.post('/add-note/:id', checkForAuth, (req, res, next)=> {
  const id = req.params.id
  const noteToAdd = `. ${req.body.designer_notes}`
  Prototipe.findById(id)
  .then(game => {
    const oldNotes = game.designer_notes;
    const newNotes = oldNotes.concat(noteToAdd)
    Prototipe.findByIdAndUpdate(id, {designer_notes: newNotes}, {new: true})
    .then(result => {
      res.redirect (`/proto-info/${game._id}`)
    })
    
  })
  .catch(err => {res.send(err)})
})

router.get('/edit-proto/:id', checkForAuth, (req, res) => {
  const id = req.params.id
  Prototipe.findById(id)
  .then(game => {
    res.render('editPrototipe', game)
  })
  .catch(err=>{res.send(err)})
});

router.post('/edit-proto/:id', checkForAuth, (req, res) => {
  
  const id = req.params.id
  const editedProto = req.body
  const user = req.user
  
  Prototipe.findByIdAndUpdate(id, {...editedProto, owner: user._id})
  .then(game => {
    res.redirect(`/proto-info/${game._id}`)
  })
  .catch(err=>{res.send(err)})
});


//Routes to REMOVE and DELETE games and prototipes
router.get('/remove-game/:id', checkForAuth, (req, res, next)=>{
  const user = req.user
  const id = req.params.id
  
  Boardgame.findById(id)
  .then((game) => {
    if(game.users_favlist.includes(user._id)) {
      const userIndex = game.users_favlist.indexOf(user._id)
      const usersList = game.users_favlist
      
      usersList.splice(userIndex, 1)
      
      Boardgame.findByIdAndUpdate(id, {users_favlist: usersList}, {new:true})
      .then(() => {
        res.redirect('/games-collection')
      })
    } else {
      // Boardgame.findById(id)
      // .then(game => {
      game.deleteMessage = "This game isn't in your collection ";
      res.render('gameInfo', game)
    // })
    }

  })
  .catch(error => res.send(error))
})

router.get('/remove-prototipe/:id', checkForAuth, (req, res, next)=>{
  const id = req.params.id
  Prototipe.findByIdAndDelete(id)
  .then(() => res.redirect('/prototipes-collection'))
  .catch(error => res.send(error))
})


module.exports = router;