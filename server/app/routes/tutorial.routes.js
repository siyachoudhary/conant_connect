module.exports = app => {
    const tutorials = require("../controllers/tutorial.controller.js");

    var router = require("express").Router()

    router.post("/", tutorials.create)

    router.get("/:id", tutorials.findOne)

    app.use('/api/tutorials', router)
}